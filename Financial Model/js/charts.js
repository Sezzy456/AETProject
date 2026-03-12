/**
 * Charting logic using Chart.js
 */
import { calculateNPV } from './calculations.js';

let charts = {
    cashflow: null,
    cumulative: null,
    comparison: null,
    growth: null,
    salvage: null,
    opsBreakdown: null,
    bookValue: null,
    sensitivity: null
};

/**
 * Initialize or update financial charts
 */
export function updateCharts(projection, state) {
    const years = projection.years;
    const labels = years.map(y => `Year ${y}`);
    const labelsNoY0 = years.filter(y => y > 0).map(y => `Year ${y}`);

    // 1. Annual Net Cash Flows
    const totalFlows = projection.internal ? projection.internal.totalCashFlows : projection.rows.subtotals.natcf;
    renderCashflowChart(labels, totalFlows);

    // 2. Cumulative Cash Position
    renderCumulativeChart(labels, projection.rows.subtotals.cumulativeCF);

    // 3. Revenue vs Expenses
    renderComparisonChart(labels, projection.rows.subtotals.totalRevenue, projection.rows.subtotals.totalExpense);

    // 4. Operating Growth Rates
    renderGrowthRatesChart(labelsNoY0, projection.rows.subtotals.revenueGrowth, projection.rows.subtotals.expenseGrowth);

    // 5. Salvage Value Breakdown
    renderSalvageChart(projection.rows.salvageValue);

    // 6. Operating Cashflow Breakdown
    renderOpsBreakdownChart(labels, projection.rows.subtotals);

    // 7. Book Value & Depreciation
    renderBookValueChart(labels, projection.rows.bookValue);

    // 8. NPV Sensitivity
    renderNPVSensitivityChart(projection, state);

    document.getElementById('charts-area').classList.remove('hidden');
}

function renderCashflowChart(labels, natcf) {
    const ctx = document.getElementById('chart-cashflow').getContext('2d');
    if (charts.cashflow) charts.cashflow.destroy();
    charts.cashflow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Annual Cash Flow',
                data: natcf,
                backgroundColor: natcf.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
                borderColor: natcf.map(v => v >= 0 ? '#10b981' : '#ef4444'),
                borderWidth: 1
            }]
        },
        options: getChartOptions('Currency')
    });
}

function renderCumulativeChart(labels, cumulative) {
    const ctx = document.getElementById('chart-cumulative').getContext('2d');
    if (charts.cumulative) charts.cumulative.destroy();
    charts.cumulative = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Cash Position',
                data: cumulative,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: getChartOptions('Currency')
    });
}

function renderComparisonChart(labels, revenues, expenses) {
    const ctx = document.getElementById('chart-comparison').getContext('2d');
    if (charts.comparison) charts.comparison.destroy();
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Total Revenue', data: revenues, backgroundColor: 'rgba(16, 185, 129, 0.6)' },
                { label: 'Total Operating Expenses', data: expenses, backgroundColor: 'rgba(239, 68, 68, 0.6)' }
            ]
        },
        options: getChartOptions('Currency')
    });
}

function renderGrowthRatesChart(labels, revGrowth, expGrowth) {
    const ctx = document.getElementById('chart-growth-rates').getContext('2d');
    if (charts.growth) charts.growth.destroy();

    // Growth data (remove Year 0 which is 0)
    const revData = revGrowth.slice(1).map(v => (v * 100).toFixed(2));
    const expData = expGrowth.slice(1).map(v => (v * 100).toFixed(2));

    charts.growth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Revenue Growth %', data: revData, borderColor: '#10b981', tension: 0.3 },
                { label: 'Expense Growth %', data: expData, borderColor: '#ef4444', tension: 0.3 }
            ]
        },
        options: getChartOptions('Percentage')
    });
}

function renderSalvageChart(salvageRows) {
    const ctx = document.getElementById('chart-salvage').getContext('2d');
    if (charts.salvage) charts.salvage.destroy();

    // Summing values across all years (usually only end year has value)
    const equip = salvageRows.equipment.reduce((a, b) => a + b, 0);
    const wc = salvageRows.workingCapital.reduce((a, b) => a + b, 0);

    charts.salvage = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Equipment Salvage', 'Working Capital Recovery'],
            datasets: [{
                data: [equip, wc],
                backgroundColor: ['#3b82f6', '#10b981'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Space Grotesk' } } }
            }
        }
    });
}

function renderOpsBreakdownChart(labels, subtotals) {
    const ctx = document.getElementById('chart-ops-breakdown').getContext('2d');
    if (charts.opsBreakdown) charts.opsBreakdown.destroy();

    charts.opsBreakdown = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'NOPAT', data: subtotals.nopat, backgroundColor: '#3b82f6' },
                { label: 'Depreciation (+)', data: subtotals.depreciationAddBack, backgroundColor: '#10b981' },
                { label: 'Δ Working Capital (-)', data: subtotals.deltaWorkingCapital.map(v => -v), backgroundColor: '#f59e0b' }
            ]
        },
        options: {
            ...getChartOptions('Currency'),
            scales: {
                ...getChartOptions('Currency').scales,
                x: { stacked: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.03)' } },
                y: { stacked: true, ticks: getChartOptions('Currency').scales.y.ticks, grid: { color: 'rgba(0,0,0,0.05)' } }
            }
        }
    });
}

function renderBookValueChart(labels, bookValue) {
    const ctx = document.getElementById('chart-book-value').getContext('2d');
    if (charts.bookValue) charts.bookValue.destroy();

    charts.bookValue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Annual Depreciation',
                    type: 'bar',
                    data: bookValue.depreciation,
                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                    borderColor: '#ef4444',
                    borderWidth: 1
                },
                {
                    label: 'Book Value (End)',
                    type: 'line',
                    data: bookValue.end,
                    borderColor: '#3b82f6',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: getChartOptions('Currency')
    });
}

function renderNPVSensitivityChart(projection, state) {
    const ctx = document.getElementById('chart-npv-sensitivity').getContext('2d');
    if (charts.sensitivity) charts.sensitivity.destroy();

    // Calculate NPV for rates 0% to 50%
    const rates = [];
    const npvs = [];
    const cashFlows = projection.internal ? projection.internal.totalCashFlows : projection.rows.subtotals.natcf;

    for (let r = 0; r <= 50; r += 2) {
        rates.push(`${r}%`);
        const npv = calculateNPV(r / 100, cashFlows);
        npvs.push(npv);
    }

    charts.sensitivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rates,
            datasets: [{
                label: 'NPV at Discount Rate',
                data: npvs,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                pointRadius: 2,
                tension: 0.3
            }]
        },
        options: {
            ...getChartOptions('Currency'),
            plugins: {
                ...getChartOptions('Currency').plugins,
                tooltip: {
                    callbacks: {
                        label: (context) => `NPV: $${Math.round(context.parsed.y).toLocaleString()}`
                    }
                }
            }
        }
    });
}

function getChartOptions(type) {
    return {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: '#475569', font: { family: 'Space Grotesk', weight: '500' } }
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(0,0,0,0.03)' }
            },
            y: {
                ticks: {
                    color: '#64748b',
                    callback: (value) => {
                        if (type === 'Percentage') return value + '%';
                        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
                    }
                },
                grid: { color: 'rgba(0,0,0,0.05)' }
            }
        }
    };
}
