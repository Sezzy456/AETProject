
export class StrategySpineView {
    constructor(data, onSave) {
        this.data = data;
        this.onSave = onSave;
        this.isEditing = false;
    }

    render() {
        const { spine } = this.data;
        const isPresentation = document.body.classList.contains('presentation-mode');
        // If in presentation mode, force read-only (unless we want to live edit in presentation?)
        // Let's assume Edit is an internal administrative action, so maybe hide Edit button in Presentation Mode?
        // Or keep it visible. Let's keep it simple.

        const editBtn = `
            <button id="edit-spine-btn" class="btn-secondary" style="font-size:0.8rem; padding: 0.25rem 0.75rem;">
                <i data-lucide="edit-3" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Edit Strategy
            </button>
        `;

        const saveControls = `
            <div style="display:flex; gap:0.5rem;">
                <button id="cancel-spine-btn" class="btn-secondary">Cancel</button>
                <button id="save-spine-btn" class="btn-primary">Save Changes</button>
            </div>
        `;

        if (this.isEditing) {
            return `
                <div class="spine-section">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h2>Edit Strategy Spine</h2>
                        ${saveControls}
                    </div>
                    
                    <div class="form-group">
                        <label>Purpose</label>
                        <input type="text" name="purpose" value="${spine.purpose}" style="width:100%; font-size:1.1rem; padding:0.5rem;">
                    </div>

                    <div class="form-group">
                        <label>Core Narrative</label>
                        <textarea name="narrative_core" rows="3" style="width:100%; font-size:1rem; padding:0.5rem;">${spine.narrative.core}</textarea>
                    </div>

                    <div class="form-group">
                         <label>Simple Narrative</label>
                         <textarea name="narrative_simple" rows="3" style="width:100%; font-size:1rem; padding:0.5rem;">${spine.narrative.simple}</textarea>
                    </div>

                    <h3>Pillars</h3>
                    <div class="pillar-grid">
                        ${spine.pillars.map((p, idx) => `
                            <div class="pillar-card" style="border:1px solid var(--primary);">
                                <input type="hidden" name="p_id_${idx}" value="${p.id}">
                                <div class="form-group">
                                    <label>Title</label>
                                    <input type="text" name="p_title_${idx}" value="${p.title}" style="width:100%; font-weight:bold;">
                                </div>
                                <div class="form-group">
                                    <label>Message</label>
                                    <textarea name="p_message_${idx}" rows="2" style="width:100%">${p.message}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Proof Points (One per line)</label>
                                    <textarea name="p_proof_${idx}" rows="3" style="width:100%">${p.proofPoints.join('\n')}</textarea>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="spine-section">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Strategy Core</h2>
                    ${!isPresentation ? editBtn : ''}
                </div>
                <p style="font-size: 1.25rem; font-weight: 500; color: var(--primary); margin-top:0.5rem;">${spine.purpose}</p>
            </div>

            <div class="spine-section">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Objectives</h3>
                    ${isPresentation ? '<span class="badge">FOCUS</span>' : ''}
                </div>
                <ul style="padding-left: 20px; margin-top: 1rem; font-size: 1.1rem;">
                    ${spine.objectives.map(obj => `<li style="margin-bottom:0.5rem;">${obj.text}</li>`).join('')}
                </ul>
            </div>

            <div class="spine-section" style="border-left: 4px solid var(--accent);">
                <h3>Core Narrative</h3>
                <p style="font-style: italic; font-size: 1.15rem;">"${spine.narrative.core}"</p>
                <p style="font-size: 0.95rem; color:var(--text-muted); margin-top:1rem;"><strong>Simple:</strong> ${spine.narrative.simple}</p>
            </div>

            <div class="pillar-grid">
                ${spine.pillars.map(p => `
                    <div class="pillar-card">
                        <h4>${p.title}</h4>
                        <p>${p.message}</p>
                        <ul class="proof-points">
                            ${p.proofPoints.map(pp => `<li>${pp}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>

            <!-- Q&A Library (Knowledge Bank) -->
            ${this.renderQALibrary(spine.qa_library)}
        `;
    }

    bindEvents(container) {
        // Edit Button
        const editBtn = container.querySelector('#edit-spine-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.isEditing = true;
                // Re-render the View Container content
                // This is a bit manual, but works for vanilla JS
                container.innerHTML = this.render();
                this.bindEvents(container);
            });
        }

        // Cancel Button
        const cancelBtn = container.querySelector('#cancel-spine-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.isEditing = false;
                container.innerHTML = this.render();
                this.bindEvents(container);
            });
        }

        // Save Button
        const saveBtn = container.querySelector('#save-spine-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleSave(container);
            });
        }
    }

    handleSave(container) {
        // Collect Data
        // IMPORTANT: We need to reconstruct the original structure of `spine`
        const purpose = container.querySelector('input[name="purpose"]').value;
        const narrativeCore = container.querySelector('textarea[name="narrative_core"]').value;
        const narrativeSimple = container.querySelector('textarea[name="narrative_simple"]').value;

        // Reconstruct Pillars
        const pillars = [];
        // We know we rendered them by index
        const originalPillars = this.data.spine.pillars; // Use length reference or just looping

        for (let i = 0; i < originalPillars.length; i++) {
            const title = container.querySelector(`input[name="p_title_${i}"]`).value;
            const message = container.querySelector(`textarea[name="p_message_${i}"]`).value;
            const proofText = container.querySelector(`textarea[name="p_proof_${i}"]`).value;

            pillars.push({
                id: container.querySelector(`input[name="p_id_${i}"]`).value,
                title,
                message,
                proofPoints: proofText.split('\n').filter(line => line.trim().length > 0)
            });
        }

        // Construct New Spine Object
        const newSpine = {
            ...this.data.spine, // Keep IDs etc
            purpose,
            narrative: {
                core: narrativeCore,
                simple: narrativeSimple
            },
            pillars
        };

        // Call parent
        if (this.onSave) {
            this.onSave(newSpine);
        }

        this.isEditing = false;
        // The parent (app.js) will likely re-render the whole app after save which updates 'data' ref
    }

    renderQALibrary(qaList) {
        if (!qaList || qaList.length === 0) return '';

        // Group by Category
        const categories = {};
        qaList.forEach(q => {
            if (!categories[q.category]) categories[q.category] = [];
            categories[q.category].push(q);
        });

        return `
            <div class="spine-section mt-8 border-t border-slate-200 pt-8">
                <div class="flex items-center gap-2 mb-4">
                    <i data-lucide="book-open" class="text-indigo-600"></i>
                    <h3 class="text-xl font-bold text-slate-800">The Knowledge Bank</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${Object.keys(categories).map(cat => `
                        <div class="bg-slate-50 rounded-lg p-5">
                            <h4 class="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">${cat}</h4>
                            <div class="space-y-4">
                                ${categories[cat].map(q => `
                                    <div class="qa-item">
                                        <div class="font-semibold text-indigo-900 text-sm mb-1">Q. ${q.question}</div>
                                        <div class="text-slate-600 text-sm leading-relaxed">${q.answer}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
