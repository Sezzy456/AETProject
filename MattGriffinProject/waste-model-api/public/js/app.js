document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLayout();
    initNavigation(); // Initialize sidebar clicks


    // Button Logic
    const burgerBtn = document.getElementById('burger-menu');
    const nav = document.querySelector('nav');
    if (burgerBtn && nav) {
        burgerBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    // Load Default View ONLY if on portal.html or if view-container exists
    const path = window.location.pathname;
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = 'portal.html';
        });
    }

    if (path.includes('portal.html') || document.getElementById('view-container')) {
        loadView('dashboard');
    } else if (path.includes('stakeholder_detail.html')) {
        renderStakeholderDetail(); // Standalone support
    }
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (savedTheme === 'bio') {
        body.classList.add('bio-mode');
        if (toggle) toggle.checked = true;
    }

    if (toggle) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                body.classList.add('bio-mode');
                localStorage.setItem('theme', 'bio');
            } else {
                body.classList.remove('bio-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

function initLayout() {
    const wrapper = document.getElementById('app-container');
    const toggle = document.getElementById('width-toggle');

    const savedWidth = localStorage.getItem('pageWidth');

    if (wrapper) {
        if (savedWidth === 'wide') {
            wrapper.classList.add('wide-view');
            if (toggle) toggle.checked = true;
        }
    }

    if (toggle && wrapper) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                wrapper.classList.add('wide-view');
                localStorage.setItem('pageWidth', 'wide');
            } else {
                wrapper.classList.remove('wide-view');
                localStorage.setItem('pageWidth', 'boxed');
            }
        });
    }
}

function renderDashboard() {
    // 1. Fetch Data
    const spine = window.getData('spine');

    // ORDER: Strategy -> Stats -> QA -> Stakeholders -> Activity -> Actions

    // --- 1. STRATEGY SPINE ---
    // Purpose (Mock Editable)
    if (spine && spine.purpose) {
        const purposeEl = document.getElementById('strategy-purpose');
        if (purposeEl) purposeEl.textContent = spine.purpose;

        // Edit Button Logic
        const editBtn = document.getElementById('btn-edit-strategy');
        if (editBtn) {
            editBtn.onclick = () => {
                const newPurpose = prompt("Edit Strategy Core:", spine.purpose);
                if (newPurpose) {
                    spine.purpose = newPurpose; // In-memory update
                    purposeEl.textContent = newPurpose;
                }
            };
        }
    }

    // Narratives
    if (spine && spine.narrative) {
        const coreEl = document.getElementById('narrative-core');
        const simpleEl = document.getElementById('narrative-simple');
        if (coreEl) coreEl.textContent = spine.narrative.core;
        if (simpleEl) simpleEl.textContent = spine.narrative.simple;
    }

    // Pillars Grid
    const pillarGrid = document.getElementById('pillars-grid');
    if (pillarGrid && spine.pillars) {
        pillarGrid.innerHTML = spine.pillars.map(p => `
            <div class="pillar-card">
                <h3>${p.title}</h3>
                <p style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.5rem;">${p.message}</p>
                <ul style="font-size: 0.9rem; padding-left: 1.2rem; color: var(--text-secondary);">
                    ${p.proofPoints.map(pp => `<li>${pp}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    // --- 2. STATS ---
    const stats = window.getData('stats');
    if (stats) {
        const s1 = document.getElementById('stat-total-stakeholders');
        const s2 = document.getElementById('stat-meetings');
        const s3 = document.getElementById('stat-actions');
        if (s1) s1.textContent = stats.totalStakeholders;
        if (s2) s2.textContent = stats.upcomingMeetings;
        if (s3) s3.textContent = stats.openActions;
    }

    // --- 3. KNOWLEDGE BANK (QA) ---
    renderKnowledgeBank(spine.qa_library);

    // --- 4. PREVIEWS (Stakeholders, Activity, Actions) ---
    const stakeholders = window.getData('stakeholders') || [];
    const activityLog = window.getData('activityLog') || [];
    const actions = window.getData('actions') || [];

    // Stakeholder Preview
    const shPreview = document.getElementById('preview-stakeholders');
    if (shPreview) {
        shPreview.innerHTML = stakeholders.slice(0, 4).map(s => `
            <div class="card" style="padding: 1rem; cursor: pointer;" onclick="location.href='stakeholder_detail.html?id=${s.id}'">
                <strong>${s.name}</strong><br>
                <div style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:0.8rem;">
                     <span>${s.role}</span>
                     <span style="color:var(--energy-algae);">${s.status}</span>
                </div>
            </div>
        `).join('');
    }

    // Activity Preview
    const acPreview = document.getElementById('preview-activity');
    if (acPreview) {
        acPreview.innerHTML = activityLog.slice(0, 3).map(a => `
            <div class="card" style="padding: 0.75rem; cursor: pointer;" onclick="location.href='activity_log.html'">
                <div style="display:flex; justify-content:space-between;">
                     <strong>${a.title}</strong>
                     <span style="font-size:0.8em; opacity:0.7;">${a.date}</span>
                </div>
                <small>${a.type} | ${a.status}</small>
            </div>
        `).join('');
    }

    // Actions Preview
    const actPreview = document.getElementById('preview-actions');
    if (actPreview) {
        actPreview.innerHTML = actions.slice(0, 4).map(a => `
             <div class="card" style="padding: 0.75rem; cursor: pointer;" onclick="location.href='actions.html'">
                <strong>${a.activity}</strong><br>
                <div style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:0.8rem;">
                    <span>Owner: ${a.owner}</span>
                    <span style="color:var(--energy-alert);">${a.status}</span>
                </div>
            </div>
        `).join('');
    }
}

function renderStakeholders() {
    const stakeholders = window.getData('stakeholders');
    const container = document.getElementById('stakeholder-list');
    container.innerHTML = '';

    stakeholders.forEach(s => {
        const card = document.createElement('div');
        card.className = 'portal-list-card';
        card.onclick = () => {
            if (document.getElementById('view-container')) {
                window.currentStakeholderId = s.id;
                loadView('stakeholder-detail');
            } else {
                location.href = `stakeholder_detail.html?id=${s.id}`;
            }
        };
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div>
                <h2>${s.name}</h2>
                <div style="margin-top:0.5rem; font-size:0.9rem; color:var(--text-secondary);">
                    ${s.narrativeHook || 'No narrative hook available.'}
                </div>
            </div>
            
            <div>
                <h3>Status</h3>
                <span class="status-badge" style="border-color:var(--energy-algae); color:var(--energy-algae);">${s.status}</span>
            </div>

            <div>
                <h3>Influence</h3>
                <div style="font-family:'Space Grotesk'; font-size:1.1rem;">${s.influence}</div>
            </div>

            <div>
                <h3>Engagement</h3>
                <p style="font-size:0.85rem;">${s.engagementStrategy || 'N/A'}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderStakeholderDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || window.currentStakeholderId;
    const stakeholders = window.getData('stakeholders');
    const s = stakeholders.find(item => item.id == id);

    if (!s) {
        const container = document.getElementById('view-container');
        if (container) container.innerHTML = '<div style="padding:2rem;">Stakeholder not found.</div>';
        return;
    }

    window.currentStakeholderId = id;
    document.title = `${s.name} - Detail`;

    const headerName = document.getElementById('detail-name');
    if (headerName) headerName.textContent = s.name;

    const fields = ['role', 'influence', 'interest', 'status', 'owner', 'narrativeHook', 'engagementStrategy'];
    fields.forEach(f => {
        const el = document.getElementById(`view-${f}`);
        if (el) el.textContent = s[f] || '-';

        // Also populate edit fields if they exist
        const editEl = document.getElementById(`edit-${f}`);
        if (editEl) editEl.value = s[f] || '';
    });
}

// Global scope function for saving edits
window.saveStakeholderEdit = function () {
    const id = window.currentStakeholderId;
    if (!id) return;

    const updates = {
        name: document.getElementById('edit-name').value,
        role: document.getElementById('edit-role').value,
        status: document.getElementById('edit-status').value,
        narrativeHook: document.getElementById('edit-narrativeHook').value,
        engagementStrategy: document.getElementById('edit-engagementStrategy').value,
        influence: document.getElementById('edit-influence').value,
        interest: document.getElementById('edit-interest').value,
        owner: document.getElementById('edit-owner').value
    };

    window.updateStakeholder(id, updates);
    alert('Stakeholder updated (Session Only)');
    location.reload(); // Reload to switch back to view mode (simple toggle logic usually refreshes or swaps divs)
}


function renderActivityLog() {
    const activityLog = window.getData('activityLog');
    const container = document.getElementById('activity-list');
    if (!container) return;
    container.innerHTML = '';

    activityLog.forEach(a => {
        const card = document.createElement('div');
        card.className = 'portal-list-card';

        let typeIcon = '📄';
        if (a.type === 'Meeting') typeIcon = '📅';
        if (a.type === 'Decision') typeIcon = '⚖️';
        if (a.type === 'Signal') typeIcon = '📡';

        card.innerHTML = `
            <div>
                 <h2>${typeIcon} ${a.title}</h2>
                 <p style="font-size:0.85rem; color:var(--text-secondary);">${a.notes}</p>
            </div>
            <div>
                <h3>Date</h3>
                <div style="font-family:'JetBrains Mono'; font-size:0.9rem;">${a.date}</div>
            </div>
            <div>
                <h3>Status</h3>
                <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
            </div>
            <div>
                <h3>Attendees</h3>
                <div style="font-size:0.85rem; color:var(--text-tertiary);">
                    ${a.attendees}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderActions() {
    const actions = window.getData('actions');
    const container = document.getElementById('actions-list');
    if (!container) return;

    container.innerHTML = '';

    actions.forEach(a => {
        const card = document.createElement('div');
        card.className = 'portal-list-card';
        card.innerHTML = `
            <div>
                <h2 style="margin:0;">${a.activity}</h2>
                ${a.phase ? `<div style="font-size:0.8rem; opacity:0.6; margin-top:0.25rem;">${a.phase}</div>` : ''}
            </div>
            <div>
                <h3>Owner</h3>
                <div style="font-size:0.9rem;">${a.owner || '-'}</div>
            </div>
            <div>
                <h3>Due Date</h3>
                <div style="font-family:'JetBrains Mono'; font-size:0.9rem;">${a.dueDate || '-'}</div>
            </div>
            <div>
                <h3>Status</h3>
                <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:start;">
                    <span class="status-badge">${a.status}</span>
                    ${a.linkType ? `<small style="opacity:0.6;">${a.linkType}</small>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}



function renderKnowledgeBank(qaLibrary) {
    const kbGrid = document.getElementById('knowledge-bank');
    if (kbGrid && qaLibrary) {
        kbGrid.innerHTML = qaLibrary.map(qa => `
            <div class="card" style="padding: 1rem;">
                <h3>${qa.category}</h3>
                <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-primary);">Q. ${qa.question}</p>
                <p style="font-size: 0.9rem;">${qa.answer}</p>
            </div>
        `).join('');
    }
}

// --- SPA ROUTING & TEMPLATES ---

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Allow navigation to Login or Public Home
            if (href === 'login.html' || href === 'index.html') return;

            e.preventDefault();

            // Update Active State
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            // Route
            const view = href.replace('.html', '');
            loadView(view);

            // Auto-close Burger Menu on Mobile
            const nav = document.querySelector('nav');
            if (nav && nav.classList.contains('open')) {
                nav.classList.remove('open');
            }
        });
    });
}

function loadView(viewName) {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (viewName === 'index' || viewName === 'portal') viewName = 'dashboard';

    // Check for ID in URL if navigating via hash or link
    const params = new URLSearchParams(window.location.search);
    if (!window.currentStakeholderId) {
        window.currentStakeholderId = params.get('id');
    }

    let template = '';
    let initFunc = null;

    switch (viewName) {
        case 'dashboard':
            template = getDashboardTemplate();
            initFunc = renderDashboard;
            break;
        case 'stakeholders':
            template = getStakeholdersTemplate();
            initFunc = renderStakeholders;
            break;
        case 'stakeholder_detail':
            template = getStakeholderDetailTemplate();
            initFunc = renderStakeholderDetail;
            break;
        case 'activity_log':
            template = getActivityLogTemplate();
            initFunc = renderActivityLog;
            break;
        case 'actions':
            template = getActionsTemplate();
            initFunc = renderActions;
            break;
        default:
            template = '<h2>404 - View Not Found</h2>';
    }

    // Inject HTML
    container.innerHTML = template;
    container.scrollTop = 0; // Reset scroll position (Desktop)
    window.scrollTo(0, 0); // Reset scroll position (Mobile)

    // Run Logic
    if (initFunc) {
        initFunc();
    }
}

// --- TEMPLATES ---
// Extracted from original HTML files

function getDashboardTemplate() {
    return `
                <header
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2>Dashboard</h2>
                        <p>Welcome back, Admin. System Status: Nominal.</p>
                    </div>
                    <div class="user-profile">
                        <span style="font-family: 'JetBrains Mono'; font-size: 0.8rem; color: var(--energy-algae);">●
                            ONLINE</span>
                    </div>
                </header>

                <!-- 1. Strategy Core (Editable) -->
                <div class="spine-section" style="margin-bottom: 2rem; border-left: 4px solid var(--energy-algae);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3><span class="material-symbols-outlined"
                                style="font-size: 1rem; color: var(--energy-algae);">verified</span> Strategy Core</h3>
                        <button id="btn-edit-strategy" class="btn-secondary"
                            style="height: 32px; font-size: 0.75rem; padding: 0 0.75rem;">Edit</button>
                    </div>
                    <p id="strategy-purpose" style="font-size: 1.1rem; font-weight: 500; margin-bottom: 1rem;">
                        Loading...</p>
                </div>

                <!-- 2. Narrative Block -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="card"
                        style="background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(16, 185, 129, 0.05) 100%);">
                        <h3>Core Narrative</h3>
                        <p id="narrative-core" style="font-size: 1.05rem; line-height: 1.6;">Loading...</p>
                    </div>
                    <div class="card">
                        <h3>Simple Narrative</h3>
                        <p id="narrative-simple" style="font-size: 1.05rem; line-height: 1.6;">Loading...</p>
                    </div>
                </div>

                <!-- 3. Stats Grid -->
                <!-- Removed inline columns to allow responsive auto-fit -->
                <div class="pillar-grid" style="margin-bottom: 2rem;">
                    <div class="card stat-card" onclick="loadView('stakeholders')" style="cursor: pointer;">
                        <h3>Total Stakeholders</h3>
                        <div class="stat-value" id="stat-total-stakeholders"
                            style="font-size: 2.5rem; font-weight: 700; color: var(--text-primary);">0</div>
                    </div>
                    <div class="card stat-card" onclick="loadView('activity_log')" style="cursor: pointer;">
                        <h3>Upcoming Activities</h3>
                        <div class="stat-value" id="stat-meetings"
                            style="font-size: 2.5rem; font-weight: 700; color: var(--text-primary);">0</div>
                    </div>
                    <div class="card stat-card" onclick="loadView('actions')" style="cursor: pointer;">
                        <h3>Open Actions</h3>
                        <div class="stat-value" id="stat-actions"
                            style="font-size: 2.5rem; font-weight: 700; color: var(--text-primary);">0</div>
                    </div>
                </div>

                <!-- 4. Pillars Grid -->
                <h3 style="margin-bottom: 1rem; color: var(--text-tertiary);">Strategic Pillars</h3>
                <div id="pillars-grid" class="pillar-grid" style="margin-bottom: 3rem;">
                    <!-- Populated by JS -->
                </div>

                <!-- 5. Knowledge Bank (FAQs) -->
                <h3 style="margin-bottom: 1rem; color: var(--text-tertiary);">Knowledge Bank (FAQs)</h3>
                <div id="knowledge-bank"
                    style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 3rem;">
                    <!-- Populated by JS -->
                </div>

                <!-- 6. Previews -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Stakeholders Preview -->
                    <div class="card">
                        <div
                            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Stakeholders</h3>
                            <button onclick="loadView('stakeholders')" class="btn-secondary"
                                style="font-size: 0.8rem; height: 32px;">View Ledger</button>
                        </div>
                        <div id="preview-stakeholders"
                            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        </div>
                    </div>

                    <!-- Activity Preview -->
                    <div class="card">
                        <div
                            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Activity Log</h3>
                             <button onclick="loadView('activity_log')" class="btn-secondary"
                                style="font-size: 0.8rem; height: 32px;">View Log</button>
                        </div>
                        <div id="preview-activity" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
                    </div>

                    <!-- Actions Preview -->
                    <div class="card">
                        <div
                            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Pending Actions</h3>
                             <button onclick="loadView('actions')" class="btn-secondary" style="font-size: 0.8rem; height: 32px;">View
                                All</button>
                        </div>
                        <div id="preview-actions"
                            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        </div>
                    </div>
                </div>
    `;
}

function getStakeholdersTemplate() {
    return `
                <header
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2>Stakeholder Ledger</h2>
                        <p>Complete register of key partners and community groups.</p>
                    </div>
                    <button class="btn-primary" onclick="alert('Add Stakeholder Modal (Mock)')">+ New
                        Stakeholder</button>
                </header>

                <div class="ledger-grid" id="stakeholder-list">
                    <!-- Populated by JS -->
                </div>
    `;
}

function getStakeholderDetailTemplate() {
    return `
         <header style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: start;">
            <div>
                <button onclick="loadView('stakeholders')" class="btn-secondary" style="margin-bottom:1rem; border:none; padding:0; height:auto; background:none;">← Back to Ledger</button>
                <h2 id="detail-name">Loading Profile...</h2>
                <div class="status-badge" id="view-status-badge" style="display: inline-block; border-color: var(--energy-algae); color: var(--energy-algae);">Active</div>
            </div>
            <button class="btn-primary" onclick="document.getElementById('edit-modal').showModal()">
                <span class="material-symbols-outlined">edit</span> Edit Stakeholder
            </button>
         </header>

         <div class="spine-section" style="margin-bottom: 2rem;">
            <h3>Core Profile</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 2rem; margin-top: 1.5rem;">
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 0.25rem;">Role</span>
                    <div id="view-role" style="font-size: 1.1rem; font-weight: 500;">-</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 0.25rem;">Status</span>
                    <div id="view-status" style="font-size: 1.1rem; font-weight: 500;">-</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 0.25rem;">Influence</span>
                    <div id="view-influence" style="font-size: 1.1rem;">-</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 0.25rem;">Interest</span>
                    <div id="view-interest" style="font-size: 1.1rem;">-</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 0.25rem;">Owner</span>
                    <div id="view-owner" style="font-size: 1.1rem;">-</div>
                </div>
            </div>
         </div>

         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div class="card">
                <h3>Narrative Hook</h3>
                <p id="view-narrativeHook" style="font-style: italic; color: var(--text-secondary); margin-top: 1rem;">-</p>
            </div>
            <div class="card">
                <h3>Engagement Strategy</h3>
                <p id="view-engagementStrategy" style="margin-top: 1rem;">-</p>
            </div>
         </div>

         <!-- Native Edit Modal Integration -->
         <dialog id="edit-modal" style="background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-highlight); border-radius: var(--radius-node); padding: 2rem; width: 100%; max-width: 500px; backdrop-filter: blur(10px);">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem;">Edit Stakeholder</h2>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Name</label>
                    <input type="text" id="edit-name">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Role</label>
                        <input type="text" id="edit-role">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Status</label>
                        <select id="edit-status">
                            <option value="Active">Active</option>
                            <option value="Needs Attention">Needs Attention</option>
                            <option value="Stable">Stable</option>
                            <option value="Monitor">Monitor</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Influence</label>
                        <select id="edit-influence">
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Interest</label>
                        <select id="edit-interest">
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Owner</label>
                    <input type="text" id="edit-owner">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Narrative Hook</label>
                    <textarea id="edit-narrativeHook" rows="2"></textarea>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-tertiary);">Engagement Strategy</label>
                    <textarea id="edit-engagementStrategy" rows="2"></textarea>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                    <button class="btn-secondary" onclick="document.getElementById('edit-modal').close()">Cancel</button>
                    <button class="btn-primary" onclick="window.saveStakeholderEdit()">Save Changes</button>
                </div>
            </div>
         </dialog>
    `;
}

function getActivityLogTemplate() {
    return `
                <header
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2>Activity Log</h2>
                        <p>Chronological record of interactions, decisions, and signals.</p>
                    </div>
                    <button class="btn-primary" onclick="alert('Log Activity Modal (Mock)')">+ Log Activity</button>
                </header>

                <!-- Filter Bar (Mock) -->
                <div class="spine-section"
                    style="padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center;">
                    <span class="material-symbols-outlined" style="opacity: 0.5;">filter_list</span>
                    <select style="width: 200px;">
                        <option>All Activities</option>
                        <option>Meetings</option>
                        <option>Decisions</option>
                        <option>Signals</option>
                    </select>
                </div>

                <div class="ledger-grid" id="activity-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    <!-- Populated by JS -->
                </div>
    `;
}

function getActionsTemplate() {
    return `
                <header
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2>Actions / Goals</h2>
                        <p>Track tactical execution and strategic alignment.</p>
                    </div>
                    <button class="btn-primary" onclick="alert('Add Action Modal (Mock)')">+ New Action</button>
                </header>

                <!-- Filter Bar (Mock) -->
                <div class="spine-section"
                    style="padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center;">
                    <span class="material-symbols-outlined" style="opacity: 0.5;">filter_list</span>
                    <select style="width: 200px;">
                        <option>All Actions</option>
                        <option>Pending</option>
                        <option>Completed</option>
                    </select>
                </div>

                <div class="table-container spine-section">
                    <table>
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Owner</th>
                                <th>Linked To</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="actions-list">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
    `;
}
