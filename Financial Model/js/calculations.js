/**
 * Financial calculation logic.
 */

export function calculateNPV(discountRate, cashFlows) {
    // Year 0 is t=0
    return cashFlows.reduce((acc, cf, t) => acc + (cf / Math.pow(1 + discountRate, t)), 0);
}

export function calculateIRR(cashFlows, initialGuess = 0.1) {
    // Basic check: must have at least one positive and one negative flow for IRR to exist
    const hasPositive = cashFlows.some(v => v > 0);
    const hasNegative = cashFlows.some(v => v < 0);
    if (!hasPositive || !hasNegative) return null;

    // Helper to calculate NPV for a given rate
    const getNPV = (rate) => {
        return cashFlows.reduce((acc, cf, t) => acc + (cf / Math.pow(1 + rate, t)), 0);
    };

    // Helper to calculate derivative of NPV for a given rate
    const getDNPV = (rate) => {
        return cashFlows.reduce((acc, cf, t) => acc - (t * cf / Math.pow(1 + rate, t + 1)), 0);
    };

    // 1. Try Newton-Raphson first (fast)
    let guess = (isNaN(initialGuess) || !isFinite(initialGuess)) ? 0.1 : initialGuess;
    const tolerance = 0.5; // Relaxed absolute tolerance for large project values (millions)

    for (let i = 0; i < 50; i++) {
        const npv = getNPV(guess);
        if (Math.abs(npv) < tolerance) return guess * 100;

        const dnpv = getDNPV(guess);
        if (Math.abs(dnpv) < 1e-10) break; // Avoid division by zero

        const nextGuess = guess - npv / dnpv;

        // If diverging or entering invalid range, break to fallback
        if (!isFinite(nextGuess) || nextGuess <= -1 || Math.abs(nextGuess - guess) > 10) break;

        guess = nextGuess;
    }

    // 2. Fallback to Bisection (mathematically guaranteed to converge if signs differ)
    // Define search range: -90% to 10,000%
    let low = -0.9, high = 100.0;
    let npvLow = getNPV(low);
    let npvHigh = getNPV(high);

    // If signs don't differ at boundaries, we might need a wider range or there's no root
    if (npvLow * npvHigh > 0) {
        // Try to expand high range once for extreme cases
        high = 1000.0;
        npvHigh = getNPV(high);
        if (npvLow * npvHigh > 0) return null;
    }

    for (let i = 0; i < 100; i++) {
        const mid = (low + high) / 2;
        const npvMid = getNPV(mid);

        if (Math.abs(npvMid) < tolerance || (high - low) < 0.0000001) {
            return mid * 100;
        }

        if (npvLow * npvMid < 0) {
            high = mid;
            npvHigh = npvMid;
        } else {
            low = mid;
            npvLow = npvMid;
        }
    }

    return null;
}

export function calculateROC(projection) {
    const totalNopat = projection.rows.subtotals.nopat.reduce((a, b) => a + b, 0);
    const totalBVEnd = projection.rows.bookValue.end.reduce((a, b) => a + b, 0);
    return totalBVEnd > 0 ? (totalNopat / totalBVEnd) * 100 : 0;
}

export function calculateCostOfEquity(risklessRate, beta, marketRiskPremium) {
    return risklessRate + (beta * marketRiskPremium);
}

export function calculateWACC(costOfEquity, debtRatio, costOfBorrowing, taxRate) {
    const equityRatio = 1 - debtRatio;
    return (equityRatio * costOfEquity) + (debtRatio * costOfBorrowing * (1 - taxRate));
}

export function calculateDiscountRate(state) {
    const dr = state.discountRate;
    if (dr.approach === 'direct') {
        return dr.directRate;
    } else if (dr.approach === 'capm') {
        const costOfEquity = calculateCostOfEquity(
            dr.capm.risklessRate / 100,
            dr.capm.beta,
            dr.capm.marketRiskPremium / 100
        );
        const wacc = calculateWACC(
            costOfEquity,
            dr.capm.debtRatio / 100,
            dr.capm.costOfBorrowing / 100,
            dr.capm.taxRate / 100
        );
        return wacc * 100;
    }
    return 0;
}

export function generateProjections(state) {
    const lifetime = state.initialInvestment.lifetime || 5;
    const taxRate = (state.discountRate.capm.taxRate || 0) / 100;
    const discountRate = (state.discountRate.calculatedRate || 0) / 100;

    const projection = {
        years: [],
        metrics: { npv: 0, irr: 0, roc: 0 },
        rows: {
            revenueItems: [],
            expenseItems: [],
            growthRates: {
                revenueItems: [],
                expenseItems: []
            },
            salvageValue: {
                equipment: [],
                workingCapital: []
            },
            bookValue: {
                start: [],
                depreciation: [],
                end: []
            },
            subtotals: {
                lifetimeIndex: [],
                totalRevenue: [],
                totalExpense: [],
                revenueGrowth: [],
                expenseGrowth: [],
                ebitda: [],
                depreciation: [],
                ebit: [],
                tax: [],
                nopat: [],
                depreciationAddBack: [],
                deltaWorkingCapital: [],
                capEx: [],
                natcf: [],
                discountFactor: [],
                discountedCF: [],
                compoundingFactor: [],
                adjustedCashFlow: [],
                cumulativeCF: []
            },
            trace: {} // Will store { "RowLabel-Year": { formula: "", substituted: "", deps: [[row, year], ...] } }
        }
    };

    // Initialize row containers
    state.revenue.forEach(item => {
        projection.rows.revenueItems.push({ label: item.label, values: [] });
        projection.rows.growthRates.revenueItems.push([]);
    });
    state.operatingExpenses.forEach(item => {
        projection.rows.expenseItems.push({ label: item.label, values: [] });
        projection.rows.growthRates.expenseItems.push([]);
    });

    const initialAssetValue = parseFloat(state.initialInvestment.amount) || 0;
    const salvageValueAtEnd = parseFloat(state.initialInvestment.salvageValue) || 0;
    const deprMethod = state.initialInvestment.depreciationMethod;
    const ddbFactor = (parseFloat(state.initialInvestment.ddbFactor) || 200) / 100;

    let currentBookValue = initialAssetValue;

    for (let t = 0; t <= lifetime; t++) {
        projection.years.push(t);

        // Lifetime Index
        const lifeIndex = (t > 0 && t <= lifetime) ? 1 : 0;
        projection.rows.subtotals.lifetimeIndex.push(lifeIndex);

        let yearlyRevenue = 0;
        state.revenue.forEach((item, idx) => {
            const baseVal = parseFloat(item.value) || 0;
            const defaultGrowth = (parseFloat(item.growthRate) || 0) / 100;
            let amount = 0;
            let growthUsed = 0;

            if (t === 0) {
                amount = 0;
            } else if (t === 1) {
                amount = baseVal;
            } else {
                const prevAmount = projection.rows.revenueItems[idx].values[t - 1];
                growthUsed = item.yearlyGrowth[t] !== undefined ? (parseFloat(item.yearlyGrowth[t]) / 100) : defaultGrowth;
                amount = prevAmount * (1 + growthUsed);
            }

            projection.rows.revenueItems[idx].values.push(amount);
            projection.rows.growthRates.revenueItems[idx].push(growthUsed);
            yearlyRevenue += amount;
        });

        let yearlyExpense = 0;
        state.operatingExpenses.forEach((item, idx) => {
            const baseVal = parseFloat(item.value) || 0;
            const defaultGrowth = (parseFloat(item.growthRate) || 0) / 100;
            let amount = 0;
            let growthUsed = 0;

            if (t === 0) {
                amount = 0;
            } else if (t === 1) {
                amount = baseVal;
            } else {
                const prevAmount = projection.rows.expenseItems[idx].values[t - 1];
                growthUsed = item.yearlyGrowth[t] !== undefined ? (parseFloat(item.yearlyGrowth[t]) / 100) : defaultGrowth;
                amount = prevAmount * (1 + growthUsed);
            }

            projection.rows.expenseItems[idx].values.push(amount);
            projection.rows.growthRates.expenseItems[idx].push(growthUsed);
            yearlyExpense += amount;
        });

        // Calculate Aggregate Growth
        let revGrowth = 0;
        let expGrowth = 0;
        if (t > 1) {
            const prevTotalRev = projection.rows.subtotals.totalRevenue[t - 1];
            const prevTotalExp = projection.rows.subtotals.totalExpense[t - 1];
            revGrowth = prevTotalRev > 0 ? (yearlyRevenue / prevTotalRev) - 1 : 0;
            expGrowth = prevTotalExp > 0 ? (yearlyExpense / prevTotalExp) - 1 : 0;
        }
        projection.rows.subtotals.revenueGrowth.push(revGrowth);
        projection.rows.subtotals.expenseGrowth.push(expGrowth);

        const trace = projection.rows.trace;
        const key = (label, year) => `${label}-${year}`;

        trace[key('Total Revenues', t)] = {
            formula: 'Sum of all Revenue items',
            substituted: state.revenue.map((item, idx) => Math.round(projection.rows.revenueItems[idx].values[t]).toLocaleString()).join(' + '),
            deps: state.revenue.map(item => [`+ ${item.label}`, t])
        };

        trace[key('Total Expenses', t)] = {
            formula: 'Sum of all Operating Expense items',
            substituted: state.operatingExpenses.map((item, idx) => Math.round(projection.rows.expenseItems[idx].values[t]).toLocaleString()).join(' + '),
            deps: state.operatingExpenses.map(item => [`- ${item.label}`, t])
        };

        const ebitda = yearlyRevenue - yearlyExpense;
        trace[key('EBITDA', t)] = {
            formula: 'Total Revenue - Total Expense',
            substituted: `${Math.round(yearlyRevenue).toLocaleString()} - ${Math.round(yearlyExpense).toLocaleString()}`,
            deps: [['Total Revenues', t], ['Total Expenses', t]]
        };

        // Depreciation & Book Value
        let annualDepr = 0;
        let bvStart = currentBookValue;
        if (t > 0 && t <= lifetime) {
            if (deprMethod === 'straight-line') {
                annualDepr = initialAssetValue / lifetime;
            } else if (deprMethod === 'ddb') {
                annualDepr = bvStart * (ddbFactor / lifetime);
                // Ensure we don't depreciate below zero (or salvage if specified differently, but usually zero for tax book value)
                if (bvStart - annualDepr < 0) annualDepr = bvStart;
            }
        }
        currentBookValue -= annualDepr;
        projection.rows.bookValue.start.push(bvStart);
        projection.rows.bookValue.depreciation.push(annualDepr);
        projection.rows.bookValue.end.push(currentBookValue);

        trace[key('Book Value (Initial)', t)] = {
            formula: t === 0 ? 'Initial Investment' : 'Previous Year End Book Value',
            substituted: Math.round(bvStart).toLocaleString(),
            deps: t === 0 ? [] : [['Book Value (End)', t - 1]]
        };
        trace[key('Depreciation', t)] = {
            formula: deprMethod === 'straight-line' ? 'Initial Investment / Lifetime' : 'Start Book Value * (DDB Factor / Lifetime)',
            substituted: deprMethod === 'straight-line' ? `${Math.round(initialAssetValue).toLocaleString()} / ${lifetime}` : `${Math.round(bvStart).toLocaleString()} * (${ddbFactor} / ${lifetime})`,
            deps: deprMethod === 'straight-line' ? [] : [['Book Value (Initial)', t]]
        };
        trace[key('Book Value (End)', t)] = {
            formula: 'Start Book Value - Depreciation',
            substituted: `${Math.round(bvStart).toLocaleString()} - ${Math.round(annualDepr).toLocaleString()}`,
            deps: [['Book Value (Initial)', t], ['Depreciation', t]]
        };

        const ebit = t === 0 ? 0 : ebitda - annualDepr;
        trace[key('EBIT', t)] = {
            formula: 'EBITDA - Depreciation',
            substituted: `${Math.round(ebitda).toLocaleString()} - ${Math.round(annualDepr).toLocaleString()}`,
            deps: [['EBITDA', t], ['Depreciation', t]]
        };

        const tax = ebit * taxRate; // Fixed: Allow negative tax (tax shield)
        trace[key('- Tax', t)] = {
            formula: 'EBIT * Tax Rate',
            substituted: `${Math.round(ebit).toLocaleString()} * ${(taxRate * 100).toFixed(1)}%`,
            deps: [['EBIT', t]]
        };

        const nopat = ebit - tax;
        trace[key('EBT(1-t) / NOPAT', t)] = {
            formula: 'EBIT - Tax',
            substituted: `${Math.round(ebit).toLocaleString()} - ${Math.round(tax).toLocaleString()}`,
            deps: [['EBIT', t], ['- Tax', t]]
        };

        const wcPercent = (state.workingCapital.percentageOfRevenue || 0) / 100;
        const currentWC = yearlyRevenue * wcPercent;
        const prevRevenue = t === 0 ? 0 : projection.rows.subtotals.totalRevenue[t - 1];
        const prevWC = prevRevenue * wcPercent;
        let deltaWC = t === 0 ? (state.workingCapital.initial || 0) : (currentWC - prevWC);

        let capEx = 0;
        if (t === 0) {
            capEx = (state.initialInvestment.amount || 0) -
                ((state.initialInvestment.amount || 0) * (state.initialInvestment.taxCredit || 0) / 100) +
                (state.initialInvestment.opportunityCost || 0) +
                (state.initialInvestment.otherInvestments || 0);
        }

        // Salvage Value Table
        let equipSalvageValue = 0;
        let wcSalvageValue = 0;
        if (t === lifetime) {
            equipSalvageValue = salvageValueAtEnd;
            const initialWC = state.workingCapital.initial || 0;
            wcSalvageValue = (initialWC + currentWC) * (state.workingCapital.salvageFraction || 0);
        }
        projection.rows.salvageValue.equipment.push(equipSalvageValue);
        projection.rows.salvageValue.workingCapital.push(wcSalvageValue);

        trace[key('Equipment', t)] = {
            formula: t === lifetime ? 'Salvage Value at End' : 'N/A',
            substituted: Math.round(equipSalvageValue).toLocaleString(),
            deps: []
        };
        trace[key('Working Capital', t)] = {
            formula: t === lifetime ? '(Initial WC + Current Year WC) * Salvage Fraction' : 'N/A',
            substituted: t === lifetime ? `(${Math.round(state.workingCapital.initial || 0).toLocaleString()} + ${Math.round(currentWC).toLocaleString()}) * ${state.workingCapital.salvageFraction || 0}` : '0',
            deps: [['Total Revenues', t]]
        };

        const natcfOps = (t === 0) ? -(capEx + deltaWC) : (nopat + annualDepr - deltaWC);
        const totalCF = natcfOps + equipSalvageValue + wcSalvageValue;

        const discountFactor = 1 / Math.pow(1 + discountRate, t);
        const discountedCF = natcfOps * discountFactor; // Keep for reference (strikethrough)
        const compoundingFactor = Math.pow(1 + discountRate, t);
        const adjustedCashFlow = totalCF / compoundingFactor; // Active division formula

        trace[key('NATCF', t)] = {
            formula: t === 0 ? '-(CapEx + ΔWC)' : 'NOPAT + Depr - ΔWC',
            substituted: t === 0 ? `-(${Math.round(capEx).toLocaleString()} + ${Math.round(deltaWC).toLocaleString()})` : `${Math.round(nopat).toLocaleString()} + ${Math.round(annualDepr).toLocaleString()} - ${Math.round(deltaWC).toLocaleString()}`,
            deps: t === 0 ? [['- CapEx / Net Inv.', t], ['- Δ Working Capital', t]] : [['EBT(1-t) / NOPAT', t], ['+ Depreciation', t], ['- Δ Working Capital', t]]
        };

        trace[key('Discount Factor', t)] = {
            formula: '1 / (1 + r)^t',
            substituted: `1 / (1 + ${discountRate.toFixed(4)})^${t}`,
            deps: []
        };
        trace[key('Discounted Cash Flows', t)] = {
            formula: 'NATCF * Discount Factor',
            substituted: `${Math.round(natcfOps).toLocaleString()} * ${discountFactor.toFixed(4)}`,
            deps: [['NATCF', t], ['Discount Factor', t]]
        };
        trace[key('Compounding Factor', t)] = {
            formula: '(1 + r)^t',
            substituted: `(1 + ${discountRate.toFixed(4)})^${t}`,
            deps: []
        };
        trace[key('Adjusted Cash Flow', t)] = {
            formula: '(NATCF + Salvages) / Compounding Factor',
            substituted: `(${Math.round(natcfOps).toLocaleString()} + ${Math.round(equipSalvageValue + wcSalvageValue).toLocaleString()}) / ${compoundingFactor.toFixed(4)}`,
            deps: [['NATCF', t], ['Equipment', t], ['Working Capital', t], ['Compounding Factor', t]]
        };

        const prevCumulative = t === 0 ? 0 : projection.rows.subtotals.cumulativeCF[t - 1];
        const cumulativeCF = prevCumulative + adjustedCashFlow;

        const prevACFs = [];
        for (let i = 0; i <= t; i++) prevACFs.push(['Adjusted Cash Flow', i]);

        trace[key('Cumulative Cash Flows', t)] = {
            formula: 'Running sum of Adjusted Cash Flows',
            substituted: t === 0 ? Math.round(adjustedCashFlow).toLocaleString() : `${Math.round(prevCumulative).toLocaleString()} + ${Math.round(adjustedCashFlow).toLocaleString()}`,
            deps: prevACFs
        };

        projection.rows.subtotals.totalRevenue.push(yearlyRevenue);
        projection.rows.subtotals.totalExpense.push(yearlyExpense);
        projection.rows.subtotals.ebitda.push(ebitda);
        projection.rows.subtotals.depreciation.push(annualDepr);
        projection.rows.subtotals.ebit.push(ebit);
        projection.rows.subtotals.tax.push(tax);
        projection.rows.subtotals.nopat.push(nopat);
        projection.rows.subtotals.depreciationAddBack.push(annualDepr);
        projection.rows.subtotals.deltaWorkingCapital.push(deltaWC);
        projection.rows.subtotals.capEx.push(capEx);
        projection.rows.subtotals.natcf.push(natcfOps);
        projection.rows.subtotals.discountFactor.push(discountFactor);
        projection.rows.subtotals.discountedCF.push(discountedCF);
        projection.rows.subtotals.compoundingFactor.push(compoundingFactor);
        projection.rows.subtotals.adjustedCashFlow.push(adjustedCashFlow);
        projection.rows.subtotals.cumulativeCF.push(cumulativeCF);

        // Internal helper to track total cash flows (with salvages) for IRR
        if (!projection.internal) projection.internal = { totalCashFlows: [] };
        projection.internal.totalCashFlows.push(totalCF);
    }

    // Final Metrics
    const totalCashFlows = projection.internal ? projection.internal.totalCashFlows : projection.rows.subtotals.natcf;
    const adjustedCashFlows = projection.rows.subtotals.adjustedCashFlow;

    // For NPV, we sum the adjusted cash flows as requested for alignment
    const npv = adjustedCashFlows.reduce((sum, val) => sum + val, 0);
    const irr = calculateIRR(totalCashFlows, discountRate);
    const roc = calculateROC(projection);

    projection.metrics.npv = npv;
    projection.metrics.irr = irr;
    projection.metrics.roc = roc;

    return projection;
}
