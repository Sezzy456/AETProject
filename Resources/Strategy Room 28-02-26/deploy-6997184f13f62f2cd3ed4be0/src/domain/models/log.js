
/**
 * Domain Model: LogEntry
 * Represents a discrete event in the strategy timeline.
 */
export class LogEntry {
    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.type = data.type || "Signal"; // Meeting, Signal, Decision
        this.summary = data.summary;
        // Linked Entity IDs
        this.stakeholders = data.stakeholders || [];
        // DB = implications (or impact for decisions), UI = tags. 
        // We construct from data which might be raw DB row OR another LogEntry
        this.implications = data.implications || data.impact || data.tags || [];
        this.tags = this.implications; // Alias for UI compatibility
    }

    get isDecision() {
        return this.type === 'Decision';
    }
}

/**
 * Domain Model: Action
 * Represents a task strictly linked to strategy.
 */
export class Action {
    constructor(data) {
        if (!data.linkId) {
            console.warn("Action created without LinkID. This violates Strategy Control Room rules.");
        }

        this.id = data.id || crypto.randomUUID();
        this.activity = data.activity;
        this.owner = data.owner;
        this.status = data.status || "Pending";

        // Value Object: Linkage
        this.link = {
            type: data.linkType, // 'Stakeholder' | 'Objective'
            id: data.linkId
        };
    }
}
