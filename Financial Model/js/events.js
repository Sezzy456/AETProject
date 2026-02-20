/**
 * Event handling logic.
 * Orchestrates interaction between UI and State/Logic.
 */
import * as State from './state.js';
import * as UI from './ui.js';
import * as Calc from './calculations.js';
import * as Persist from './persistence.js';

let currentAddItemType = null;
let currentEditItemId = null;

export function setupEventListeners() {
    console.log('setupEventListeners: Initializing...');

    // Initial UI Sync
    try {
        syncUIWithState();
        console.log('setupEventListeners: Initial sync complete.');
    } catch (err) {
        console.warn('Initial sync partially failed or no data:', err);
    }

    // Initial Investment Inputs
    setupInputListener('initial-inv', 'initialInvestment.amount');
    setupInputListener('opp-cost', 'initialInvestment.opportunityCost');
    setupInputListener('lifetime', 'initialInvestment.lifetime', () => {
        UI.renderAdvancedGrowthTable(State.state);
    });
    setupInputListener('salvage-value', 'initialInvestment.salvageValue');
    setupInputListener('depreciation-method', 'initialInvestment.depreciationMethod', (val) => {
        const ddbGroup = document.getElementById('ddb-factor-group');
        if (val === 'ddb') {
            ddbGroup.classList.remove('hidden');
        } else {
            ddbGroup.classList.add('hidden');
        }
    });
    setupInputListener('ddb-factor', 'initialInvestment.ddbFactor');
    setupInputListener('tax-credit', 'initialInvestment.taxCredit');
    setupInputListener('other-investments', 'initialInvestment.otherInvestments');

    // Working Capital Inputs
    setupInputListener('wc-initial', 'workingCapital.initial');
    setupInputListener('wc-percentage', 'workingCapital.percentageOfRevenue');
    setupInputListener('wc-salvage', 'workingCapital.salvageFraction');

    // Discount Rate Inputs
    const approachSelect = document.getElementById('discount-approach');
    approachSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        State.updateState('discountRate.approach', val);
        UI.toggleConditionalSections(val);
        updateCalculatedDiscountRate();
    });

    setupInputListener('direct-rate', 'discountRate.directRate', updateCalculatedDiscountRate);
    setupInputListener('capm-beta', 'discountRate.capm.beta', updateCalculatedDiscountRate);
    setupInputListener('capm-riskless', 'discountRate.capm.risklessRate', updateCalculatedDiscountRate);
    setupInputListener('capm-mrp', 'discountRate.capm.marketRiskPremium', updateCalculatedDiscountRate);
    setupInputListener('capm-debt-ratio', 'discountRate.capm.debtRatio', updateCalculatedDiscountRate);
    setupInputListener('capm-cost-borrowing', 'discountRate.capm.costOfBorrowing', updateCalculatedDiscountRate);
    setupInputListener('capm-tax-rate', 'discountRate.capm.taxRate', updateCalculatedDiscountRate);

    // List Management (Add & Edit & Remove)
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-icon');
        if (!btn) return;

        const id = btn.dataset.id;
        const type = btn.dataset.type;

        if (btn.classList.contains('remove-item')) {
            State.removeItem(type, id);
            UI.updateList(type === 'revenue' ? 'revenue-list' : 'expense-list',
                type === 'revenue' ? State.state.revenue : State.state.operatingExpenses);
            UI.renderAdvancedGrowthTable(State.state);
        }

        if (btn.classList.contains('edit-item')) {
            const list = type === 'revenue' ? State.state.revenue : State.state.operatingExpenses;
            const item = list.find(i => i.id === id);
            if (item) {
                currentAddItemType = type;
                currentEditItemId = id;
                document.getElementById('add-item-title').textContent = `Edit ${type.replace('_', ' ')}`;
                document.getElementById('item-label').value = item.label;
                document.getElementById('item-value').value = item.value;
                document.getElementById('item-growth').value = item.growthRate;
                UI.showModal('modal-add-item');
                document.getElementById('item-confirm').textContent = 'Update';
            }
        }
    });

    // Set all years button
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-set-all')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            const rate = e.target.dataset.rate;
            const lifetime = State.state.initialInvestment.lifetime || 5;
            const yearlyGrowth = {};
            for (let i = 1; i <= lifetime; i++) {
                yearlyGrowth[i] = parseFloat(rate);
            }
            State.setYearlyGrowth(type, id, yearlyGrowth);
            UI.renderAdvancedGrowthTable(State.state);
        }
    });

    // Advanced toggle
    document.getElementById('btn-toggle-advanced').addEventListener('click', () => {
        const area = document.getElementById('advanced-growth-area');
        area.classList.toggle('hidden');
        if (!area.classList.contains('hidden')) {
            UI.renderAdvancedGrowthTable(State.state);
        }
    });

    // Advanced growth input changes
    document.getElementById('advanced-growth-table-wrapper').addEventListener('input', (e) => {
        if (e.target.classList.contains('growth-input')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            const year = e.target.dataset.year;
            const val = parseFloat(e.target.value) || 0;
            State.setYearlyGrowth(type, id, { [year]: val });
        }
    });

    document.querySelectorAll('.add-item').forEach(btn => {
        btn.addEventListener('click', () => {
            currentAddItemType = btn.dataset.type;
            currentEditItemId = null;
            document.getElementById('add-item-title').textContent = `Add ${currentAddItemType.replace('_', ' ')}`;
            document.getElementById('item-confirm').textContent = 'Add';
            UI.showModal('modal-add-item');
            resetAddItemFields();
        });
    });

    // Add/Edit Item Modal
    document.getElementById('item-confirm').addEventListener('click', () => {
        const label = document.getElementById('item-label').value;
        const value = document.getElementById('item-value').value;
        const growth = document.getElementById('item-growth').value;

        if (label && value) {
            if (currentEditItemId) {
                State.updateItem(currentAddItemType, currentEditItemId, { label, value, growthRate: growth });
            } else {
                State.addItem(currentAddItemType, { label, value, growthRate: growth });
            }

            UI.updateList(currentAddItemType === 'revenue' ? 'revenue-list' : 'expense-list',
                currentAddItemType === 'revenue' ? State.state.revenue : State.state.operatingExpenses);
            UI.hideModal('modal-add-item');
            resetAddItemFields();
            UI.renderAdvancedGrowthTable(State.state);
            // Recalculate and update results after item add/edit
            const projections = Calc.generateProjections(State.state);
            UI.updateResultsTable(projections, State.state);
        }
    });

    document.getElementById('item-cancel').addEventListener('click', () => UI.hideModal('modal-add-item'));

    // Action Buttons
    document.getElementById('btn-open-load').addEventListener('click', () => {
        const projects = Persist.getProjectList();
        UI.renderProjectList(projects, (name) => {
            const data = Persist.loadProject(name);
            if (data) {
                State.state.initialInvestment = data.initialInvestment;
                State.state.workingCapital = data.workingCapital;
                State.state.discountRate = data.discountRate;
                State.state.revenue = data.revenue;
                State.state.operatingExpenses = data.operatingExpenses;

                syncUIWithState();
                UI.updateList('revenue-list', State.state.revenue);
                UI.updateList('expense-list', State.state.operatingExpenses);
                UI.toggleConditionalSections(State.state.discountRate.approach);
                UI.hideModal('modal-load');
                updateCalculatedDiscountRate();
            }
        });
        UI.showModal('modal-load');
    });

    document.getElementById('load-cancel').addEventListener('click', () => UI.hideModal('modal-load'));

    document.getElementById('btn-load-sample').addEventListener('click', () => {
        loadARRC1Sample();
    });

    document.getElementById('btn-save').addEventListener('click', () => UI.showModal('modal-save'));
    document.getElementById('modal-cancel').addEventListener('click', () => UI.hideModal('modal-save'));
    document.getElementById('modal-confirm').addEventListener('click', () => {
        const name = document.getElementById('project-name').value;
        if (name) {
            Persist.saveProject(name, State.state);
            UI.hideModal('modal-save');
        }
    });

    document.getElementById('btn-calculate').addEventListener('click', () => {
        console.log('Run Calculations clicked. State:', State.state);
        try {
            const projections = Calc.generateProjections(State.state);
            console.log('Projections generated:', projections);
            UI.updateResultsTable(projections, State.state);
            console.log('Results table updated successfully.');
        } catch (err) {
            console.error('Calculation or rendering failed:', err);
            alert('An error occurred during calculation. Please check the console for details.');
        }
    });

    // Initialize Sortable
    initSortable('revenue-list', 'revenue');
    initSortable('expense-list', 'operating_expense');
}

function loadARRC1Sample() {
    // 1. Initial Investment
    State.updateState('initialInvestment.amount', 11250000);
    State.updateState('initialInvestment.lifetime', 15);
    State.updateState('initialInvestment.taxCredit', 0);
    State.updateState('initialInvestment.opportunityCost', 0);
    State.updateState('initialInvestment.depreciationMethod', 'straight-line');

    // 2. Working Capital
    State.updateState('workingCapital.initial', 0);
    State.updateState('workingCapital.percentageOfRevenue', 0);

    // 3. Discount Rate
    State.updateState('discountRate.approach', 'direct');
    State.updateState('discountRate.directRate', 12);
    UI.toggleConditionalSections('direct');

    // 4. Revenue Items
    State.state.revenue = [];
    State.addItem('revenue', { label: 'Gate Fee', value: 6000000, growthRate: 2.5 });
    State.addItem('revenue', { label: 'Recyclable', value: 55740, growthRate: 0 });
    State.addItem('revenue', { label: 'Energy', value: -4875621, growthRate: 0 });

    // 5. Expense Items
    State.state.operatingExpenses = [];
    State.addItem('operating_expense', { label: 'O&M Variable', value: 2250000, growthRate: 2.5 });
    State.addItem('operating_expense', { label: 'O&M Fixed', value: 0, growthRate: 2.5 });

    // Extra: Set default CAPM data for sample
    State.updateState('discountRate.capm.beta', 1);
    State.updateState('discountRate.capm.risklessRate', 4);
    State.updateState('discountRate.capm.marketRiskPremium', 8);
    State.updateState('discountRate.capm.debtRatio', 50);
    State.updateState('discountRate.capm.costOfBorrowing', 8);
    State.updateState('discountRate.capm.taxRate', 30);

    // 6. Sync UI Inputs
    syncUIWithState();

    // 7. Update Lists
    UI.updateList('revenue-list', State.state.revenue);
    UI.updateList('expense-list', State.state.operatingExpenses);

    // 8. Auto-calculate discount rate display
    updateCalculatedDiscountRate();
}

function syncUIWithState() {
    // Helper to set input value from state
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined ? val : '';
    };

    const inv = State.state.initialInvestment;
    setVal('initial-inv', inv.amount);
    setVal('opp-cost', inv.opportunityCost);
    setVal('lifetime', inv.lifetime);
    setVal('salvage-value', inv.salvageValue);
    setVal('depreciation-method', inv.depreciationMethod);
    setVal('ddb-factor', inv.ddbFactor);
    const ddbGroup = document.getElementById('ddb-factor-group');
    if (ddbGroup) {
        if (inv.depreciationMethod === 'ddb') ddbGroup.classList.remove('hidden');
        else ddbGroup.classList.add('hidden');
    }
    setVal('tax-credit', inv.taxCredit);
    setVal('other-investments', inv.otherInvestments);

    const wc = State.state.workingCapital;
    setVal('wc-initial', wc.initial);
    setVal('wc-percentage', wc.percentageOfRevenue);
    setVal('wc-salvage', wc.salvageFraction);

    const dr = State.state.discountRate;
    setVal('discount-approach', dr.approach);
    UI.toggleConditionalSections(dr.approach);
    setVal('direct-rate', dr.directRate);
    setVal('capm-beta', dr.capm.beta);
    setVal('capm-riskless', dr.capm.risklessRate);
    setVal('capm-mrp', dr.capm.marketRiskPremium);
    setVal('capm-debt-ratio', dr.capm.debtRatio);
    setVal('capm-cost-borrowing', dr.capm.costOfBorrowing);
    setVal('capm-tax-rate', dr.capm.taxRate);
}

function setupInputListener(id, statePath, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        State.updateState(statePath, val);
        if (callback) callback(val);
    });
}

function updateCalculatedDiscountRate() {
    const rate = Calc.calculateDiscountRate(State.state);
    State.updateState('discountRate.calculatedRate', rate);
    const display = document.getElementById('discount-rate-used');
    display.value = rate.toFixed(2) + '%';
}

function resetAddItemFields() {
    document.getElementById('item-label').value = '';
    document.getElementById('item-value').value = '';
    document.getElementById('item-growth').value = '';
}

function initSortable(id, type) {
    const el = document.getElementById(id);
    if (!window.Sortable) {
        console.warn('SortableJS not loaded yet.');
        return;
    }
    window.Sortable.create(el, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: () => {
            const ids = Array.from(el.children).map(child => child.dataset.id);
            State.reorderItems(type, ids);
        }
    });
}
