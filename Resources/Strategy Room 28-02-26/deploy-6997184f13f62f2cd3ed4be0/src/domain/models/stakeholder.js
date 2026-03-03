
/**
 * Domain Model: Stakeholder
 * Defines a stakeholder entity and their movement logic.
 */
export class Stakeholder {
    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name;
        this.role = data.role;
        this.influence = data.influence || "Medium"; // High, Medium, Low
        this.interest = data.interest || "Medium";
        this.posture = {
            current: data.posture?.current || "Unknown",
            desired: data.posture?.desired || "Supportive",
            status: data.posture?.status || "Monitor" // Active, Monitor, Needs Attention
        };
        this.narrativeHook = data.narrativeHook || "";
        this.engagementStrategy = data.engagementStrategy || "";
        this.owner = data.owner || "Unassigned";
    }

    // Business Logic: Is this stakeholder critical?
    get isCritical() {
        return this.influence === 'High' && this.interest === 'High';
    }

    // Business Logic: Does this stakeholder need attention?
    get needsAttention() {
        return this.posture.status === 'Needs Attention';
    }
}
