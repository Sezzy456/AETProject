
export class ExportService {
    constructor() { }

    /**
     * Exports the full application state as a JSON file.
     * @param {Object} appState - The full state object (strategy, log, stakeholders, etc)
     */
    exportProjectJSON(appState) {
        const dataStr = JSON.stringify(appState, null, 2);
        const date = new Date().toISOString().split('T')[0];
        const filename = `strategy_backup_${date}.json`;

        this._downloadFile(dataStr, filename, 'application/json');
    }

    /**
     * Exports stakeholders as a CSV file for Excel.
     * @param {Array} stakeholders - Array of stakeholder objects
     */
    exportStakeholdersCSV(stakeholders) {
        if (!stakeholders || stakeholders.length === 0) return;

        // Define CSV Headers
        const headers = [
            'ID', 'Name', 'Role', 'Owner',
            'Contact Name', 'Email', 'Phone', 'Address',
            'Influence', 'Interest', 'Status',
            'Current Posture', 'Desired Posture'
        ];

        // Map Data
        const rows = stakeholders.map(s => [
            s.id,
            this._escapeCSV(s.name),
            this._escapeCSV(s.role),
            this._escapeCSV(s.owner),
            this._escapeCSV(s.contactName),
            this._escapeCSV(s.email),
            this._escapeCSV(s.phone),
            this._escapeCSV(s.address),
            s.influence,
            s.interest,
            s.posture_status || (s.posture ? s.posture.status : ''),
            this._escapeCSV(s.posture_current || (s.posture ? s.posture.current : '')),
            this._escapeCSV(s.posture_desired || (s.posture ? s.posture.desired : ''))
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const date = new Date().toISOString().split('T')[0];
        this._downloadFile(csvContent, `stakeholders_${date}.csv`, 'text/csv');
    }

    _escapeCSV(str) {
        if (!str) return '';
        // If string contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    _downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
