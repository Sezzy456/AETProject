
/**
 * Repository Interface
 * Defines the contract for any storage adapter (Local vs Supabase).
 */
export class StrategyRepository {
    constructor(adapter) {
        this.adapter = adapter;
    }

    async loadAll() {
        return this.adapter.load();
    }

    async saveLog(logEntry) {
        return this.adapter.saveItem('activityLog', logEntry);
    }

    async saveDecision(decision) {
        return this.adapter.saveItem('decisionRegister', decision);
    }

    async saveState(fullState) {
        return this.adapter.saveAll(fullState);
    }

    async saveSpine(spineData) {
        return this.adapter.saveSpine(spineData);
    }

    async updateStakeholder(stakeholder) {
        return this.adapter.updateItem('stakeholders', stakeholder);
    }

    async deleteStakeholder(id) {
        return this.adapter.deleteItem('stakeholders', id);
    }

    // --- ACTIVITY LOG ---
    async updateLog(logEntry) {
        return this.adapter.updateItem('activityLog', logEntry);
    }

    async deleteLog(id) {
        return this.adapter.deleteItem('activityLog', id);
    }

    // --- DECISION REGISTER ---
    async updateDecision(decision) {
        return this.adapter.updateItem('decisionRegister', decision);
    }

    async deleteDecision(id) {
        return this.adapter.deleteItem('decisionRegister', id);
    }

    // --- ACTION ALIGNMENT ---
    async saveAction(action) {
        return this.adapter.saveItem('initialActions', action); // Note: Collection key in data.js is 'initialActions', but app.js used 'actions'. Check Adapter/Data.js.
    }

    async updateAction(action) {
        return this.adapter.updateItem('initialActions', action);
    }

    async deleteAction(id) {
        return this.adapter.deleteItem('initialActions', id);
    }

    // --- GENERIC FALLBACK (Fixes app.js crashes) ---
    async saveItem(collection, item) {
        return this.adapter.saveItem(collection, item);
    }
}
