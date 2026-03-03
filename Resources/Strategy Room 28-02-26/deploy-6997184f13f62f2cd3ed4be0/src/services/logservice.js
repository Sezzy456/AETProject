
import { LogEntry } from '../domain/models/Log.js';

export class LogService {
    constructor(repository) {
        this.repo = repository;
    }

    async getRecentActivity() {
        const state = await this.repo.loadAll();
        return state.activityLog.map(l => new LogEntry(l));
    }

    async addEntry(type, summary, stakeholders = [], tags = []) {
        const entry = new LogEntry({
            type,
            summary,
            stakeholders,
            implications: tags
        });

        await this.repo.saveLog(entry);

        // Auto-promote Decision
        if (entry.isDecision) {
            await this.repo.saveDecision({
                id: entry.id,
                date: entry.date,
                title: "Logged via Quick Capture",
                context: entry.summary,
                impact: entry.implications,
                status: "New"
            });
        }

        return entry;
    }
}
