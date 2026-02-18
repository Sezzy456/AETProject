/**
 * Central state object for the financial model.
 * Each top-level key corresponds to a card or major data section.
 */
export const state = {
    initialInvestment: {
        amount: 0,
        opportunityCost: 0,
        lifetime: 0,
        salvageValue: 0,
        depreciationMethod: '',
        taxCredit: 0,
        otherInvestments: 0,
        ddbFactor: 200
    },
    workingCapital: {
        initial: 0,
        percentageOfRevenue: 0,
        salvageFraction: 0
    },
    discountRate: {
        approach: '', // 'direct' or 'capm'
        directRate: 0,
        capm: {
            beta: 0,
            risklessRate: 0,
            marketRiskPremium: 0,
            debtRatio: 0,
            costOfBorrowing: 0,
            taxRate: 0
        },
        calculatedRate: 0
    },
    revenue: [], // Array of { id, label, value, growthRate, type: 'revenue' }
    operatingExpenses: [] // Array of { id, label, value, growthRate, type: 'operating_expense' }
};

/**
 * Update a specific part of the state.
 * @param {string} path - Dot-separated path to the state property (e.g. 'initialInvestment.amount')
 * @param {any} value - New value
 */
export function updateState(path, value) {
    const keys = path.split('.');
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Optional: persistence or global change notification could happen here
    console.log(`State updated: ${path} =`, value);
}

/**
 * Add an item to revenue or operating expenses.
 */
export function addItem(type, item) {
    const uniqueId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    const newItem = { ...item, id: uniqueId, type: type, yearlyGrowth: {} };
    if (type === 'revenue') {
        state.revenue.push(newItem);
    } else if (type === 'operating_expense') {
        state.operatingExpenses.push(newItem);
    }
}

/**
 * Remove an item from a list.
 */
export function removeItem(type, id) {
    if (type === 'revenue') {
        state.revenue = state.revenue.filter(item => item.id !== id);
    } else {
        state.operatingExpenses = state.operatingExpenses.filter(item => item.id !== id);
    }
}

/**
 * Reorder a list based on an array of IDs.
 */
export function reorderItems(type, idOrder) {
    const list = type === 'revenue' ? 'revenue' : 'operatingExpenses';
    const originalItems = state[list];
    state[list] = idOrder.map(id => originalItems.find(item => item.id === id));
}
/**
 * Update an existing item.
 */
export function updateItem(type, id, updates) {
    const list = type === 'revenue' ? 'revenue' : 'operatingExpenses';
    const index = state[list].findIndex(item => item.id === id);
    if (index !== -1) {
        state[list][index] = { ...state[list][index], ...updates };
    }
}

/**
 * Set yearly growth rates for an item.
 */
export function setYearlyGrowth(type, id, yearlyGrowth) {
    const list = type === 'revenue' ? 'revenue' : 'operatingExpenses';
    const index = state[list].findIndex(item => item.id === id);
    if (index !== -1) {
        state[list][index].yearlyGrowth = { ...state[list][index].yearlyGrowth, ...yearlyGrowth };
    }
}
