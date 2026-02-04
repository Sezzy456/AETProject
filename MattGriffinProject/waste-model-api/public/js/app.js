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

    // Load Default View
    loadView('dashboard');

    // Handle Login Mock
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Mock login success
            window.location.href = 'portal.html';
        });
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
    // Target the global app container as per request
    const wrapper = document.getElementById('app-container');
    const toggle = document.getElementById('width-toggle');

    // Load state
    const savedWidth = localStorage.getItem('pageWidth');

    if (wrapper) {
        if (savedWidth === 'boxed') {
            wrapper.classList.add('container-boxed');
            if (toggle) toggle.checked = true;
        }
    }

    if (toggle && wrapper) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                wrapper.classList.add('container-boxed');
                localStorage.setItem('pageWidth', 'boxed');
            } else {
                wrapper.classList.remove('container-boxed');
                localStorage.setItem('pageWidth', 'full');
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
        card.className = 'stakeholder-card';
        card.onclick = () => location.href = `stakeholder_detail.html?id=${s.id}`;
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
    const id = params.get('id');
    const stakeholders = window.getData('stakeholders');
    const s = stakeholders.find(item => item.id == id);

    if (!s) {
        document.getElementById('main-content').innerHTML = '<div style="padding:2rem;">Stakeholder not found.</div>';
        return;
    }

    // Populate View (assuming DOM elements exist in stakeholder_detail.html)
    document.title = `${s.name} - Detail`;

    // Header
    const headerName = document.getElementById('detail-name');
    if (headerName) headerName.textContent = s.name;

    // Fields
    const fields = ['role', 'influence', 'interest', 'status', 'owner', 'narrativeHook', 'engagementStrategy'];
    fields.forEach(f => {
        const el = document.getElementById(`view-${f}`);
        if (el) el.textContent = s[f] || '-';
    });

    // Edit Logic binding
    window.currentStakeholderId = id; // Store for save
}

// Global scope function for saving edits
window.saveStakeholderEdit = function () {
    const id = window.currentStakeholderId;
    if (!id) return;

    const updates = {
        name: document.getElementById('edit-name').value,
        role: document.getElementById('edit-role').value,
        status: document.getElementById('edit-status').value,
        narrativeHook: document.getElementById('edit-narrativeHook').value
    };

    window.updateStakeholder(id, updates);
    alert('Stakeholder updated (Session Only)');
    location.reload(); // Reload to switch back to view mode (simple toggle logic usually refreshes or swaps divs)
}


function renderActivityLog() {
    const activityLog = window.getData('activityLog');
    const container = document.getElementById('activity-list');
    container.innerHTML = '';

    activityLog.forEach(a => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';

        let typeIcon = '📄';
        if (a.type === 'Meeting') typeIcon = '📅';
        if (a.type === 'Decision') typeIcon = '⚖️';
        if (a.type === 'Signal') typeIcon = '📡';

        card.innerHTML = `
            <div>
                 <h3>${typeIcon} ${a.title}</h3>
                 <p style="margin-top:0.5rem;">${a.notes}</p>
                 <div style="margin-top:0.5rem; font-size:0.85rem; opacity:0.8;">Attendees: ${a.attendees}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:'JetBrains Mono'; font-size:0.8rem; margin-bottom:0.5rem;">${a.date}</div>
                <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${a.activity}</strong>
                ${a.phase ? `<br><small style="opacity:0.6;">${a.phase}</small>` : ''}
            </td>
            <td>${a.owner || '-'}</td>
            <td>${a.linkType ? `${a.linkType}` : '-'}</td>
            <td>${a.dueDate || '-'}</td>
            <td><span class="status-badge">${a.status}</span></td>
        `;
        container.appendChild(row);
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
    // Basic structure for detail, assuming renderStakeholderDetail fills the IDs
    return `
         <header style="margin-bottom: 2rem;">
            <button onclick="loadView('stakeholders')" class="btn-secondary" style="margin-bottom:1rem;">← Back to Ledger</button>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                     <h2 id="detail-name">Loading...</h2>
                     <p>Stakeholder Profile</p>
                </div>
                 <div style="display: gap: 0.5rem;">
                     <button class="btn-primary" onclick="window.saveStakeholderEdit()">Save Changes</button>
                 </div>
            </div>
         </header>

         <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
             <!-- Left: Details -->
             <div class="card">
                 <h3>Profile</h3>
                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
                     <div>
                         <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.25rem;">Role</label>
                         <div id="view-role" style="font-weight:500;">-</div>
                         <input id="edit-role" type="text" style="display:none;" />
                     </div>
                      <div>
                         <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.25rem;">Status</label>
                         <span id="view-status" class="status-badge">-</span>
                           <select id="edit-status" style="display:none;">
                                <option value="Active">Active</option>
                                <option value="Needs Attention">Needs Attention</option>
                                <option value="Stable">Stable</option>
                           </select>
                     </div>
                      <div>
                         <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.25rem;">Influence</label>
                         <div id="view-influence">-</div>
                     </div>
                      <div>
                         <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.25rem;">Owner</label>
                         <div id="view-owner">-</div>
                     </div>
                 </div>

                 <div style="margin-top: 1.5rem;">
                      <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.25rem;">Narrative Hook</label>
                      <p id="view-narrativeHook" style="font-style: italic; color: var(--text-secondary);">-</p>
                      <textarea id="edit-narrativeHook" rows="3" style="display:none; width:100%;"></textarea>
                 </div>
                 
                 <div style="margin-top: 1rem;">
                     <button class="btn-secondary" onclick="document.getElementById('edit-mode-toggle').click()">Edit Details</button>
                     <!-- Invisible toggle for mock logic from before -->
                     <button id="edit-mode-toggle" style="display:none;" onclick="
                        const isEdit = this.getAttribute('data-editing') === 'true';
                        if(!isEdit) {
                           // Enter Edit
                           this.setAttribute('data-editing', 'true');
                           document.getElementById('view-narrativeHook').style.display='none';
                           const hook = document.getElementById('view-narrativeHook').textContent;
                           const hookInput = document.getElementById('edit-narrativeHook');
                           hookInput.style.display='block';
                           hookInput.value = hook;

                           // Name
                           const name = document.getElementById('detail-name').textContent;
                           const nameInput = document.createElement('input'); 
                           nameInput.id = 'edit-name';
                           nameInput.value = name;
                           document.getElementById('detail-name').innerHTML = '';
                           document.getElementById('detail-name').appendChild(nameInput);
                           
                           // Role
                           document.getElementById('view-role').style.display='none';
                           const role = document.getElementById('view-role').textContent;
                           const roleInput = document.getElementById('edit-role');
                           roleInput.style.display='block';
                           roleInput.value = role;

                           // Status
                           document.getElementById('view-status').style.display='none';
                           const statInput = document.getElementById('edit-status');
                           statInput.style.display='block';
                           
                        }
                     "></button>
                 </div>
             </div>

             <!-- Right: History -->
             <div class="card">
                 <h3>Recent Interactions</h3>
                 <div style="margin-top: 1rem; opacity: 0.6; font-size: 0.9rem;">
                     Mock history items...
                 </div>
             </div>
         </div>
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
