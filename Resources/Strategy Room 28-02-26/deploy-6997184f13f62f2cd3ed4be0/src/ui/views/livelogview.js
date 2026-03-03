
export class LiveLogView {
    constructor(logData, stakeholders, headers = {}, callbacks = {}) {
        this.logs = logData;
        this.stakeholders = stakeholders;

        // Callback handling
        if (typeof headers === 'function') {
            this.onSubmit = headers;
            this.onUpdate = arguments[3] || null;
            this.onDelete = arguments[4] || null;
        } else if (typeof headers === 'object') {
            this.onSubmit = headers.onSubmit;
            this.onUpdate = headers.onUpdate;
            this.onDelete = headers.onDelete;
        } else {
            this.onSubmit = null;
            this.onUpdate = null;
            this.onDelete = null;
        }

        this.editingEntry = null;
        this.isFormOpen = false; // Default collapsed
    }

    render() {
        const isEditing = !!this.editingEntry;
        const formTitle = isEditing ? 'Edit Entry' : 'Quick Capture';
        const submitLabel = isEditing ? 'Update Entry' : 'Log Activity';

        // Pre-fill values
        const summaryVal = isEditing ? this.editingEntry.summary : '';
        const typeVal = isEditing ? this.editingEntry.type : 'Meeting';
        const dateVal = isEditing ? this.editingEntry.date : new Date().toISOString().split('T')[0];
        const tagsVal = isEditing && this.editingEntry.tags ? this.editingEntry.tags.join(', ') : '';
        const linkedSh = isEditing && this.editingEntry.stakeholders ? this.editingEntry.stakeholders : [];

        // Show Form Logic
        const showForm = this.isFormOpen || isEditing;

        // Helper: Summary Truncation for card title
        const getTitle = (text) => {
            if (!text) return 'New Activity';
            return text.length > 50 ? text.substring(0, 50) + '...' : text;
        };

        return `
            <div class="view-container">
                <!-- Header -->
                <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center;">
                    <h2>Activity Log</h2>
                    ${!document.body.classList.contains('presentation-mode') ? `
                    <button id="add-log-btn" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; ${showForm ? 'display:none;' : ''}">
                        <i data-lucide="plus-circle"></i> Log Activity
                    </button>` : ''}
                </div>

                <!-- FORM CONTAINER (Placed ABOVE the list) -->
                ${showForm ? `
                <div class="log-form-container" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:1.5rem; margin-bottom:2rem; border-radius:var(--radius-node); animation: slideDown 0.2s ease-out;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3>${formTitle}</h3>
                        <button id="cancel-log-btn" style="font-size:0.8rem; background:none; border:none; cursor:pointer; color:var(--text-tertiary);"><i data-lucide="x"></i></button>
                    </div>
                    <form id="log-form" style="display:grid; gap:1rem;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label style="font-size:0.8rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Type</label>
                                <select name="type">
                                    <option value="Meeting" ${typeVal === 'Meeting' ? 'selected' : ''}>Meeting</option>
                                    <option value="Signal" ${typeVal === 'Signal' ? 'selected' : ''}>Signal / Intel</option>
                                    <option value="Decision" ${typeVal === 'Decision' ? 'selected' : ''}>Decision</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.8rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Date</label>
                                <input type="date" name="date" required value="${dateVal}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label style="font-size:0.8rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Summary</label>
                            <textarea name="summary" rows="3" required placeholder="What happened? (Key outcome only)" style="resize:vertical;">${summaryVal}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label style="font-size:0.8rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Linked Stakeholders</label>
                            <div style="max-height:150px; overflow-y:auto; border:1px solid var(--border-subtle); padding:0.75rem; border-radius:4px; background:var(--bg-app); margin-top:0.5rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:0.5rem;">
                                ${this.stakeholders.map(s => `
                                    <div style="display:flex; align-items:center; gap:0.5rem;">
                                        <input type="checkbox" name="sh_ids" value="${s.id}" ${linkedSh.includes(s.id) ? 'checked' : ''} style="width:auto; margin:0;"> 
                                        <span style="font-size:0.9rem;">${s.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="form-group">
                            <label style="font-size:0.8rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Tags (Comma separated)</label>
                            <input type="text" name="tags" placeholder="e.g. narrative, capacity, risk" value="${tagsVal}">
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                            <button type="submit" class="btn-primary">${submitLabel}</button>
                        </div>
                    </form>
                </div>
                ` : ''}

                <!-- Empty State -->
                ${this.logs.length === 0 && !showForm ? `
                    <div class="empty-state">
                        <i data-lucide="activity"></i>
                        <h3>No Activity Yet</h3>
                        <p>Capture meetings, signals, and decisions to track momentum.</p>
                    </div>
                ` : ''}

                <!-- Activity List -->
                <div class="log-grid" style="display:grid; gap:1rem;">
                    ${this.logs.map(log => `
                        <div class="spine-section" style="padding:1.5rem; margin-bottom:0; display:flex; flex-direction:column; gap:0.75rem; position:relative;">
                            <!-- Type Badge & Date -->
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div style="display:flex; align-items:center; gap:1rem;">
                                    <span class="badge" style="background:rgba(16, 185, 129, 0.1); color:var(--energy-algae-dim); border:none; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">${log.type}</span>
                                    <span style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; color:var(--text-tertiary);">${log.date || ''}</span>
                                </div>
                                <div class="actions" style="display:flex; gap:0.5rem;">
                                    <button class="btn-icon edit-log-btn" data-id="${log.id}" title="Edit" style="background:none; border:none; cursor:pointer; opacity:0.6;"><i data-lucide="edit-2" style="width:16px;"></i></button>
                                    <button class="btn-icon delete-log-btn" data-id="${log.id}" title="Delete" style="background:none; border:none; cursor:pointer; color:#ef4444; opacity:0.6;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <p style="font-size:1rem; color:var(--text-primary); font-weight:500; line-height:1.5;">${log.summary}</p>
                            
                            <!-- Metadata Footer -->
                            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.25rem; align-items:center;">
                                ${log.stakeholders && log.stakeholders.length > 0 ? log.stakeholders.map(sid => {
            const s = this.stakeholders.find(x => x.id === sid);
            return s ? `<span style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.25rem;"><i data-lucide="user" style="width:12px;"></i> ${s.name}</span>` : '';
        }).join('') : ''}
                                
                                ${log.tags && log.tags.length > 0 && log.stakeholders && log.stakeholders.length > 0 ?
                `<span style="color:var(--text-tertiary); font-size:0.8rem;">•</span>` : ''}

                                ${log.tags ? log.tags.map(t => `<span style="font-size:0.8rem; color:var(--text-tertiary);">#${t}</span>`).join('') : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bindEvents(container) {
        if (container.dataset.listenersBound) return;
        container.dataset.listenersBound = 'true';

        container.addEventListener('click', (e) => {
            // Toggle Add
            if (e.target.closest('#add-log-btn')) {
                this.isFormOpen = true;
                this.editingEntry = null;
                this.renderAndUpdate(container);
            }

            // Cancel Form
            if (e.target.closest('#cancel-log-btn')) {
                this.isFormOpen = false;
                this.editingEntry = null;
                this.renderAndUpdate(container);
            }

            // Edit Button
            const editBtn = e.target.closest('.edit-log-btn');
            if (editBtn) {
                const id = editBtn.dataset.id;
                const entry = this.logs.find(l => l.id === id);
                if (entry) {
                    this.editingEntry = entry;
                    this.isFormOpen = true;
                    this.renderAndUpdate(container);
                }
            }

            // Delete Button
            const deleteBtn = e.target.closest('.delete-log-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('Delete this log entry?')) {
                    if (this.onDelete) {
                        this.onDelete(id);
                        this.logs = this.logs.filter(l => l.id !== id);
                        this.renderAndUpdate(container);
                    }
                }
            }
        });

        // Form Submit (Delegation doesn't bubble 'submit' efficiently in all browsers, but 'change'/'input' do. 
        // For submit, it's safer to bind to the container 'submit' event which *does* bubble in modern browsers.)
        container.addEventListener('submit', (e) => {
            if (e.target.id === 'log-form') {
                e.preventDefault();
                console.warn("DEBUG: Activity Log Form Submitted");

                const form = e.target;
                const fd = new FormData(form);
                const sh_ids = Array.from(form.querySelectorAll('input[name="sh_ids"]:checked')).map(cb => cb.value);
                const tagsRaw = fd.get('tags') || '';

                const entryData = {
                    type: fd.get('type'),
                    summary: fd.get('summary'),
                    date: fd.get('date'),
                    stakeholders: sh_ids,
                    tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
                };

                console.log("DEBUG: Entry Object Created:", entryData);

                if (this.editingEntry) {
                    Object.assign(this.editingEntry, entryData);
                    if (this.onUpdate) {
                        console.log("DEBUG: Calling onUpdate...");
                        this.onUpdate(this.editingEntry);
                    }
                } else {
                    const newEntry = {
                        id: 'temp_' + Date.now(),
                        ...entryData
                    };
                    this.logs.unshift(newEntry);

                    if (this.onSubmit) {
                        console.log("DEBUG: Calling onSubmit...");
                        this.onSubmit(entryData);
                    }
                }

                this.isFormOpen = false;
                this.editingEntry = null;
                this.renderAndUpdate(container);
            }
        });
    }

    renderAndUpdate(container) {
        container.innerHTML = this.render();
        // No need to re-bind events because we use delegation on the container!
        if (window.lucide) window.lucide.createIcons();
    }
}
