/**
 * Persistence logic using Supabase.
 * Handles saving to and loading from the PostgreSQL database.
 */
import { SUPABASE_CONFIG } from './config.js';

// Initialize Supabase client
// Note: window.supabase is provided by the CDN script in finance_model.html
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} else {
    console.error('Supabase SDK not found. Ensure the CDN script is loaded.');
}

/**
 * Save the entire project state to Supabase.
 * This involves upserting into tbl_Saved_Projects, and refreshing tbl_Other_Factors and tbl_Growth_Years.
 */
export async function saveProject(name, state) {
    if (!supabase) return;

    try {
        // 1. Check if project exists by name to get its ID (avoids unique constraint mismatch)
        const { data: existing } = await supabase
            .from('tbl_saved_projects')
            .select('sp_id')
            .eq('sp_name', name)
            .maybeSingle();

        const projectData = {
            sp_name: name,
            sp_description: `Saved from Financial Model at ${new Date().toLocaleString()}`,
            sp_approach: state.discountRate.approach === 'direct' ? 1 : 2,
            sp_direct_discount_rate: state.discountRate.directRate,
            sp_beta: state.discountRate.capm.beta,
            sp_riskless_rate: state.discountRate.capm.risklessRate,
            sp_market_risk_premium: state.discountRate.capm.marketRiskPremium,
            sp_debt_ratio: state.discountRate.capm.debtRatio,
            sp_cost_of_borrowing: state.discountRate.capm.costOfBorrowing,
            sp_working_capital_initial_investment: state.workingCapital.initial,
            sp_working_capital_percentage: state.workingCapital.percentageOfRevenue,
            sp_salvageable_fraction: state.workingCapital.salvageFraction,
            sp_tax_rate: state.discountRate.capm.taxRate,
            sp_initial_investment: state.initialInvestment.amount,
            sp_opportunity_cost: state.initialInvestment.opportunityCost,
            sp_lifetime: state.initialInvestment.lifetime,
            sp_salvage_value: state.initialInvestment.salvageValue,
            sp_depreciation_method_id: state.initialInvestment.depreciationMethod === 'ddb' ? 2 : 1,
            sp_tax_credit: state.initialInvestment.taxCredit,
            sp_other_invest: state.initialInvestment.otherInvestments
        };

        // If it exists, overwrite by ID
        if (existing) {
            projectData.sp_id = existing.sp_id;
        }

        const { data: project, error: pError } = await supabase
            .from('tbl_saved_projects')
            .upsert(projectData)
            .select()
            .single();

        if (pError) {
            console.error('SUPABASE SAVE ERROR (tbl_saved_projects):', pError.message, pError.details);
            throw pError;
        }

        if (!project) {
            throw new Error('Project saved but no data returned.');
        }

        const projectId = project.sp_id;

        // 2. Clear existing factors
        await supabase.from('tbl_other_factors').delete().eq('of_saved_projects_id', projectId);

        // 3. Save Revenue and Operating Expenses
        const allItems = [
            ...state.revenue.map(item => ({ ...item, type_id: 1 })),
            ...state.operatingExpenses.map(item => ({ ...item, type_id: 2 }))
        ];

        for (const item of allItems) {
            const factorData = {
                of_saved_projects_id: projectId,
                of_type: item.type_id,
                of_label: item.label,
                of_value: parseFloat(item.value),
                of_default_growth_rate: parseFloat(item.growthRate)
            };

            const { data: factor, error: fError } = await supabase
                .from('tbl_other_factors')
                .insert(factorData)
                .select()
                .single();

            if (fError) {
                console.error('SUPABASE FACTOR ERROR:', fError.message, fError.details);
                throw fError;
            }

            // 4. Save Yearly Growth Rates if present
            if (item.yearlyGrowth && Object.keys(item.yearlyGrowth).length > 0) {
                const growthData = Object.entries(item.yearlyGrowth).map(([year, rate]) => ({
                    gy_other_factors_id: factor.of_id,
                    gy_year: parseInt(year),
                    gy_growth_rate: parseFloat(rate)
                }));

                const { error: gError } = await supabase.from('tbl_growth_years').insert(growthData);
                if (gError) {
                    console.error('SUPABASE GROWTH ERROR:', gError.message, gError.details);
                    throw gError;
                }
            }
        }

        console.log(`Project "${name}" saved to Supabase.`);
        return project;
    } catch (err) {
        console.error('Save failed:', err);
        throw err;
    }
}

/**
 * Load a project by name.
 */
export async function loadProject(name) {
    if (!supabase) return null;

    try {
        // 1. Fetch project root
        const { data: project, error: pError } = await supabase
            .from('tbl_saved_projects')
            .select('*')
            .eq('sp_name', name)
            .single();

        if (pError) throw pError;

        // 2. Fetch all factors and their growth years
        const { data: factors, error: fError } = await supabase
            .from('tbl_other_factors')
            .select(`
                *,
                tbl_growth_years (*)
            `)
            .eq('of_saved_projects_id', project.sp_id);

        if (fError) throw fError;

        // 3. Map back to state.js structure
        const newState = {
            initialInvestment: {
                amount: project.sp_initial_investment,
                opportunityCost: project.sp_opportunity_cost,
                lifetime: project.sp_lifetime,
                salvageValue: project.sp_salvage_value,
                depreciationMethod: project.sp_depreciation_method_id === 2 ? 'ddb' : 'straight-line',
                taxCredit: project.sp_tax_credit,
                otherInvestments: project.sp_other_invest,
                ddbFactor: 200 // Default or retrieve if added to schema
            },
            workingCapital: {
                initial: project.sp_working_capital_initial_investment,
                percentageOfRevenue: project.sp_working_capital_percentage,
                salvageFraction: project.sp_salvageable_fraction
            },
            discountRate: {
                approach: project.sp_approach === 1 ? 'direct' : 'capm',
                directRate: project.sp_direct_discount_rate,
                capm: {
                    beta: project.sp_beta,
                    risklessRate: project.sp_riskless_rate,
                    marketRiskPremium: project.sp_market_risk_premium,
                    debtRatio: project.sp_debt_ratio,
                    costOfBorrowing: project.sp_cost_of_borrowing,
                    taxRate: project.sp_tax_rate
                },
                calculatedRate: 0 // Will be recalculated by UI
            },
            revenue: [],
            operatingExpenses: []
        };

        factors.forEach(f => {
            const item = {
                id: f.of_id, // Use DB ID
                label: f.of_label,
                value: f.of_value,
                growthRate: f.of_default_growth_rate,
                type: f.of_type === 1 ? 'revenue' : 'operating_expense',
                yearlyGrowth: {}
            };

            const growthYears = f.tbl_growth_years || [];
            growthYears.forEach(g => {
                item.yearlyGrowth[g.gy_year] = g.gy_growth_rate;
            });

            if (item.type === 'revenue') {
                newState.revenue.push(item);
            } else {
                newState.operatingExpenses.push(item);
            }
        });

        return newState;
    } catch (err) {
        console.error('Load failed:', err);
        return null;
    }
}

/**
 * Get list of project names for the selection modal.
 */
export async function getProjectList() {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('tbl_saved_projects')
            .select('sp_name')
            .order('sp_name');

        if (error) throw error;
        return data.map(p => p.sp_name);
    } catch (err) {
        console.error('Failed to fetch project list:', err);
        return [];
    }
}
/**
 * Delete a project by name.
 */
export async function deleteProject(name) {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('tbl_saved_projects')
            .delete()
            .eq('sp_name', name);

        if (error) throw error;
        console.log(`Project "${name}" deleted.`);
        return true;
    } catch (err) {
        console.error('Delete failed:', err);
        return false;
    }
}
