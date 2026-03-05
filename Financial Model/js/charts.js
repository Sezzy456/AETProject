/**
 * Charting logic using Chart.js
 */

let charts = {
    cashflow: null,
    cumulative: null,
    comparison: null
};

/**
 * Initialize or update financial charts
 */
export function updateCharts(years, results, revenueData, expenseData) {
    const ctxCashflow = document.getElementById('chart-cashflow').getContext('2d');
    const ctxCumulative = document.getElementById('chart-cumulative').getContext('2d');
    const ctxComparison = document.getElementById('chart-comparison').getContext('2d');

    const labels = years.map(y => `Year ${y}`);
    const natcf = results.map(r => r.natcf);
    const cumulative = results.map(r => r.cumulative);

    const revenues = years.map(y => {
        return revenueData.reduce((sum, item) => sum + (item.values[y] || 0), 0);
    });
    const expenses = years.map(y => {
        return expenseData.reduce((sum, item) => sum + (item.values[y] || 0), 0);
    });

    // 1. Annual Net Cash Flows
    if (charts.cashflow) charts.cashflow.destroy();
    charts.cashflow = new Chart(ctxCashflow, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Annual Cash Flow',
                data: natcf,
                backgroundColor: natcf.map(v => v >= 0 ? 'rgba(0, 255, 157, 0.6)' : 'rgba(255, 77, 77, 0.6)'),
                borderColor: natcf.map(v => v >= 0 ? '#00ff9d' : '#ff4d4d'),
                borderWidth: 1
            }]
        },
        options: getChartOptions('Currency')
    });

    // 2. Cumulative Cash Position
    if (charts.cumulative) charts.cumulative.destroy();
    charts.cumulative = new Chart(ctxCumulative, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Cash Position',
                data: cumulative,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: getChartOptions('Currency')
    });

    // 3. Revenue vs Expenses
    if (charts.comparison) charts.comparison.destroy();
    charts.comparison = new Chart(ctxComparison, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(0, 255, 157, 0.6)',
                },
                {
                    label: 'Total Operating Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(255, 77, 77, 0.6)',
                }
            ]
        },
        options: getChartOptions('Currency')
    });

    document.getElementById('charts-area').classList.remove('hidden');
}

function getChartOptions(yAxisLabel) {
    return {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: '#e0e0e0', font: { family: 'Space Grotesk' } }
            }
        },
        scales: {
            x: {
                ticks: { color: '#888' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                ticks: {
                    color: '#888',
                    callback: (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                },
                grid: { color: 'rgba(255,255,255,0.1)' }
            }
        }
    };
}
