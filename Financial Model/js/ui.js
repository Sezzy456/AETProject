export function renderListItem(item) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.dataset.id = item.id;

    const isExpense = item.type === 'operating_expense';
    const valueColor = isExpense ? 'var(--danger)' : 'var(--success)';

    div.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <div class="item-content">
            <span class="item-label">${item.label}</span>
            <span class="item-value" style="color: ${valueColor}">$${parseFloat(item.value).toLocaleString()}</span>
            <div class="item-growth-wrapper">
                <span class="item-growth">${item.growthRate}% growth</span>
                <button class="btn-set-all" data-id="${item.id}" data-type="${item.type}" data-rate="${item.growthRate}">Set to all years</button>
            </div>
        </div>
        <div class="item-actions">
            <button class="btn-icon edit-item" data-id="${item.id}" data-type="${item.type}" title="Edit">✎</button>
            <button class="btn-icon remove-item" data-id="${item.id}" data-type="${item.type}" title="Remove">×</button>
        </div>
    `;

    return div;
}

export function updateList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        container.appendChild(renderListItem(item));
    });
}

export function toggleConditionalSections(approach) {
    console.log('toggleConditionalSections:', approach);
    const directSec = document.getElementById('section-direct');
    const capmSec = document.getElementById('section-capm');

    if (!directSec || !capmSec) {
        console.error('Missing conditional sections in HTML');
        return;
    }

    if (approach === 'direct') {
        directSec.classList.remove('hidden');
        capmSec.classList.add('hidden');
    } else if (approach === 'capm') {
        directSec.classList.add('hidden');
        capmSec.classList.remove('hidden');
    } else {
        directSec.classList.add('hidden');
        capmSec.classList.add('hidden');
    }
}

export function updateResultsTable(projection, state) {
    const wrapper = document.getElementById('results-table-wrapper');
    const years = projection.years;

    const renderRow = (label, data, isSubtotal = false, isChild = false, formula = '', traceLabel = '', extraClass = '') => {
        const isExpenseRow = label.startsWith('-') || label.toLowerCase().includes('expense');
        return `
            <tr class="${isSubtotal ? 'row-subtotal' : ''} ${isChild ? 'row-child' : ''} ${isExpenseRow ? 'row-expense' : ''} ${extraClass}">
                <td class="sticky-col category-label" data-row="${traceLabel || label}">${label}</td>
                ${data.map((val, t) => {
            let formatted = typeof val === 'number' ? Math.round(val).toLocaleString() : val;
            if (typeof val === 'number' && !label.includes('Factor') && !label.includes('Index')) formatted = '$' + formatted;

            let colorClass = '';
            if (typeof val === 'number' && val !== 0) {
                colorClass = val < 0 ? 'text-danger' : 'text-success';
            }

            const traceKey = `${traceLabel || label}-${t}`;
            const traceData = projection.rows.trace[traceKey];
            const title = traceData ? `${traceData.formula}\n(${traceData.substituted})` : formula;
            const deps = traceData ? JSON.stringify(traceData.deps) : '[]';

            return `<td class="${colorClass}" 
                        title="${title}" 
                        data-row="${traceLabel || label}" 
                        data-year="${t}" 
                        data-deps='${deps}'>${formatted}</td>`;
        }).join('')}
            </tr>
        `;
    };

    const renderHeader = () => {
        return `
            <thead>
                <tr>
                    <th class="sticky-col">Year</th>
                    ${years.map(y => `<th>Year ${y}</th>`).join('')}
                </tr>
            </thead>
        `;
    };

    // Headers
    let html = `<table>${renderHeader()}<tbody>`;

    // Lifetime Index
    html += renderRow('Lifetime Index', projection.rows.subtotals.lifetimeIndex, false, false, "1 if year <= lifetime, else 0");

    // Revenues
    html += `<tr class="row-header sticky-header"><td class="sticky-col category-label" colspan="${years.length + 1}">REVENUES</td></tr>`;
    projection.rows.revenueItems.forEach(item => {
        html += renderRow(`+ ${item.label}`, item.values, false, true, "Compound Growth: Base * (1 + Growth)^t");
    });
    html += renderRow('Total Revenues', projection.rows.subtotals.totalRevenue, true, false, "Sum of all Revenue items", "Total Revenues");

    // Expenses
    html += `<tr class="row-header sticky-header"><td class="sticky-col category-label" colspan="${years.length + 1}">OPERATING EXPENSES</td></tr>`;
    projection.rows.expenseItems.forEach(item => {
        html += renderRow(`- ${item.label}`, item.values, false, true, "Compound Growth: Base * (1 + Growth)^t");
    });
    html += renderRow('Total Expenses', projection.rows.subtotals.totalExpense, true, false, "Sum of all Operating Expense items", "Total Expenses");

    // Operating Cash Flows
    html += `<tr class="row-header sticky-header"><td class="sticky-col category-label" colspan="${years.length + 1}">OPERATING CASH FLOWS</td></tr>`;
    html += renderRow('EBITDA', projection.rows.subtotals.ebitda, true, false, "Total Revenue - Total Expense");
    html += renderRow('- Depreciation', projection.rows.subtotals.depreciation, false, false, "Initial Investment / Lifetime", "Depreciation");
    html += renderRow('EBIT', projection.rows.subtotals.ebit, true, false, "EBITDA - Depreciation");
    html += renderRow('- Tax', projection.rows.subtotals.tax, false, false, "EBIT * Tax Rate");
    html += renderRow('EBT(1-t) / NOPAT', projection.rows.subtotals.nopat, true, false, "Net Operating Profit After Tax: The earnings of the company after operations but before financing costs.", "EBT(1-t) / NOPAT");

    // Cashflow Reconciliation (Moved beneath NOPAT per Excel alignment)
    html += renderRow('+ Depreciation', projection.rows.subtotals.depreciationAddBack, false, false, "Non-cash add back");
    html += renderRow('- Δ Working Capital', projection.rows.subtotals.deltaWorkingCapital, false, false, "Yearly change in Working Capital");
    html += renderRow('- Capital Expenditure / Net Investment', projection.rows.subtotals.capEx, false, false, "Year 0: Net Investment + WC + Opp Cost", "CapEx");
    html += renderRow('NATCF', projection.rows.subtotals.natcf, true, false, "Adjusted Cash Flow calculation", "NATCF");

    // Valuation
    html += `<tr class="row-header sticky-header"><td class="sticky-col category-label" colspan="${years.length + 1}">VALUATION</td></tr>`;
    html += renderRow('Discount Factor', projection.rows.subtotals.discountFactor.map(v => v.toFixed(4)), false, false, "1 / (1 + r)^t", "Discount Factor", "strikethrough");
    html += renderRow('Discounted Cash Flows', projection.rows.subtotals.discountedCF, false, false, "NATCF * Discount Factor", "Discounted Cash Flows", "strikethrough");
    html += renderRow('Compounding Factor', projection.rows.subtotals.compoundingFactor.map(v => v.toFixed(4)), false, false, "(1 + r)^t", "Compounding Factor");
    html += renderRow('Adjusted Cash Flow', projection.rows.subtotals.adjustedCashFlow, true, false, "(NATCF + Salvages) / Compounding Factor", "Adjusted Cash Flow");
    html += renderRow('Cumulative Cash Flows', projection.rows.subtotals.cumulativeCF, true, false, "Running sum of Adjusted Cash Flows", "Cumulative Cash Flows");

    html += `</tbody></table>`;
    wrapper.innerHTML = html;

    // Populate missing cards
    updateInvestmentSummary(state);
    updateInvestmentMeasures(projection.metrics);

    // New: Salvage Value Table
    renderSalvageValueTable(projection);

    // New: Growth Rates Summary
    renderGrowthSummaryTable(projection);

    // New: Book Value & Depreciation
    renderBookValueTable(projection);

    // Show containers
    document.querySelectorAll('.results-container').forEach(c => c.classList.remove('hidden'));

    setupTraceHighlighting();

    document.getElementById('investment-summary-area').scrollIntoView({ behavior: 'smooth' });
}

function setupTraceHighlighting() {
    const cells = document.querySelectorAll('td[data-deps]');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            cell.classList.add('highlight-hover');
            const deps = JSON.parse(cell.dataset.deps);
            deps.forEach(([row, year]) => {
                const sourceCell = document.querySelector(`td[data-row="${row}"][data-year="${year}"]`);
                if (sourceCell) sourceCell.classList.add('highlight-source');
            });
        });
        cell.addEventListener('mouseleave', () => {
            cell.classList.remove('highlight-hover');
            document.querySelectorAll('.highlight-source').forEach(el => el.classList.remove('highlight-source'));
        });
    });
}

function updateInvestmentSummary(state) {
    const wrapper = document.getElementById('summary-table-wrapper');
    const inv = state.initialInvestment.amount || 0;
    const taxCredit = (inv * (state.initialInvestment.taxCredit || 0)) / 100;
    const netInv = inv - taxCredit;
    const wc = state.workingCapital.initial || 0;
    const oppCost = state.initialInvestment.opportunityCost || 0;
    const other = state.initialInvestment.otherInvestments || 0;
    const total = netInv + wc + oppCost + other;

    wrapper.innerHTML = `
        <div class="summary-row"><span>Investment</span> <span>$${inv.toLocaleString()}</span></div>
        <div class="summary-row indent"><span>- Tax Credit</span> <span>$${taxCredit.toLocaleString()}</span></div>
        <div class="summary-row highlight"><span>Net Investment</span> <span>$${netInv.toLocaleString()}</span></div>
        <div class="summary-row"><span>+ Working Cap</span> <span>$${wc.toLocaleString()}</span></div>
        <div class="summary-row"><span>+ Opp. Cost</span> <span>$${oppCost.toLocaleString()}</span></div>
        <div class="summary-row"><span>+ Other invest.</span> <span>$${other.toLocaleString()}</span></div>
        <div class="summary-row final"><span>Total Initial Outlay</span> <span>$${total.toLocaleString()}</span></div>
    `;
}

function updateInvestmentMeasures(metrics) {
    document.getElementById('metric-npv').textContent = '$' + Math.round(metrics.npv).toLocaleString();
    document.getElementById('metric-irr').textContent = metrics.irr !== null ? metrics.irr.toFixed(2) + '%' : 'N/A';
    document.getElementById('metric-roc').textContent = metrics.roc.toFixed(2) + '%';
}

export function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

export function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}

export function renderProjectList(projects, onSelect) {
    const container = document.getElementById('project-list');
    if (!container) return;

    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = '<p class="text-muted">No saved projects found. Save your current data to see them here.</p>';
        return;
    }

    const listDiv = document.createElement('div');
    listDiv.className = 'project-list-items';

    projects.forEach(name => {
        const div = document.createElement('div');
        div.className = 'project-item';
        div.innerHTML = `
            <span class="project-name">${name}</span>
            <button class="btn-primary-sm">Load</button>
        `;
        div.querySelector('button').addEventListener('click', () => onSelect(name));
        listDiv.appendChild(div);
    });

    container.appendChild(listDiv);
}

/**
 * Render the combined Advanced Growth Table for editing.
 */
export function renderAdvancedGrowthTable(state) {
    const wrapper = document.getElementById('advanced-growth-table-wrapper');
    const lifetime = state.initialInvestment.lifetime || 5;
    const items = [...state.revenue, ...state.operatingExpenses];

    if (items.length === 0) {
        wrapper.innerHTML = '<p class="text-muted">No items added yet. Add revenues or expenses to see them here.</p>';
        return;
    }

    let html = `<table class="growth-table">
        <thead>
            <tr>
                <th class="sticky-col">Item Name</th>
                ${Array.from({ length: lifetime }, (_, i) => `<th>Year ${i + 1} (%)</th>`).join('')}
            </tr>
        </thead>
        <tbody>`;

    items.forEach(item => {
        html += `
            <tr>
                <td class="sticky-col">${item.label}</td>
                ${Array.from({ length: lifetime }, (_, i) => {
            const year = i + 1;
            const rate = item.yearlyGrowth[year] !== undefined ? item.yearlyGrowth[year] : item.growthRate;
            return `<td>
                        <input type="number" 
                               class="growth-input" 
                               data-id="${item.id}" 
                               data-type="${item.type}" 
                               data-year="${year}" 
                               value="${rate}" 
                               step="0.1">
                    </td>`;
        }).join('')}
            </tr>
        `;
    });

    html += `</tbody></table>`;
    wrapper.innerHTML = html;
}

/**
 * Render the Growth Summary table in the results area.
 */
export function renderGrowthSummaryTable(projection) {
    const wrapper = document.getElementById('growth-summary-table-wrapper');
    const years = projection.years.filter(y => y > 0); // Aggregate growth usually starts from Year 1 or 2

    let html = `<table>
        <thead>
            <tr>
                <th class="sticky-col">Growth Rate %</th>
                ${years.map(y => `<th>Year ${y}</th>`).join('')}
            </tr>
        </thead>
        <tbody>`;

    // Revenues Header
    html += `<tr class="row-subtotal"><td class="sticky-col">REVENUES</td>${years.map(y => {
        const rate = projection.rows.subtotals.revenueGrowth ? projection.rows.subtotals.revenueGrowth[y] : 0;
        return `<td>${(rate * 100).toFixed(2)}%</td>`;
    }).join('')}</tr>`;

    // Revenue Items
    projection.rows.revenueItems.forEach((item, idx) => {
        html += `<tr class="row-child"><td class="sticky-col">${item.label}</td>${years.map(y => {
            const rate = projection.rows.growthRates.revenueItems[idx][y];
            return `<td>${(rate * 100).toFixed(1)}%</td>`;
        }).join('')}</tr>`;
    });

    // Expenses Header
    html += `<tr class="row-subtotal"><td class="sticky-col">OPERATING EXPENSES</td>${years.map(y => {
        const rate = projection.rows.subtotals.expenseGrowth ? projection.rows.subtotals.expenseGrowth[y] : 0;
        return `<td>${(rate * 100).toFixed(2)}%</td>`;
    }).join('')}</tr>`;

    // Expense Items
    projection.rows.expenseItems.forEach((item, idx) => {
        html += `<tr class="row-child"><td class="sticky-col">${item.label}</td>${years.map(y => {
            const rate = projection.rows.growthRates.expenseItems[idx][y];
            return `<td>${(rate * 100).toFixed(1)}%</td>`;
        }).join('')}</tr>`;
    });

    html += `</tbody></table>`;
    wrapper.innerHTML = html;
}

export function renderSalvageValueTable(projection) {
    const wrapper = document.getElementById('salvage-table-wrapper');
    const years = projection.years;

    let html = `<table>
        <thead>
            <tr>
                <th class="sticky-col">Salvage Value</th>
                ${years.map(y => `<th>Year ${y}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="sticky-col">Equipment</td>
                ${projection.rows.salvageValue.equipment.map((v, t) => {
        const traceKey = `Equipment-${t}`;
        const traceData = projection.rows.trace[traceKey];
        return `<td data-row="Equipment" data-year="${t}" title="${traceData ? traceData.formula + '\n(' + traceData.substituted + ')' : ''}">${v === 0 ? '$0' : '$' + Math.round(v).toLocaleString()}</td>`;
    }).join('')}
            </tr>
            <tr>
                <td class="sticky-col">Working Capital</td>
                ${projection.rows.salvageValue.workingCapital.map((v, t) => {
        const traceKey = `Working Capital-${t}`;
        const traceData = projection.rows.trace[traceKey];
        return `<td data-row="Working Capital" data-year="${t}" title="${traceData ? traceData.formula + '\n(' + traceData.substituted + ')' : ''}">${v === 0 ? '$0' : '$' + Math.round(v).toLocaleString()}</td>`;
    }).join('')}
            </tr>
        </tbody>
    </table>`;
    wrapper.innerHTML = html;
}

export function renderBookValueTable(projection) {
    const wrapper = document.getElementById('book-value-table-wrapper');
    const years = projection.years;

    let html = `<table>
        <thead>
            <tr>
                <th class="sticky-col">Book Value & Depreciation</th>
                ${years.map(y => `<th>Year ${y}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr title="Book Value at start of year">
                <td class="sticky-col">Book Value (Initial)</td>
                ${projection.rows.bookValue.start.map((v, t) => {
        const traceKey = `Book Value (Initial)-${t}`;
        const traceData = projection.rows.trace[traceKey];
        return `<td data-row="Book Value (Initial)" data-year="${t}" title="${traceData ? traceData.formula + '\n(' + traceData.substituted + ')' : ''}">$${Math.round(v).toLocaleString()}</td>`;
    }).join('')}
            </tr>
            <tr title="Depreciation amount for the year">
                <td class="sticky-col">Depreciation</td>
                ${projection.rows.bookValue.depreciation.map((v, t) => {
        const traceKey = `Depreciation-${t}`;
        const traceData = projection.rows.trace[traceKey];
        return `<td data-row="Depreciation" data-year="${t}" title="${traceData ? traceData.formula + '\n(' + traceData.substituted + ')' : ''}">$${Math.round(v).toLocaleString()}</td>`;
    }).join('')}
            </tr>
            <tr title="Book Value at end of year (Initial - Depreciation)">
                <td class="sticky-col">Book Value (End)</td>
                ${projection.rows.bookValue.end.map((v, t) => {
        const traceKey = `Book Value (End)-${t}`;
        const traceData = projection.rows.trace[traceKey];
        return `<td data-row="Book Value (End)" data-year="${t}" title="${traceData ? traceData.formula + '\n(' + traceData.substituted + ')' : ''}">$${Math.round(v).toLocaleString()}</td>`;
    }).join('')}
            </tr>
        </tbody>
    </table>`;
    wrapper.innerHTML = html;
}
