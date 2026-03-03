
export class StakeholderLedgerView {
    constructor(stakeholders, logs, actions, onAdd, onUpdate, onDelete) {
        this.stakeholders = stakeholders;
        // Backward compatibility
        this.logs = Array.isArray(logs) ? logs : [];
        this.actions = Array.isArray(actions) ? actions : [];

        this.onAdd = onAdd;
        this.onUpdate = onUpdate;
        this.onDelete = onDelete;

        // View State
        this.selectedId = null;
        this.isAdding = false;
        this.viewMode = 'GRID'; // 'GRID' | 'DETAIL' | 'EDIT'
    }

    render() {
        if (this.selectedId) {
            const s = this.stakeholders.find(x => x.id === this.selectedId);
            if (!s) { this.selectedId = null; return this.render(); }

            if (this.viewMode === 'EDIT') return this.renderEdit(s);
            return this.renderDetail(s);
        }
        return this.renderGrid();
    }

    // --- GRID VIEW ---
    renderGrid() {
        const addForm = this.isAdding ? this.renderAddForm() : `
            <div style="margin-bottom:1.5rem; text-align:right;">
                 ${!document.body.classList.contains('presentation-mode') ? `
                <button id="add-sh-btn" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus"></i> Add Stakeholder
                </button>` : ''}
            </div>
        `;

        return `
            <div class="ledger-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                     <h2>Stakeholder Ledger</h2>
                </div>
                
                ${addForm}

                <div class="ledger-grid">
                ${this.stakeholders.map(s => {
            const statusClass = this.getStatusClass(s.posture_status || (s.posture ? s.posture.status : 'Active'));
            const contactCount = s.contacts ? s.contacts.length : 0;

            return `
                    <div class="stakeholder-card status-${statusClass}" data-id="${s.id}" style="cursor:pointer; transition:transform 0.2s;">
                        <div class="sh-main">
                            <div class="sh-meta">
                                <span class="badge">${s.role}</span>
                                <span class="badge" style="background:${statusClass == 'danger' ? '#fee2e2; color:#b91c1c' : '#f1f5f9; color:#475569'}">${s.posture_status || 'Active'}</span>
                            </div>
                            <h4 style="font-size:1.2rem; margin-top:0.5rem; font-weight:700; letter-spacing:-0.5px;">${s.name}</h4>
                            <div style="font-size:0.85rem; margin-top:0.25rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
                                <span>${s.owner}</span>
                                ${contactCount > 0 ? `<span style="width:4px; height:4px; background:var(--text-muted); border-radius:50%;"></span> <span>${contactCount} Contacts</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="sh-hook-preview" style="border-top:1px solid var(--border); padding-top:1rem; margin-top:1rem;">
                            <p style="font-size:0.9rem; font-style:italic; color:var(--text-secondary); line-height:1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                "${s.narrative_hook || s.narrativeHook || 'TBD'}"
                            </p>
                        </div>
                    </div>
                `}).join('')}
                </div>
            </div>
        `;
    }

    // --- DETAIL VIEW (V2) ---
    renderDetail(s) {
        const pStatus = s.posture_status || (s.posture ? s.posture.status : 'Active');
        const statusColor = pStatus === 'Needs Attention' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-100';

        // Contacts List Logic
        const contacts = s.contacts || [];
        const contactsList = contacts.length > 0 ? contacts.map(c => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid var(--border); border-radius:8px; background:#fff; margin-bottom:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:32px; height:32px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#64748b;">
                        <i data-lucide="user" style="width:16px;"></i>
                    </div>
                    <div>
                        <div style="font-weight:600; font-size:0.95rem;">${c.name}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${c.role || 'Member'} ${c.is_primary ? '<span style="color:var(--accent); font-weight:500; margin-left:4px;">(Primary)</span>' : ''}</div>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    ${c.phone ? `<a href="tel:${c.phone}" title="${c.phone}" style="padding:4px; color:var(--text-muted); hover:color:var(--text-primary);"><i data-lucide="phone" style="width:14px;"></i></a>` : ''}
                    ${c.email ? `<a href="mailto:${c.email}" title="${c.email}" style="padding:4px; color:var(--text-muted); hover:color:var(--text-primary);"><i data-lucide="mail" style="width:14px;"></i></a>` : ''}
                </div>
            </div>
        `).join('') : `
            <div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.9rem; background:var(--bg-canvas); border-radius:8px;">
                No contacts listed.
            </div>
        `;

        return `
             <div class="ledger-container">
                <!-- Header Nav -->
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                    <button class="btn-text" id="back-btn" style="display:flex; align-items:center; gap:0.5rem; color:var(--text-muted); padding:0; background:none; border:none; cursor:pointer;">
                        <i data-lucide="arrow-left" style="width:16px;"></i> Back to Ledger
                    </button>
                    <div style="display:flex; gap:0.5rem;">
                        <button id="delete-sh-btn" class="btn-secondary" style="color:#ef4444; border-color:#fee2e2; background:#fef2f2;">Delete</button>
                        <button id="edit-sh-btn" class="btn-secondary">Edit</button>
                    </div>
                </div>

                <!-- Main Card -->
                <div style="background:var(--bg-surface); border-radius:12px; border:1px solid var(--border); box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); overflow:hidden;">
                    
                    <!-- Title Header -->
                    <div style="padding:2rem; border-bottom:1px solid var(--border);">
                        <div style="display:flex; align-items:start; justify-content:space-between;">
                            <div>
                                <span class="badge" style="margin-bottom:0.75rem; display:inline-block;">${s.role}</span>
                                <h1 style="font-size:2rem; font-weight:800; letter-spacing:-1px; margin:0; line-height:1.1;">${s.name}</h1>
                            </div>
                            <span class="badge ${statusColor}" style="font-size:0.9rem; padding:0.5rem 1rem;">${pStatus}</span>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 35% 65%; min-height:400px;">
                        
                        <!-- Left Column: Strategy & Meta -->
                        <div style="background:#f8fafc; padding:2rem; border-right:1px solid var(--border);">
                            <div style="margin-bottom:2rem;">
                                <label class="sh-section" style="font-size:0.7rem; color:#94a3b8; font-weight:700; letter-spacing:1px; margin-bottom:0.5rem;">NARRATIVE HOOK</label>
                                <p style="font-size:1.05rem; line-height:1.6; font-style:italic; color:#334155;">"${s.narrative_hook || s.narrativeHook || 'TBD'}"</p>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:2rem;">
                                <div>
                                    <label class="sh-section" style="font-size:0.7rem; color:#94a3b8; font-weight:700; letter-spacing:1px;">INFLUENCE</label>
                                    <div class="progress-bar-bg" style="height:6px; background:#e2e8f0; border-radius:3px; margin-top:0.5rem; overflow:hidden;">
                                        <div style="height:100%; width:${s.influence === 'High' ? '100%' : s.influence === 'Medium' ? '60%' : '30%'}; background:#64748b;"></div>
                                    </div>
                                    <div style="font-size:0.85rem; margin-top:4px; font-weight:600;">${s.influence}</div>
                                </div>
                                <div>
                                    <label class="sh-section" style="font-size:0.7rem; color:#94a3b8; font-weight:700; letter-spacing:1px;">INTEREST</label>
                                    <div class="progress-bar-bg" style="height:6px; background:#e2e8f0; border-radius:3px; margin-top:0.5rem; overflow:hidden;">
                                        <div style="height:100%; width:${s.interest === 'High' ? '100%' : s.interest === 'Medium' ? '60%' : '30%'}; background:#64748b;"></div>
                                    </div>
                                    <div style="font-size:0.85rem; margin-top:4px; font-weight:600;">${s.interest}</div>
                                </div>
                            </div>
                            
                            <div>
                                <label class="sh-section" style="font-size:0.7rem; color:#94a3b8; font-weight:700; letter-spacing:1px; margin-bottom:0.5rem;">ENGAGEMENT STRATEGY</label>
                                <p style="font-size:0.9rem; line-height:1.5; color:#475569;">${s.engagement_strategy || s.engagementStrategy || 'TBD'}</p>
                            </div>
                        </div>

                        <!-- Right Column: Contacts & Action -->
                        <div style="padding:2rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                                <h3 style="font-size:0.9rem; font-weight:700; color:#cbd5e1; letter-spacing:1px;">KEY CONTACTS</h3>
                            </div>
                            
                            <div id="contacts-list-container">
                                ${contactsList}
                            </div>
                            
                            <form id="quick-add-contact-form" style="margin-top:1rem; border-top:1px dashed var(--border); padding-top:1rem;">
                                <div style="display:grid; grid-template-columns: 1fr 1fr auto; gap:0.5rem;">
                                    <input type="text" name="name" placeholder="Name" required style="padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
                                    <input type="text" name="role" placeholder="Role (e.g. CEO)" style="padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
                                    <button type="submit" class="btn-secondary" style="padding:0.5rem 1rem;">Add</button>
                                </div>
                                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                                    <input type="text" name="email" placeholder="Email (Optional)" style="flex:1; padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
                                    <input type="text" name="phone" placeholder="Phone (Optional)" style="flex:1; padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
                                </div>
                            </form>

                            <div style="margin-top:3rem;">
                                <h3 style="font-size:0.9rem; font-weight:700; color:#cbd5e1; letter-spacing:1px; margin-bottom:1rem;">POSTURE JOURNEY</h3>
                                <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:1.5rem; display:flex; align-items:center; justify-content:space-between;">
                                    <div>
                                        <div style="font-size:0.8rem; color:#0ea5e9; font-weight:600; margin-bottom:4px;">CURRENT</div>
                                        <div style="font-size:1.1rem; font-weight:700; color:#0f172a;">${s.posture_current || (s.posture?.current) || '-'}</div>
                                    </div>
                                    <i data-lucide="arrow-right" style="color:#0ea5e9; width:24px; height:24px;"></i>
                                    <div style="text-align:right;">
                                        <div style="font-size:0.8rem; color:#0ea5e9; font-weight:600; margin-bottom:4px;">DESIRED</div>
                                        <div style="font-size:1.1rem; font-weight:700; color:#0f172a;">${s.posture_desired || (s.posture?.desired) || '-'}</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
             </div>
        `;
    }

    renderEdit(s) {
        // Reuse detailed edit form logic but ensure it preserves contacts!
        // For brevity, I will output a simplfied edit form that matches the V2 structure
        return `
            <div class="ledger-container">
                <h3>Editing: ${s.name}</h3>
                <form id="edit-sh-form" class="edit-form-v2" style="background:var(--bg-surface); padding:2rem; border-radius:12px;">
                    <input type="hidden" name="id" value="${s.id}">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
                        <div class="form-group"><label>Name</label><input type="text" name="name" value="${s.name}" required></div>
                        <div class="form-group"><label>Role</label><input type="text" name="role" value="${s.role}"></div>
                    </div>
                    
                    <!-- Meta -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                         <div class="form-group">
                            <label>Influence</label>
                            <select name="influence">
                                <option value="High" ${s.influence === 'High' ? 'selected' : ''}>High</option>
                                <option value="Medium" ${s.influence === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="Low" ${s.influence === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Interest</label>
                            <select name="interest">
                                <option value="High" ${s.interest === 'High' ? 'selected' : ''}>High</option>
                                <option value="Medium" ${s.interest === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="Low" ${s.interest === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                          <div class="form-group">
                            <label>Status</label>
                            <select name="posture_status">
                                <option value="Active" ${s.posture_status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Needs Attention" ${s.posture_status === 'Needs Attention' ? 'selected' : ''}>Needs Attention</option>
                                <option value="Stable" ${s.posture_status === 'Stable' ? 'selected' : ''}>Stable</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:1.5rem;">
                        <label>Engagement Strategy</label>
                         <textarea name="engagement_strategy" rows="2">${s.engagement_strategy || s.engagementStrategy || ''}</textarea>
                    </div>

                    <div class="form-group" style="margin-bottom:1.5rem;">
                        <label>Narrative Hook</label>
                         <textarea name="narrative_hook" rows="2">${s.narrative_hook || s.narrativeHook || ''}</textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:1.5rem;">
                         <label>Owner</label>
                         <input type="text" name="owner" value="${s.owner || ''}">
                    </div>
                    
                    <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--border);">
                        <h4 style="font-size:0.9rem; font-weight:700; color:var(--text-tertiary); margin-bottom:1rem;">Posture Journey</h4>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                             <div class="form-group">
                                <label>Current Posture</label>
                                <input type="text" name="posture_current" value="${s.posture_current || (s.posture?.current) || ''}" placeholder="e.g. Skeptical">
                            </div>
                            <div class="form-group">
                                <label>Desired Posture</label>
                                <input type="text" name="posture_desired" value="${s.posture_desired || (s.posture?.desired) || ''}" placeholder="e.g. Supportive">
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:1rem;">
                        <button type="button" id="cancel-edit-btn" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
    }

    renderAddForm() {
        return `
            <div class="add-stakeholder-form" style="background:var(--bg-canvas); padding:1rem; border-radius:8px; margin-bottom:2rem;">
                 <h3>Add New Stakeholder</h3>
                 <form id="add-sh-form">
                    <div class="form-group"><label>Name</label><input type="text" name="name" required style="width:100%"></div>
                    <div style="margin-top:1rem; text-align:right;">
                        <button type="button" id="cancel-add-sh" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Add</button>
                    </div>
                 </form>
            </div>
        `;
    }

    bindEvents(container) {
        // Grid Clicks
        if (!this.selectedId && !this.isAdding) {
            container.querySelectorAll('.stakeholder-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.selectedId = card.dataset.id;
                    this.viewMode = 'DETAIL';
                    this.renderAndUpdate(container);
                });
            });
        }

        // Add Contact Logic (Quick Add)
        const quickAddForm = container.querySelector('#quick-add-contact-form');
        if (quickAddForm) {
            quickAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(quickAddForm);
                const s = this.stakeholders.find(x => x.id === this.selectedId);
                if (s) {
                    const newContact = {
                        id: 'local_c_' + Date.now(),
                        name: fd.get('name'),
                        role: fd.get('role'),
                        email: fd.get('email'),
                        phone: fd.get('phone'),
                        is_primary: false
                    };

                    if (!s.contacts) s.contacts = [];
                    s.contacts.push(newContact);

                    if (this.onUpdate) this.onUpdate(s);
                    this.renderAndUpdate(container);
                }
            });
        }

        // Back, Edit, Delete (Standard)
        const backBtn = container.querySelector('#back-btn');
        if (backBtn) backBtn.addEventListener('click', () => { this.selectedId = null; this.renderAndUpdate(container); });

        const addBtn = container.querySelector('#add-sh-btn');
        if (addBtn) addBtn.addEventListener('click', () => { this.isAdding = true; this.renderAndUpdate(container); });

        const cancelAdd = container.querySelector('#cancel-add-sh');
        if (cancelAdd) cancelAdd.addEventListener('click', () => { this.isAdding = false; this.renderAndUpdate(container); });

        const addForm = container.querySelector('#add-sh-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(addForm);
                if (this.onAdd) this.onAdd({
                    name: fd.get('name'),
                    role: 'Partner',
                    influence: 'Medium',
                    interest: 'Medium',
                    posture_status: 'Active',
                    contacts: []
                });
                this.isAdding = false;
                this.renderAndUpdate(container);
            });
        }

        const editBtn = container.querySelector('#edit-sh-btn');
        if (editBtn) editBtn.addEventListener('click', () => { this.viewMode = 'EDIT'; this.renderAndUpdate(container); });

        const deleteBtn = container.querySelector('#delete-sh-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this stakeholder?')) {
                if (this.onDelete) this.onDelete(this.selectedId);
                this.selectedId = null;
                this.renderAndUpdate(container);
            }
        });

        const cancelEdit = container.querySelector('#cancel-edit-btn');
        if (cancelEdit) cancelEdit.addEventListener('click', () => { this.viewMode = 'DETAIL'; this.renderAndUpdate(container); });

        const editForm = container.querySelector('#edit-sh-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(editForm);
                const s = this.stakeholders.find(x => x.id === this.selectedId);
                const updated = {
                    ...s,
                    name: fd.get('name'),
                    role: fd.get('role'),
                    influence: fd.get('influence'),
                    interest: fd.get('interest'),
                    posture_status: fd.get('posture_status'),
                    narrative_hook: fd.get('narrative_hook'),
                    engagement_strategy: fd.get('engagement_strategy'),
                    owner: fd.get('owner'),
                    posture_current: fd.get('posture_current'),
                    posture_desired: fd.get('posture_desired')
                };
                if (this.onUpdate) this.onUpdate(updated);
                this.viewMode = 'DETAIL';
                this.renderAndUpdate(container);
            });
        }

    }

    renderAndUpdate(container) {
        container.innerHTML = this.render();
        this.bindEvents(container);
        if (window.lucide) window.lucide.createIcons();
    }

    getStatusClass(status) {
        if (!status) return 'neutral';
        const s = status.toLowerCase();
        if (s.includes('attention')) return 'danger';
        if (s.includes('supportive') || s.includes('stable')) return 'success';
        return 'neutral';
    }
}
