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
        // 1. Upsert into tbl_Saved_Projects
        const projectData = {
            SP_name: name,
            SP_description: `Saved from Financial Model at ${new Date().toLocaleString()}`,
            SP_approach: state.discountRate.approach === 'direct' ? 1 : 2,
            SP_direct_discount_rate: state.discountRate.directRate,
            SP_beta: state.discountRate.capm.beta,
            SP_riskless_rate: state.discountRate.capm.risklessRate,
            SP_market_risk_premium: state.discountRate.capm.marketRiskPremium,
            SP_debt_ratio: state.discountRate.capm.debtRatio,
            SP_cost_of_borrowing: state.discountRate.capm.costOfBorrowing,
            SP_working_capital_initial_investment: state.workingCapital.initial,
            SP_working_capital_percentage: state.workingCapital.percentageOfRevenue,
            SP_salvageable_fraction: state.workingCapital.salvageFraction,
            SP_tax_rate: state.discountRate.capm.taxRate,
            SP_initial_investment: state.initialInvestment.amount,
            SP_opportunity_cost: state.initialInvestment.opportunityCost,
            SP_lifetime: state.initialInvestment.lifetime,
            SP_salvage_value: state.initialInvestment.salvageValue,
            SP_Depreciation_Method_ID: state.initialInvestment.depreciationMethod === 'ddb' ? 2 : 1,
            SP_tax_credit: state.initialInvestment.taxCredit,
            SP_other_invest: state.initialInvestment.otherInvestments
        };

        const { data: project, error: pError } = await supabase
            .from('tbl_Saved_Projects')
            .upsert(projectData, { onConflict: 'SP_name' })
            .select()
            .single();
        if (pError) {
            console.error('SUPABASE SAVE ERROR (tbl_saved_projects):', pError.message, pError.details, pError.hint);
            throw pError;
        }

        if (!project) {
            throw new Error('Project saved but no data returned. Check RLS or unique constraints.');
        }

        const projectId = project.SP_ID;

        // 2. Clear existing factors (and cascading growth units) to ensure a clean state
        // In a more complex app, we might update individual items, but for now,
        // refreshing the list is most reliable for consistency with state.js.
        await supabase.from('tbl_Other_Factors').delete().eq('OF_Saved_Projects_ID', projectId);

        // 3. Save Revenue and Operating Expenses
        const allItems = [
            ...state.revenue.map(item => ({ ...item, type_id: 1 })),
            ...state.operatingExpenses.map(item => ({ ...item, type_id: 2 }))
        ];

        for (const item of allItems) {
            const factorData = {
                OF_Saved_Projects_ID: projectId,
                OF_type: item.type_id,
                OF_label: item.label,
                OF_value: parseFloat(item.value),
                OF_default_growth_rate: parseFloat(item.growthRate)
            };

            const { data: factor, error: fError } = await supabase
                .from('tbl_Other_Factors')
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
                    GY_Other_Factors_ID: factor.OF_ID,
                    GY_year: parseInt(year),
                    GY_growth_rate: parseFloat(rate)
                }));

                const { error: gError } = await supabase.from('tbl_Growth_Years').insert(growthData);
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
            .from('tbl_Saved_Projects')
            .select('*')
            .eq('SP_name', name)
            .single();

        if (pError) throw pError;

        // 2. Fetch all factors and their growth years
        const { data: factors, error: fError } = await supabase
            .from('tbl_Other_Factors')
            .select(`
                *,
                tbl_Growth_Years (*)
            `)
            .eq('OF_Saved_Projects_ID', project.SP_ID);

        if (fError) throw fError;

        // 3. Map back to state.js structure
        const newState = {
            initialInvestment: {
                amount: project.SP_initial_investment,
                opportunityCost: project.SP_opportunity_cost,
                lifetime: project.SP_lifetime,
                salvageValue: project.SP_salvage_value,
                depreciationMethod: project.SP_Depreciation_Method_ID === 2 ? 'ddb' : 'straight-line',
                taxCredit: project.SP_tax_credit,
                otherInvestments: project.SP_other_invest,
                ddbFactor: 200 // Default or retrieve if added to schema
            },
            workingCapital: {
                initial: project.SP_working_capital_initial_investment,
                percentageOfRevenue: project.SP_working_capital_percentage,
                salvageFraction: project.SP_salvageable_fraction
            },
            discountRate: {
                approach: project.SP_approach === 1 ? 'direct' : 'capm',
                directRate: project.SP_direct_discount_rate,
                capm: {
                    beta: project.SP_beta,
                    risklessRate: project.SP_riskless_rate,
                    marketRiskPremium: project.SP_market_risk_premium,
                    debtRatio: project.SP_debt_ratio,
                    costOfBorrowing: project.SP_cost_of_borrowing,
                    taxRate: project.SP_tax_rate
                },
                calculatedRate: 0 // Will be recalculated by UI
            },
            revenue: [],
            operatingExpenses: []
        };

        factors.forEach(f => {
            const item = {
                id: f.OF_ID, // Use DB ID
                label: f.OF_label,
                value: f.OF_value,
                growthRate: f.OF_default_growth_rate,
                type: f.OF_type === 1 ? 'revenue' : 'operating_expense',
                yearlyGrowth: {}
            };

            const growthYears = f.tbl_Growth_Years || f.tbl_growth_years || [];
            growthYears.forEach(g => {
                const year = g.GY_year || g.gy_year;
                const rate = g.GY_growth_rate || g.gy_growth_rate;
                item.yearlyGrowth[year] = rate;
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
            .from('tbl_Saved_Projects')
            .select('SP_name')
            .order('SP_name');

        if (error) throw error;
        return data.map(p => p.SP_name);
    } catch (err) {
        console.error('Failed to fetch project list:', err);
        return [];
    }
}
