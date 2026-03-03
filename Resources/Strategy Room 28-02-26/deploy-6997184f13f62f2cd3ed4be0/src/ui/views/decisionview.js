
export class DecisionRegisterView {
    constructor(decisions, onAdd, onUpdate, onDelete) {
        this.decisions = decisions;
        this.onAdd = onAdd;
        this.onUpdate = onUpdate;
        this.onDelete = onDelete;
        this.isAdding = false;
        this.editingId = null;
    }

    render() {
        const isEditing = !!this.editingId;
        const editingDecision = isEditing ? this.decisions.find(d => d.id === this.editingId) : null;

        // Form Values
        const titleVal = editingDecision ? editingDecision.title : '';
        const dateVal = editingDecision ? editingDecision.date : new Date().toISOString().split('T')[0];
        const contextVal = editingDecision ? editingDecision.context : '';
        const impactVal = editingDecision && editingDecision.impact ? (Array.isArray(editingDecision.impact) ? editingDecision.impact.join(', ') : editingDecision.impact) : '';

        const formTitle = isEditing ? 'Edit Decision' : 'Log New Decision';
        const submitLabel = isEditing ? 'Update Decision' : 'Log Decision';

        const formHtml = `
            <div class="decision-form-container" style="background:var(--bg-canvas); border:1px solid var(--border); padding:1rem; margin-bottom:1.5rem; border-radius:8px;">
                <h3 style="margin-bottom:1rem;">${formTitle}</h3>
                <form id="decision-form" style="display:grid; gap:1rem;">
                    <div class="form-group">
                        <label>Decision Title</label>
                        <input type="text" name="title" required style="width:100%; padding:0.5rem;" placeholder="e.g. Pivot to Regional Narrative" value="${titleVal}">
                    </div>
                    
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="date" required style="width:100%; padding:0.5rem;" value="${dateVal}">
                    </div>

                    <div class="form-group">
                        <label>Context / Rationale</label>
                        <textarea name="context" rows="3" required style="width:100%; padding:0.5rem;" placeholder="Why did we make this decision?">${contextVal}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Impact (Comma separated)</label>
                        <input type="text" name="impact" placeholder="e.g. Budget, Timeline, Messaging" style="width:100%; padding:0.5rem;" value="${impactVal}">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button type="button" id="cancel-decision-form" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">${submitLabel}</button>
                    </div>
                </form>
            </div>
        `;

        const headerHtml = `
            <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center;">
                <h2>Decision Timeline</h2>
                ${!document.body.classList.contains('presentation-mode') ? `
                <button id="add-decision-btn" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; ${this.isAdding || isEditing ? 'display:none;' : ''}">
                    <i data-lucide="gavel"></i> Log Decision
                </button>` : ''}
            </div>
        `;

        // Check Empty State
        if (this.decisions.length === 0 && !this.isAdding) {
            return `
                ${headerHtml}
                <div class="empty-state">
                    <i data-lucide="clipboard-list"></i>
                    <h3>No Decisions Logged</h3>
                    <p>Record key governance decisions here to maintain a defensible audit trail.</p>
                </div>
            `;
        }

        return `
            ${headerHtml}
            ${(this.isAdding || isEditing) ? formHtml : ''}
            <div class="timeline">
                ${this.decisions.length === 0 ? '<p>No strategic decisions recorded.</p>' : ''}
                ${this.decisions.map(d => `
                    <div class="timeline-item">
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem;">${d.date}</div>
                        <div class="spine-section" style="padding:1.5rem; margin-bottom:0; position:relative;">
                            <div style="position:absolute; top:1rem; right:1rem; display:flex; gap:0.5rem;">
                                <button class="btn-icon edit-decision-btn" data-id="${d.id}" title="Edit" style="background:none; border:none; cursor:pointer; opacity:0.6;"><i data-lucide="edit-2" style="width:16px;"></i></button>
                                <button class="btn-icon delete-decision-btn" data-id="${d.id}" title="Delete" style="background:none; border:none; cursor:pointer; color:#ef4444; opacity:0.6;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                            </div>
                            <h4 style="color:var(--primary); margin-bottom:0.5rem; padding-right:4rem;">${d.title || 'Decision'}</h4>
                            <p>${d.context}</p>
                            ${d.impact ? `<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border); font-size:0.9rem; color:var(--text-muted);">
                                <strong>Impact:</strong> ${Array.isArray(d.impact) ? d.impact.join(', ') : d.impact}
                            </div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    bindEvents(container) {
        // Toggle Add
        const addBtn = container.querySelector('#add-decision-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.isAdding = true;
                this.editingId = null;
                this.renderAndUpdate(container);
            });
        }

        // Cancel Form
        const cancelBtn = container.querySelector('#cancel-decision-form');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.isAdding = false;
                this.editingId = null;
                this.renderAndUpdate(container);
            });
        }

        // Submit Form
        const form = container.querySelector('#decision-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(form);

                const decisionData = {
                    title: fd.get('title'),
                    date: fd.get('date'),
                    context: fd.get('context'),
                    impact: fd.get('impact').split(',').map(i => i.trim()).filter(Boolean)
                };

                if (this.editingId) {
                    if (this.onUpdate) {
                        this.onUpdate({ ...decisionData, id: this.editingId });
                    }
                } else {
                    if (this.onAdd) {
                        this.onAdd(decisionData);
                    }
                }
                this.isAdding = false;
                this.editingId = null;
                // Note: Parent handles re-render usually, but let's clear state.
            });
        }

        // Edit Buttons
        container.querySelectorAll('.edit-decision-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingId = btn.dataset.id;
                this.isAdding = false;
                this.renderAndUpdate(container);
            });
        });

        // Delete Buttons
        container.querySelectorAll('.delete-decision-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Delete this decision?')) {
                    if (this.onDelete) {
                        this.onDelete(id);
                        // Optimistic Remove
                        this.decisions = this.decisions.filter(d => d.id !== id);
                        this.renderAndUpdate(container);
                    }
                }
            });
        });
    }

    renderAndUpdate(container) {
        container.innerHTML = this.render();
        this.bindEvents(container);
        if (window.lucide) window.lucide.createIcons();
    }
}
