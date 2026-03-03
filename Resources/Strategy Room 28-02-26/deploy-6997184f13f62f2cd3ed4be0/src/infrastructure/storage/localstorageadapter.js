
import { strategySpine } from '../../domain/models/Strategy.js';

// Seed Data (Mirrors the original data.js content)
const SEED_DATA = {
    spine: strategySpine,
    stakeholders: [
        {
            id: "s1",
            name: "City of Greater Bendigo (CoGB)",
            role: "Primary Partner",
            influence: "High",
            interest: "High",
            posture: { current: "Uneven; contract strain", desired: "Strong, aligned advocate", status: "Needs Attention" },
            narrativeHook: "This project delivers long-term stability and value for Bendigo.",
            engagementStrategy: "Direct briefings; Rebuild confidence; Align narrative.",
            owner: "AET + Vant"
        },
        {
            id: "s2",
            name: "Neighbouring Councils",
            role: "Feedstock Partners",
            influence: "High",
            interest: "Medium",
            posture: { current: "Emerging awareness", desired: "Supportive partners", status: "Active" },
            narrativeHook: "A reliable, future-ready regional solution.",
            engagementStrategy: "Benefit-led presentations; low-pressure education.",
            owner: "AET (Matt)"
        },
        {
            id: "s3",
            name: "Regulators (EPA/State/Fed)",
            role: "Governance",
            influence: "High",
            interest: "Medium",
            posture: { current: "Constructive but intermittent", desired: "Predictable, supportive", status: "Stable" },
            narrativeHook: "Alignment with State circular economy targets.",
            engagementStrategy: "Structured technical documentation.",
            owner: "AET"
        },
        {
            id: "s4",
            name: "Local Industry",
            role: "Supply Chain",
            influence: "Medium",
            interest: "High",
            posture: { current: "Positive early partners", desired: "Visible champions", status: "Supportive" },
            narrativeHook: "High-quality materials for new commercial opportunities.",
            engagementStrategy: "Partnership meetings; co-branding.",
            owner: "Vant"
        },
        {
            id: "s5",
            name: "Community & Media",
            role: "Public License",
            influence: "High",
            interest: "High",
            posture: { current: "Limited specific exposure", desired: "Informed & Supportive", status: "Monitor" },
            narrativeHook: "Clean, smart recycling – not waste-to-energy.",
            engagementStrategy: "Proactive education; simple explainers.",
            owner: "Vant"
        }
    ],
    initialActions: [
        { id: "a1", activity: "Msg Toolkit", owner: "Vant", linkType: "Objective", linkId: "obj2", status: "Complete" },
        { id: "a2", activity: "Waste Mgr Briefing", owner: "Matt", linkType: "Stakeholder", linkId: "s2", status: "Complete" },
        { id: "a3", activity: "Website Refresh", owner: "Vant", linkType: "Stakeholder", linkId: "s5", status: "Pending" },
        { id: "a4", activity: "Journalist Briefings", owner: "Vant", linkType: "Stakeholder", linkId: "s5", status: "Pending" },
        { id: "a5", activity: "CoGB Reset", owner: "AET", linkType: "Stakeholder", linkId: "s1", status: "Pending" }
    ],
    activityLog: [],
    decisionRegister: []
};

/**
 * Adapter: LocalStorage
 * Implements persistent storage in the browser.
 */
export class LocalStorageAdapter {
    constructor(key = 'aet_strategy_room_v1', toastService) {
        this.key = key;
        this.toast = toastService;
    }

    async load() {
        const raw = localStorage.getItem(this.key);
        if (!raw) {
            console.log("No local state found. Seeding initial data.");
            return SEED_DATA;
        }
        return JSON.parse(raw);
    }

    async saveAll(state) {
        localStorage.setItem(this.key, JSON.stringify(state));
        return true;
    }

    async saveItem(collectionKey, item) {
        const state = await this.load();

        let targetKey = collectionKey;
        if (collectionKey === 'decisionRegister') targetKey = 'decisionRegister';

        if (!state[targetKey]) state[targetKey] = [];

        // Generate ID if missing (Critical for LedgerView)
        // Simple fallback ID generation
        if (!item.id) {
            item.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Add to top
        state[targetKey].unshift(item);

        await this.saveAll(state);
        if (this.toast) this.toast.show("Saved (Local)", "success");
        return item;
    }

    async updateItem(collectionKey, item) {
        const state = await this.load();
        const list = state[collectionKey] || [];
        const index = list.findIndex(i => i.id === item.id);

        if (index !== -1) {
            list[index] = item;
            state[collectionKey] = list;
            await this.saveAll(state);
            if (this.toast) this.toast.show("Updated (Local)", "success");
        } else {
            console.error("Item not found for update", item);
        }
    }

    async deleteItem(collectionKey, id) {
        const state = await this.load();
        const list = state[collectionKey] || [];
        const initialLength = list.length;

        state[collectionKey] = list.filter(i => i.id !== id);

        if (state[collectionKey].length < initialLength) {
            await this.saveAll(state);
            if (this.toast) this.toast.show("Deleted (Local)", "success");
            return true;
        }
        return false;
    }

    async saveSpine(newSpineContent) {
        const state = await this.load();
        state.spine = newSpineContent;
        await this.saveAll(state);
        // if (this.toast) this.toast.show("Spine Saved", "success");
        return newSpineContent;
    }

    async resetDatabase() {
        if (confirm("Reset all local data?")) {
            localStorage.removeItem(this.key);
            window.location.reload();
        }
    }
}
