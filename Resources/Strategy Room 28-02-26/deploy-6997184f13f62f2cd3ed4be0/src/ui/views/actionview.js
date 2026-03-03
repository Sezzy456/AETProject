
export class ActionAlignmentView {
    constructor(actions, stakeholders, objectives, onAdd, onUpdate, onDelete) {
        this.actions = actions;
        this.stakeholders = stakeholders;
        // Map objectives to a lookup object or array
        this.objectives = objectives;
        this.onAdd = onAdd;
        this.onUpdate = onUpdate;
        this.onDelete = onDelete;
        this.isAdding = false;
        this.editingId = null;
        this.linkType = 'Stakeholder'; // Default context for form
        this.formState = {};
    }

    render() {
        const isEditing = !!this.editingId;
        const editingAction = isEditing ? this.actions.find(a => a.id === this.editingId) : null;

        // Form Defaults
        let activityVal = editingAction ? editingAction.activity : '';
        let ownerVal = editingAction ? editingAction.owner : '';
        let statusVal = editingAction ? editingAction.status : 'Pending';
        // Note: data.js uses camelCase (linkType), db uses snake_case (link_type).
        // Let's rely on what passes in. `app.js` passes `appState.initialActions`.
        // In data.js: { linkType: "Objective", linkId: "obj2" }
        // So we expect camelCase in `this.actions`.
        const linkTypeVal = editingAction ? editingAction.linkType : this.linkType;
        const linkIdVal = editingAction ? editingAction.linkId : '';

        if (!isEditing && this.formState && Object.keys(this.formState).length > 0) {
            activityVal = this.formState.activity || activityVal;
            ownerVal = this.formState.owner || ownerVal;
            statusVal = this.formState.status || statusVal;
        }

        // Update local linkType to match editing item so options render correctly
        if (isEditing && this.linkType !== linkTypeVal) {
            this.linkType = linkTypeVal;
        }

        // STRICT CHECK: Filter out orphans (actions without links)
        const validActions = this.actions.filter(a => a.linkId);
        const orphans = this.actions.filter(a => !a.linkId);

        // Generate Options for Select
        let linkOptions = '';
        if (this.linkType === 'Stakeholder') {
            linkOptions = this.stakeholders.map(s => `<option value="${s.id}" ${s.id === linkIdVal ? 'selected' : ''}>${s.name}</option>`).join('');
        } else {
            linkOptions = this.objectives.map(o => `<option value="${o.id}" ${o.id === linkIdVal ? 'selected' : ''}>${o.text.substring(0, 50)}...</option>`).join('');
        }

        const formTitle = isEditing ? 'Edit Action' : 'Create Strategic Action';
        const submitLabel = isEditing ? 'Update Action' : 'Create Action';

        const formHtml = (this.isAdding || isEditing) ? `
            <div class="add-action-form" style="background:var(--bg-canvas); border:1px solid var(--border); padding:1rem; margin-bottom:1.5rem; border-radius:8px;">
                <h3 style="margin-bottom:1rem;">${formTitle}</h3>
                <form id="add-action-form" style="display:grid; gap:1rem;">
                    
                    <div class="form-group">
                        <label>Activity / Task</label>
                        <input type="text" name="activity" required style="width:100%; padding:0.5rem;" placeholder="e.g. Brief the Mayor" value="${activityVal}">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Owner</label>
                            <input type="text" name="owner" placeholder="e.g. Matt" style="width:100%; padding:0.5rem;" value="${ownerVal}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status" style="width:100%; padding:0.5rem;">
                                <option value="Pending" ${statusVal === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="In Progress" ${statusVal === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Complete" ${statusVal === 'Complete' ? 'selected' : ''}>Complete</option>
                            </select>
                        </div>
                    </div>

                    <div style="background:var(--bg-surface); padding:0.75rem; border-radius:4px; border:1px dashed var(--border);">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600;">Alignment</label>
                        <div class="form-group">
                            <label>Link To:</label>
                            <select id="link-type-select" name="link_type" style="width:100%; padding:0.5rem; margin-bottom:0.5rem;">
                                <option value="Stakeholder" ${this.linkType === 'Stakeholder' ? 'selected' : ''}>Stakeholder</option>
                                <option value="Objective" ${this.linkType === 'Objective' ? 'selected' : ''}>Strategic Objective</option>
                            </select>
                            
                            <select name="link_id" style="width:100%; padding:0.5rem;">
                                ${linkOptions}
                            </select>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button type="button" id="cancel-add-action" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">${submitLabel}</button>
                    </div>
                </form>
            </div>
        ` : '';

        const headerHtml = `
            <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2>Action Alignment</h2>
                    <p style="font-size:0.9rem; color:var(--text-muted);">All actions must link to Strategy.</p>
                </div>
                ${!document.body.classList.contains('presentation-mode') ? `
                <button id="add-action-btn" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; ${(this.isAdding || isEditing) ? 'display:none;' : ''}">
                    <i data-lucide="check-square"></i> Create Action
                </button>` : ''}
            </div>
        `;

        if (this.actions.length === 0 && !this.isAdding) {
            return `
                ${headerHtml}
                <div class="empty-state">
                    <i data-lucide="target"></i>
                    <h3>No Actions Defined</h3>
                    <p>Create specific actions linked to Stakeholders or Objectives to demonstrate progress.</p>
                </div>
            `;
        }

        return `
            ${headerHtml}
            ${formHtml}

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Action / Activity</th>
                            <th>Owner</th>
                            <th>Linked To</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${validActions.map(a => {
            let linkName = "Unknown";
            if (a.linkType === 'Stakeholder') {
                const s = this.stakeholders.find(x => x.id === a.linkId);
                linkName = s ? s.name : "Invalid ID";
            } else {
                const o = this.objectives.find(x => x.id === a.linkId);
                linkName = o ? "Obj: " + o.text.substring(0, 30) + "..." : "Invalid ID";
            }

            return `
                            <tr>
                                <td style="font-weight:500;">${a.activity}</td>
                                <td>${a.owner}</td>
                                <td>${linkName}</td>
                                <td><span class="badge">${a.linkType}</span></td>
                                <td><span class="badge status-${a.status}">${a.status}</span></td>
                                <td style="text-align:right;">
                                    <button class="btn-icon edit-action-btn" data-id="${a.id}" title="Edit" style="background:none; border:none; cursor:pointer; opacity:0.6;"><i data-lucide="edit-2" style="width:14px;"></i></button>
                                    <button class="btn-icon delete-action-btn" data-id="${a.id}" title="Delete" style="background:none; border:none; cursor:pointer; color:#ef4444; opacity:0.6;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                                </td>
                            </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
            
            ${orphans.length > 0 ? `
            <div style="margin-top:2rem; padding:1rem; background:#fee2e2; border-radius:8px; color:#991b1b;">
                <strong>Warning: Orphan Actions Detected</strong>
                <p>The following actions are not linked to strategy:</p>
                <ul>
                    ${orphans.map(o => `<li>${o.activity}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
    }

    bindEvents(container) {
        // Toggle Add
        const addBtn = container.querySelector('#add-action-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.isAdding = true;
                this.editingId = null;
                this.renderAndUpdate(container);
            });
        }

        // Cancel Form
        const cancelBtn = container.querySelector('#cancel-add-action');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.isAdding = false;
                this.editingId = null;
                this.formState = {};
                this.renderAndUpdate(container);
            });
        }

        // Dynamic Type Switch
        const typeSelect = container.querySelector('#link-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                const form = container.querySelector('#add-action-form');
                if (form) {
                    const fd = new FormData(form);
                    this.formState = {
                        activity: fd.get('activity'),
                        owner: fd.get('owner'),
                        status: fd.get('status')
                    };
                }
                this.linkType = e.target.value;
                this.renderAndUpdate(container);
            });
        }

        // Submit Form
        const form = container.querySelector('#add-action-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(form);

                const actionData = {
                    activity: fd.get('activity'),
                    owner: fd.get('owner'),
                    status: fd.get('status'),
                    linkType: fd.get('link_type'),
                    linkId: fd.get('link_id')
                };

                if (this.editingId) {
                    const originalAction = this.actions.find(a => a.id === this.editingId);
                    if (this.onUpdate) {
                        this.onUpdate({
                            ...actionData,
                            id: this.editingId,
                            phase: originalAction ? originalAction.phase : undefined
                        });
                    }
                } else {
                    if (this.onAdd) {
                        this.onAdd(actionData);
                    }
                }
                this.isAdding = false;
                this.editingId = null;
            });
        }

        // Edit Buttons
        container.querySelectorAll('.edit-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingId = btn.dataset.id;
                this.isAdding = false;
                this.renderAndUpdate(container);
            });
        });

        // Delete Buttons
        container.querySelectorAll('.delete-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Delete this action?')) {
                    if (this.onDelete) {
                        this.onDelete(id);
                        // Optimistic Remove
                        this.actions = this.actions.filter(a => a.id !== id);
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
