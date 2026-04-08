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
    // 1. Stats Grid
    const stats = window.getData('stats');
    if (stats) {
        document.getElementById('dash-sh-total').textContent = stats.stakeholders.total;
        document.getElementById('dash-sh-healthy').textContent = stats.stakeholders.healthy;
        document.getElementById('dash-sh-neutral').textContent = stats.stakeholders.neutral;
        document.getElementById('dash-sh-risk').textContent = stats.stakeholders.atRisk;

        document.getElementById('dash-int-upcoming').textContent = stats.interactions.upcoming;
        document.getElementById('dash-int-total').textContent = stats.interactions.total;

        document.getElementById('dash-act-total').textContent = stats.actions.total;
        document.getElementById('dash-act-active').textContent = stats.actions.active;
    }

    // 2. AI Overview
    const aiOverview = window.getData('aiOverview');
    if (aiOverview) {
        document.getElementById('dash-ai-summary').textContent = aiOverview;
    }

    // 3. Current Actions
    const actions = window.getData('actions') || [];
    const actionsList = document.getElementById('dash-actions-list');
    if (actionsList) {
        actionsList.innerHTML = actions.slice(0, 3).map(a => `
            <div class="card" style="padding: 1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span class="status-badge" style="font-size:0.7rem; padding:0.1rem 0.5rem; margin-bottom:0.5rem; border-color:var(--energy-algae); color:var(--energy-algae);">${a.status}</span>
                    <h4 style="margin:0; font-size:1rem; color:var(--text-primary); text-transform:none;">${a.activity}</h4>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">Owner: ${a.owner} <span style="margin:0 0.5rem;">|</span> Due: ${a.dueDate || 'TBD'}</div>
                </div>
                <button class="btn-secondary" style="font-size:0.75rem; height:28px; padding:0 0.5rem;" onclick="loadView('actions')">
                    <span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit
                </button>
            </div>
        `).join('');
    }

    // 4. Interactions
    const interactions = window.getData('interactions') || [];
    const upcomingContainer = document.getElementById('dash-upcoming-interactions');
    const recentContainer = document.getElementById('dash-recent-interactions');

    const renderInteraction = (i) => `
        <div class="card" style="padding: 1rem; border:1px solid var(--border-subtle);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <span style="font-size:0.75rem; color:${i.type==='Upcoming'?'var(--energy-alert)':'var(--text-tertiary)'}; font-weight:600; text-transform:uppercase;">${i.rawDate} - ${i.type}</span>
                <button class="btn-secondary" style="font-size:0.75rem; height:28px; padding:0 0.5rem;">
                     <span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit
                </button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1rem;">
                <h4 style="margin:0; font-size:1.1rem; color:var(--text-primary); text-transform:none;">${i.title}</h4>
                <div style="font-weight:700; font-family:'JetBrains Mono'; font-size:1rem;">${i.date}</div>
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
                <strong>${i.agenda ? 'Agenda' : 'Summary'}:</strong> ${i.agenda || i.discussed}
            </div>
            <div style="font-size:0.85rem; margin-bottom:0.5rem;">
                <strong>Discussed:</strong> 
                ${i.topics.map(t => `<span class="status-badge" style="font-size:0.7rem; padding:0.1rem 0.4rem; border:none; background:rgba(16,185,129,0.1); color:var(--energy-algae); margin-right:0.25rem;">${t}</span>`).join('')}
            </div>
            <div style="font-size:0.85rem;">
                <strong>Attendees:</strong>
                ${i.attendees.map(a => `<span style="display:inline-block; margin-right:0.5rem; color:var(--text-secondary);"><span class="material-symbols-outlined" style="font-size:0.9rem; vertical-align:middle; margin-right:0.1rem;">person</span>${a}</span>`).join('')}
            </div>
        </div>
    `;

    if (upcomingContainer) upcomingContainer.innerHTML = interactions.filter(i => i.type === 'Upcoming').map(renderInteraction).join('');
    if (recentContainer) recentContainer.innerHTML = interactions.filter(i => i.type === 'Recent').map(renderInteraction).join('');

    // 5. Strategy Spine
    const spine = window.getData('spine');
    if (spine) {
        const objContainer = document.getElementById('dash-spine-objectives');
        if (objContainer && spine.objectives) {
            objContainer.innerHTML = spine.objectives.slice(0, 3).map(o => `
                <li style="display:flex; gap:0.5rem; margin-bottom:0.25rem;"><span style="color:var(--energy-algae);">✅</span> ${o.text}</li>
            `).join('');
        }

        const pillarContainer = document.getElementById('dash-spine-pillars');
        if (pillarContainer && spine.pillars) {
            pillarContainer.innerHTML = spine.pillars.slice(0, 4).map(p => `
                <div style="padding:0.5rem 0.75rem; background:rgba(0,0,0,0.02); border:1px solid var(--border-subtle); border-radius:4px; color:var(--text-secondary);">${p.title}</div>
            `).join('');
        }
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
        // Resolve Reference Name
        let referenceName = '-';
        if (a.linkType === 'Objective') {
            const objectives = window.getData('spine')?.objectives || [];
            const obj = objectives.find(o => o.id === a.linkId);
            referenceName = obj ? obj.text : a.linkId;
        } else if (a.linkType === 'Stakeholder') {
            const stakeholders = window.getData('stakeholders') || [];
            const sh = stakeholders.find(s => s.id === a.linkId);
            referenceName = sh ? sh.name : a.linkId;
        }

        const card = document.createElement('div');
        card.className = 'portal-list-card';
        // Add specific 5-column grid override for Actions
        card.style.display = 'grid';
        card.style.gridTemplateColumns = '2fr 1fr 1fr 1.5fr 1fr';

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
                <h3>Linked To</h3>
                <div style="font-size:0.85rem; line-height: 1.4; color: var(--text-secondary);">${referenceName}</div>
            </div>
            <div>
                <h3>Status</h3>
                <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:start;">
                    <span class="status-badge">${a.status}</span>
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
        case 'strategy_spine':
            template = getStrategySpineTemplate();
            initFunc = renderStrategySpine;
            break;
        case 'knowledge_bank':
            template = getKnowledgeBankTemplate();
            initFunc = renderKnowledgeBank;
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
        <header style="display: flex; justify-content: center; align-items: center; margin-bottom: 2rem;">
            <h2>Dashboard</h2>
        </header>

        <!-- Stats Grid -->
        <div class="pillar-grid" style="margin-bottom: 2rem; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <!-- Stakeholders -->
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="color:var(--text-tertiary); margin-bottom:0.25rem;">Stakeholders</h3>
                    <div id="dash-sh-total" style="font-size: 2.5rem; font-weight: 700;">16</div>
                </div>
                <div style="font-size: 0.8rem; line-height:1.5;">
                    <div><span style="color:var(--energy-algae);">●</span> <span id="dash-sh-healthy">5</span> Healthy</div>
                    <div><span style="color:var(--energy-solar);">●</span> <span id="dash-sh-neutral">8</span> Neutral</div>
                    <div><span style="color:var(--energy-alert);">●</span> <span id="dash-sh-risk">3</span> At Risk</div>
                </div>
            </div>

            <!-- Interactions -->
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="color:var(--text-tertiary); margin-bottom:0.25rem;">Interactions</h3>
                    <div id="dash-int-upcoming" style="font-size: 2.5rem; font-weight: 700;">2</div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">Upcoming</div>
                </div>
                <div style="text-align:right;">
                    <br>
                    <div id="dash-int-total" style="font-size: 2.5rem; font-weight: 700;">12</div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">Total</div>
                </div>
            </div>

            <!-- Actions -->
            <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="color:var(--text-tertiary); margin-bottom:0.25rem;">Actions</h3>
                    <div id="dash-act-total" style="font-size: 2.5rem; font-weight: 700;">12</div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">Total</div>
                </div>
                <div style="text-align:right;">
                    <br>
                    <div id="dash-act-active" style="font-size: 2.5rem; font-weight: 700;">4</div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">Your Active Actions</div>
                </div>
            </div>
        </div>

        <!-- AI Overview Summary -->
        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color:var(--text-tertiary);">AI overview summary / Executive Summary</h3>
            <p id="dash-ai-summary" style="font-size: 1rem; color: var(--text-secondary); margin-top: 1rem;">Loading...</p>
        </div>

        <!-- Your Current Actions -->
        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color:var(--text-tertiary); margin-bottom: 1rem;">Your Current Actions</h3>
            <div id="dash-actions-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
                <!-- Filled by JS -->
            </div>
            <div style="display:flex; justify-content:flex-end;">
                <button class="btn-secondary" style="font-size:0.75rem; height:28px; padding:0 0.5rem;" onclick="loadView('actions')">View All</button>
            </div>
        </div>

        <!-- Upcoming Interactions -->
        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color:var(--text-tertiary); margin-bottom: 1rem;">Upcoming Interactions</h3>
            <div id="dash-upcoming-interactions" style="display: flex; flex-direction: column; gap: 0.5rem;">
               <!-- Filled by JS -->
            </div>
        </div>

        <!-- Recent Interactions -->
        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color:var(--text-tertiary); margin-bottom: 1rem;">Recent Interactions</h3>
            <div id="dash-recent-interactions" style="display: flex; flex-direction: column; gap: 0.5rem;">
               <!-- Filled by JS -->
            </div>
        </div>

        <!-- Strategy Spine Preview -->
        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="color:var(--text-tertiary); margin-bottom: 1rem;">Strategy Spine</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="card" style="background:var(--bg-app); border:1px solid var(--border-subtle); display:flex; flex-direction:column;">
                    <h4 style="margin-bottom:1rem; font-size:0.9rem;">Objectives</h4>
                    <ul id="dash-spine-objectives" style="list-style:none; padding:0; font-size:0.85rem; display:flex; flex-direction:column; gap:0.5rem;">
                    </ul>
                    <div style="margin-top:auto; display:flex; justify-content:flex-end; padding-top:1rem;">
                        <button class="btn-secondary" style="font-size:0.75rem; height:28px; padding:0 0.5rem;">View All</button>
                    </div>
                </div>
                <div class="card" style="background:var(--bg-app); border:1px solid var(--border-subtle); display:flex; flex-direction:column;">
                    <h4 style="margin-bottom:1rem; font-size:0.9rem;">Strategic Pillars</h4>
                    <div id="dash-spine-pillars" style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
                    </div>
                    <div style="margin-top:auto; display:flex; justify-content:flex-end; padding-top:1rem;">
                        <button class="btn-secondary" style="font-size:0.75rem; height:28px; padding:0 0.5rem;">View All</button>
                    </div>
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

                <div class="ledger-grid" id="actions-list">
                    <!-- Populated by JS -->
                </div>
    `;
}

function getStrategySpineTemplate() {
    return `
        <header style="display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; position: relative;">
            <h2>Strategy Spine</h2>
            <button id="spine-edit-toggle" class="btn-secondary" style="position: absolute; right: 0; display:flex; align-items:center; gap:0.25rem;">
                <span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit
            </button>
        </header>

        <!-- Comms Strategy Core -->
        <div class="card" style="margin-bottom: 2rem; text-align: center; position:relative;">
            <h3 style="margin-bottom:0.5rem; font-size:1.2rem;">Comms Strategy Core</h3>
            <p id="spine-purpose" style="color:var(--text-secondary); font-size:1rem;">Loading...</p>
            <button class="btn-secondary spine-edit-btn" onclick="openSpineModal('purpose')" style="display:none; position:absolute; right:1rem; top:1rem;"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span></button>
        </div>

        <!-- Objectives -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="color:var(--text-tertiary); margin:0;">Objectives</h3>
            <button class="btn-primary spine-edit-btn" onclick="window.addObjectiveInline()" style="display:none; font-size:0.75rem; padding: 0.2rem 0.5rem;">+ Add Objective</button>
        </div>
        <div class="card" style="margin-bottom: 2rem;">
            <ul id="spine-objectives-list" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.5rem;">
               <!-- Loaded by JS -->
            </ul>
        </div>

        <!-- Core Narrative -->
        <h3 style="color:var(--text-tertiary); margin-bottom: 1rem;">Core Narrative</h3>
        <div class="card" style="margin-bottom: 2rem;">
            <button class="btn-secondary spine-edit-btn" onclick="openSpineModal('narrative')" style="display:none; float:right; margin: 0 0 0.5rem 1rem;"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span></button>
            <p id="spine-narrative-core" style="font-style:italic; margin-bottom:1rem; color:var(--text-primary);"></p>
            <p id="spine-narrative-simple" style="color:var(--text-secondary);"></p>
            <div style="clear:both;"></div>
        </div>

        <!-- Strategic Pillars -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="color:var(--text-tertiary); margin:0;">Strategic Pillars</h3>
            <button class="btn-primary spine-edit-btn" onclick="openSpineModal('add-pillar')" style="display:none; font-size:0.75rem; padding: 0.2rem 0.5rem;">+ Add Pillar</button>
        </div>
        <div id="spine-pillars-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom:3rem;">
            <!-- Loaded by JS -->
        </div>

        <!-- Modals -->
        <dialog id="spine-modal" onmousedown="if(event.target===this)this.close()" style="border:1px solid var(--border-subtle); border-radius:8px; padding:1.5rem; width:500px; max-width:90vw; background:var(--bg-surface); color:var(--text-primary); box-shadow:0 10px 30px rgba(0,0,0,0.3); margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; cursor:move;" id="spine-modal-header">
                <h3 id="spine-modal-title">Edit</h3>
                <button onclick="document.getElementById('spine-modal').close()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div id="spine-modal-body" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- dynamic inputs inserted here -->
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button class="btn-secondary" onclick="document.getElementById('spine-modal').close()">Cancel</button>
                <button class="btn-primary" id="spine-modal-save">Save</button>
            </div>
        </dialog>
    `;
}

let isSpineEditMode = false;
let currentEditId = null; 

function renderStrategySpine() {
    isSpineEditMode = false;
    refreshSpineUI();

    const editToggle = document.getElementById('spine-edit-toggle');
    if (editToggle) {
        editToggle.addEventListener('click', () => {
            isSpineEditMode = !isSpineEditMode;
            editToggle.style.background = isSpineEditMode ? 'var(--energy-algae)' : '';
            editToggle.style.color = isSpineEditMode ? '#000' : '';
            editToggle.innerHTML = isSpineEditMode 
                ? '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done'
                : '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            
            const btns = document.querySelectorAll('.spine-edit-btn');
            btns.forEach(btn => btn.style.display = isSpineEditMode ? 'flex' : 'none');
            // Re-render to update inline list edit buttons
            refreshSpineUI(); 
        });
    }

    // Draggable modal logic
    const modal = document.getElementById('spine-modal');
    const header = document.getElementById('spine-modal-header');
    if (modal && header) {
        let isDragging = false;
        let offset = {x:0, y:0};
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = modal.getBoundingClientRect();
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            modal.style.margin = '0';
            modal.style.left = (e.clientX - offset.x) + 'px';
            modal.style.top = (e.clientY - offset.y) + 'px';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

function refreshSpineUI() {
    const spine = window.getData('spine');
    if (!spine) return;

    // Purpose
    const purposeEl = document.getElementById('spine-purpose');
    if (purposeEl) purposeEl.textContent = spine.purpose;

    // Objectives
    const objList = document.getElementById('spine-objectives-list');
    if (objList) {
        objList.innerHTML = spine.objectives.map((o, idx) => `
            <li id="spine-obj-li-${o.id}" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.03); padding:0.4rem 0.8rem; border-radius:4px; gap:1rem;">
                <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                    <span style="color:var(--energy-alert);">🎯</span> 
                    <span class="obj-text">${o.text}</span>
                </div>
                <div class="spine-edit-btn" style="display:${isSpineEditMode ? 'flex' : 'none'}; gap:0.25rem; align-items:center;">
                    <button onclick="window.enableObjectiveInlineEdit('${o.id}')" style="background:none; border:none; cursor:pointer; color:var(--text-secondary);"><span class="material-symbols-outlined" style="font-size:1.1rem;">edit</span></button>
                    <button onclick="window.moveObjective('${o.id}', -1)" style="background:none; border:none; cursor:pointer; color:var(--text-secondary); opacity:${idx === 0 ? '0.2' : '1'};" ${idx === 0 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_upward</span></button>
                    <button onclick="window.moveObjective('${o.id}', 1)" style="background:none; border:none; cursor:pointer; color:var(--text-secondary); opacity:${idx === spine.objectives.length - 1 ? '0.2' : '1'};" ${idx === spine.objectives.length - 1 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_downward</span></button>
                    <button onclick="deleteSpineItem('objective', '${o.id}')" style="background:none; border:none; cursor:pointer; color:var(--energy-alert); margin-left:0.5rem;"><span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span></button>
                </div>
            </li>
        `).join('');
    }

    // Narrative
    const coreEl = document.getElementById('spine-narrative-core');
    const simpleEl = document.getElementById('spine-narrative-simple');
    if (coreEl) coreEl.textContent = `"${spine.narrative.core}"`;
    if (simpleEl) simpleEl.innerHTML = `<strong>Simple:</strong> ${spine.narrative.simple}`;

    // Pillars
    const pGrid = document.getElementById('spine-pillars-grid');
    if (pGrid) {
        pGrid.innerHTML = spine.pillars.map(p => `
            <div class="card" style="position:relative;">
                <h4 style="margin-bottom:0.5rem;">${p.title}</h4>
                <div class="spine-edit-btn" style="display:${isSpineEditMode ? 'flex' : 'none'}; position:absolute; right:0.5rem; top:0.5rem; gap:0.25rem;">
                    <button onclick="openSpineModal('edit-pillar', '${p.id}')" style="background:none; border:none; cursor:pointer; color:var(--text-secondary);"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span></button>
                    <button onclick="deleteSpineItem('pillar', '${p.id}')" style="background:none; border:none; cursor:pointer; color:var(--energy-alert);"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">${p.message}</p>
                <ul style="font-size:0.85rem; padding-left:1.2rem; margin:0;">
                    ${p.proofPoints.map(pp => `<li style="font-size:inherit;">${pp}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }
}

window.openSpineModal = function(type, id = null) {
    const modal = document.getElementById('spine-modal');
    const title = document.getElementById('spine-modal-title');
    const body = document.getElementById('spine-modal-body');
    const saveBtn = document.getElementById('spine-modal-save');
    const spine = window.getData('spine');
    
    currentEditId = id;
    body.innerHTML = ''; // clear

    if (type === 'purpose') {
        title.textContent = 'Edit Comms Strategy Core';
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Comms Strategy Core Purpose</label>
            <textarea id="spine-input-purpose" style="width:100%; height:120px; resize:none; overflow-y:auto; padding:0.5rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${spine.purpose}</textarea>
        `;
        saveBtn.onclick = () => {
            spine.purpose = document.getElementById('spine-input-purpose').value;
            saveAndCloseSpine(spine, modal);
        };
    } else if (type === 'add-objective' || type === 'edit-objective') {
        // Obsolete modal block, objective creation/editing is now handled inline.
        modal.close();
        return;
    } else if (type === 'narrative') {
        title.textContent = 'Edit Core Narrative';
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Core Narrative</label>
            <textarea id="spine-input-ncore" style="width:100%; height:120px; resize:none; overflow-y:auto; margin-bottom:1rem; padding:0.5rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${spine.narrative.core}</textarea>
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Simple Translation</label>
            <textarea id="spine-input-nsimple" style="width:100%; height:120px; resize:none; overflow-y:auto; padding:0.5rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${spine.narrative.simple}</textarea>
        `;
        saveBtn.onclick = () => {
            spine.narrative.core = document.getElementById('spine-input-ncore').value;
            spine.narrative.simple = document.getElementById('spine-input-nsimple').value;
            saveAndCloseSpine(spine, modal);
        };
    } else if (type === 'add-pillar' || type === 'edit-pillar') {
        title.textContent = id ? 'Edit Pillar' : 'Add Pillar';
        const p = id ? spine.pillars.find(x => x.id === id) : {title: '', message: '', proofPoints: []};
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Pillar Title</label>
            <input type="text" id="spine-input-ptitle" value="${p.title}" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Pillar Message / Description</label>
            <textarea id="spine-input-pmsg" style="width:100%; height:80px; resize:none; overflow-y:auto; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${p.message}</textarea>
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Strategic Proof Points / Dot Points</label>
            <div id="spine-proof-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.5rem;">
                ${p.proofPoints.map(pp => `
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <span style="color:var(--text-secondary);">•</span>
                        <input type="text" class="spine-proof-input" value="${pp}" style="flex:1; padding:0.4rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
                        <button onclick="window.moveProofPointUp(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_upward</span></button>
                        <button onclick="window.moveProofPointDown(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_downward</span></button>
                        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer; margin-left:0.25rem;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
                    </div>
                `).join('')}
            </div>
            <button class="btn-secondary" onclick="window.addProofPointInput()" style="font-size:0.75rem; padding:0.2rem 0.6rem;">+ Add Point</button>
        `;
        saveBtn.onclick = () => {
            const titleVal = document.getElementById('spine-input-ptitle').value;
            const msgVal = document.getElementById('spine-input-pmsg').value;
            const proofs = Array.from(document.querySelectorAll('.spine-proof-input'))
                                .map(el => el.value)
                                .filter(x => x.trim() !== '');
            if (id) {
                const target = spine.pillars.find(x => x.id === id);
                target.title = titleVal;
                target.message = msgVal;
                target.proofPoints = proofs;
            } else {
                spine.pillars.push({ id: 'p'+Date.now(), title: titleVal, message: msgVal, proofPoints: proofs });
            }
            saveAndCloseSpine(spine, modal);
        };
    }

    modal.showModal();
};

window.addProofPointInput = function() {
    const container = document.getElementById('spine-proof-container');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
    div.innerHTML = `
        <span style="color:var(--text-secondary);">•</span>
        <input type="text" class="spine-proof-input" value="" style="flex:1; padding:0.4rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
        <button onclick="window.moveProofPointUp(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_upward</span></button>
        <button onclick="window.moveProofPointDown(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_downward</span></button>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer; margin-left:0.25rem;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
    `;
    container.appendChild(div);
};

window.saveAndCloseSpine = function(spine, modal) {
    window.updateData('spine', spine);
    refreshSpineUI();
    modal.close();
};

window.deleteSpineItem = function(type, id) {
    const pwd = prompt('Enter administrator password to perform deletion (hint: "abracadabra"):');
    if (pwd !== 'abracadabra') {
        alert('Invalid password. Deletion cancelled.');
        return;
    }

    const spine = window.getData('spine');
    if (type === 'objective') {
        spine.objectives = spine.objectives.filter(o => o.id !== id);
    } else if (type === 'pillar') {
        spine.pillars = spine.pillars.filter(p => p.id !== id);
    }
    window.updateData('spine', spine);
    refreshSpineUI();
};

window.moveProofPointUp = function(btn) {
    const row = btn.closest('div');
    if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
};

window.moveProofPointDown = function(btn) {
    const row = btn.closest('div');
    if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
};

window.saveObjectiveInline = function(id, val) {
    if(!val.trim()) return; // prevent empty
    const spine = window.getData('spine');
    const obj = spine.objectives.find(o => o.id === id);
    if (obj) {
        obj.text = val;
        window.updateData('spine', spine);
    }
    refreshSpineUI(); // re-render to text view
};

window.enableObjectiveInlineEdit = function(id) {
    const li = document.getElementById(`spine-obj-li-${id}`);
    if(!li) return;
    const oText = li.querySelector('.obj-text').innerText;
    li.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
            <span style="color:var(--energy-alert);">🎯</span> 
            <input type="text" id="spine-input-inline-${id}" value="${oText.replace(/"/g, '&quot;')}" style="flex:1; padding:0.4rem 0.6rem; background:var(--bg-app); border:1px solid var(--border-subtle); border-radius:4px; font-size:0.95rem; color:var(--text-primary);">
            <button class="btn-primary" onclick="window.saveObjectiveInline('${id}', document.getElementById('spine-input-inline-${id}').value)" style="font-size:0.75rem; padding:0.2rem 0.5rem;">Save</button>
            <button class="btn-secondary" onclick="refreshSpineUI()" style="font-size:0.75rem; padding:0.2rem 0.5rem;">Cancel</button>
        </div>
    `;
};

window.moveObjective = function(id, dir) {
    const spine = window.getData('spine');
    const idx = spine.objectives.findIndex(o => o.id === id);
    if (idx === -1) return;
    if (dir === -1 && idx > 0) {
        const temp = spine.objectives[idx];
        spine.objectives[idx] = spine.objectives[idx-1];
        spine.objectives[idx-1] = temp;
    } else if (dir === 1 && idx < spine.objectives.length - 1) {
        const temp = spine.objectives[idx];
        spine.objectives[idx] = spine.objectives[idx+1];
        spine.objectives[idx+1] = temp;
    }
    window.updateData('spine', spine);
    refreshSpineUI();
};

window.addObjectiveInline = function() {
    const spine = window.getData('spine');
    const newId = 'obj'+Date.now();
    spine.objectives.push({ id: newId, text: '' });
    window.updateData('spine', spine);
    refreshSpineUI();
    // After naturally rendering the blank text, immediately pop it into edit mode
    setTimeout(() => window.enableObjectiveInlineEdit(newId), 0);
};

// --- KNOWLEDGE BANK FUNCTIONS ---


function getKnowledgeBankTemplate() {
    return `
        <header style="display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; position: relative;">
            <h2>Knowledge Bank</h2>
            <button id="kb-edit-toggle" class="btn-secondary" style="position: absolute; right: 0; display:flex; align-items:center; gap:0.25rem;">
                <span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit
            </button>
        </header>

        <!-- Project Key Messages -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="color:var(--text-tertiary); margin:0;">Project key messages<br><span style="font-size:0.8rem; font-weight:normal;">Benefits:</span></h3>
            <button class="btn-primary kb-edit-btn" onclick="openKbModal('add-key-message')" style="display:none; font-size:0.75rem; padding: 0.2rem 0.5rem;">+ Add Message</button>
        </div>
        <div id="kb-key-messages-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom:3rem;">
            <!-- Loaded by JS -->
        </div>

        <!-- FAQs -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="color:var(--text-tertiary); margin:0;">FAQs</h3>
            <button class="btn-primary kb-edit-btn" onclick="openKbModal('add-faq')" style="display:none; font-size:0.75rem; padding: 0.2rem 0.5rem;">+ Add FAQ</button>
        </div>
        <div id="kb-faqs-grid" style="display:grid; grid-template-columns: 1fr; gap:1rem; margin-bottom:3rem;">
            <!-- Loaded by JS -->
        </div>

        <!-- Audience Messages -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 style="color:var(--text-tertiary); margin:0;">Key Audience Specific Messages</h3>
            <button class="btn-primary kb-edit-btn" onclick="openKbModal('add-audience')" style="display:none; font-size:0.75rem; padding: 0.2rem 0.5rem;">+ Add Audience</button>
        </div>
        <div id="kb-audiences-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom:3rem;">
            <!-- Loaded by JS -->
        </div>

        <!-- KB Modal -->
        <dialog id="kb-modal" onmousedown="if(event.target===this)this.close()" style="border:1px solid var(--border-subtle); border-radius:8px; padding:1.5rem; width:500px; max-width:90vw; background:var(--bg-surface); color:var(--text-primary); box-shadow:0 10px 30px rgba(0,0,0,0.3); margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; cursor:move;" id="kb-modal-header">
                <h3 id="kb-modal-title">Edit</h3>
                <button onclick="document.getElementById('kb-modal').close()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div id="kb-modal-body" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- dynamic inputs -->
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button class="btn-secondary" onclick="document.getElementById('kb-modal').close()">Cancel</button>
                <button class="btn-primary" id="kb-modal-save">Save</button>
            </div>
        </dialog>
    `;
}

let isKbEditMode = false;

function renderKnowledgeBank() {
    isKbEditMode = false;
    refreshKbUI();

    const editToggle = document.getElementById('kb-edit-toggle');
    if (editToggle) {
        editToggle.addEventListener('click', () => {
            isKbEditMode = !isKbEditMode;
            editToggle.style.background = isKbEditMode ? 'var(--energy-algae)' : '';
            editToggle.style.color = isKbEditMode ? '#000' : '';
            editToggle.innerHTML = isKbEditMode 
                ? '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done'
                : '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            refreshKbUI(); 
        });
    }

    // Modal drag logic
    const modal = document.getElementById('kb-modal');
    const header = document.getElementById('kb-modal-header');
    if(modal && header) {
        let isDragging = false, startX, startY, initialX, initialY;
        header.addEventListener('mousedown', e => {
            if(e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const style = window.getComputedStyle(modal);
            const matrix = new DOMMatrixReadOnly(style.transform !== 'none' ? style.transform : 'matrix(1,0,0,1,0,0)');
            initialX = matrix.m41; initialY = matrix.m42;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        function onMouseMove(e) {
            if(!isDragging) return;
            const dx = e.clientX - startX; const dy = e.clientY - startY;
            modal.style.transform = `translate(${initialX + dx}px, ${initialY + dy}px)`;
        }
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
}

window.toggleKbAccordion = function(id) {
    if (isKbEditMode) return; // Disable expanding while in edit mode (usually click edits instead)
    const el = document.getElementById('kb-accordion-'+id);
    const content = document.getElementById('kb-content-'+id);
    const icon = document.getElementById('kb-icon-'+id);
    if(content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
        el.style.background = 'var(--bg-app)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        el.style.background = 'transparent';
    }
};

window.toggleKbFaq = function(id) {
    if (isKbEditMode) return;
    const el = document.getElementById('kb-faq-'+id);
    const content = document.getElementById('kb-faq-content-'+id);
    const icon = document.getElementById('kb-faq-icon-'+id);
    if(content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
        el.style.fontWeight = '600';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        el.style.fontWeight = '500';
    }
};

function refreshKbUI() {
    const kb = window.getData('knowledgeBank');
    if (!kb) return;

    // Toggle global edit buttons
    const btns = document.querySelectorAll('.kb-edit-btn');
    btns.forEach(btn => btn.style.display = isKbEditMode ? 'flex' : 'none');

    // 1. Key Messages
    const keyMsgGrid = document.getElementById('kb-key-messages-grid');
    if (keyMsgGrid) {
        keyMsgGrid.innerHTML = kb.keyMessages.map(km => `
            <div class="card" style="position:relative; background:var(--bg-surface); padding:1.5rem; display:flex; flex-direction:column; justify-content:flex-start; border:1px solid var(--border-subtle); border-radius:12px;">
                <!-- Edit button mask -->
                ${isKbEditMode ? `<button onclick="openKbModal('edit-key-message', '${km.id}')" style="position:absolute; right:1rem; top:1rem; background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">edit</span></button>` : ''}
                
                <h4 style="margin:0 0 0.5rem 0; font-size:1.1rem; color:var(--text-primary);">${km.title}</h4>
                <p style="font-size:0.85rem; color:var(--text-tertiary); margin:0 0 0.5rem 0;">Key Message</p>
                <p style="font-size:0.95rem; color:var(--text-secondary); margin:0 0 1.5rem 0;">${km.message}</p>
                
                <div id="kb-accordion-${km.id}" style="border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem; cursor:${isKbEditMode ? 'default' : 'pointer'}; transition:all 0.2s; background:${isKbEditMode ? 'var(--bg-app)' : 'transparent'};" onclick="window.toggleKbAccordion('${km.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.9rem; font-weight:500;">Proof Points</span>
                        <span id="kb-icon-${km.id}" class="material-symbols-outlined" style="font-size:1.2rem; transition:transform 0.2s; transform:${isKbEditMode ? 'rotate(90deg)' : 'rotate(0deg)'};">arrow_right</span>
                    </div>
                    <div id="kb-content-${km.id}" class="accordion-content" style="display:${isKbEditMode ? 'block' : 'none'}; margin-top:1rem;">
                        <ul style="padding-left:1.5rem; margin:0; font-size:0.85rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.5rem;">
                            ${km.proofPoints.map(pp => `<li>${pp}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 2. FAQs
    const faqsGrid = document.getElementById('kb-faqs-grid');
    if (faqsGrid) {
        faqsGrid.innerHTML = kb.faqs.map(f => `
            <div class="card" style="position:relative; background:var(--bg-surface); outline:1px solid var(--border-subtle); border-radius:12px; overflow:hidden;">
                ${isKbEditMode ? `<button onclick="openKbModal('edit-faq', '${f.id}')" style="position:absolute; right:1rem; top:1rem; z-index:10; background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">edit</span></button>` : ''}
                
                <div id="kb-faq-${f.id}" style="padding:0.75rem 1.5rem; cursor:${isKbEditMode ? 'default' : 'pointer'}; display:flex; justify-content:space-between; align-items:center; font-weight:500; font-size:0.95rem; ${isKbEditMode ? 'border-bottom:1px solid var(--border-subtle);' : ''}" onclick="window.toggleKbFaq('${f.id}')">
                    <span style="padding-right:2rem;">${f.question}</span>
                    <span id="kb-faq-icon-${f.id}" class="material-symbols-outlined" style="font-size:1.5rem; transition:transform 0.2s; transform:${isKbEditMode ? 'rotate(90deg)' : 'rotate(0deg)'};">arrow_right</span>
                </div>
                <div id="kb-faq-content-${f.id}" style="display:${isKbEditMode ? 'block' : 'none'}; padding: 0 1.5rem 1.5rem; border-top:1px solid var(--border-subtle); margin-top:${isKbEditMode ? '0' : '0'};">
                    <p style="margin-top:1rem; font-size:0.9rem; color:var(--text-secondary); line-height:1.5; white-space:pre-wrap;">${f.answer}</p>
                </div>
            </div>
        `).join('');
    }

    // 3. Audience Messages
    const audienceGrid = document.getElementById('kb-audiences-grid');
    if (audienceGrid) {
        audienceGrid.innerHTML = kb.audienceMessages.map(a => `
            <div class="card" style="position:relative; border:1px solid var(--border-subtle); border-radius:12px; padding:1.5rem; background:var(--bg-surface);">
                ${isKbEditMode ? `<button onclick="openKbModal('edit-audience', '${a.id}')" style="position:absolute; right:1rem; top:1rem; background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">edit</span></button>` : ''}
                
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; color:var(--text-primary); font-weight:600;">
                    <span class="material-symbols-outlined" style="color:var(--energy-algae);">${a.icon}</span> ${a.title}
                </div>
                <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${a.text}</p>
            </div>
        `).join('');
    }
}

window.openKbModal = function(type, id) {
    const kb = window.getData('knowledgeBank');
    if (!kb) return;

    const modal = document.getElementById('kb-modal');
    const title = document.getElementById('kb-modal-title');
    const body = document.getElementById('kb-modal-body');
    const saveBtn = document.getElementById('kb-modal-save');
    
    // reset position
    modal.style.transform = 'none';

    if (type === 'add-key-message' || type === 'edit-key-message') {
        title.textContent = id ? 'Edit Key Message' : 'Add Key Message';
        const msg = id ? kb.keyMessages.find(m => m.id === id) : { title: '', message: '', proofPoints: [] };
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Title (e.g. Environmental Outcomes)</label>
            <input type="text" id="kb-input-title" value="${msg.title.replace(/"/g, '&quot;')}" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Key Message Statement</label>
            <textarea id="kb-input-msg" style="width:100%; height:150px; resize:vertical; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${msg.message}</textarea>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <label style="font-size:0.8rem; font-weight:600;">Proof Points</label>
                <button type="button" class="btn-secondary" onclick="window.addKbListPoint()" style="font-size:0.7rem; padding:0.2rem 0.5rem;">+ Add Point</button>
            </div>
            <div id="kb-modal-points-container" style="display:flex; flex-direction:column; gap:0.5rem; max-height:200px; overflow-y:auto; padding-right:0.5rem;">
                ${msg.proofPoints.map(pp => `
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <span style="color:var(--text-secondary);">•</span>
                        <input type="text" class="kb-point-input" value="${pp.replace(/"/g, '&quot;')}" style="flex:1; padding:0.4rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
                        <button onclick="window.moveProofPointUp(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_upward</span></button>
                        <button onclick="window.moveProofPointDown(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_downward</span></button>
                        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer; margin-left:0.25rem;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
                    </div>
                `).join('')}
            </div>
            ${id ? `<button onclick="window.deleteKbItem('key-message', '${id}')" style="margin-top:1rem; width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239, 68, 68, 0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;" onmouseover="this.style.background='var(--energy-alert)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='var(--energy-alert)';">Delete Key Message Completely</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const points = Array.from(document.querySelectorAll('.kb-point-input')).map(input => input.value).filter(v => v.trim() !== '');
            const newObj = {
                id: id || 'k' + Date.now(),
                title: document.getElementById('kb-input-title').value,
                message: document.getElementById('kb-input-msg').value,
                proofPoints: points
            };
            if (id) {
                const idx = kb.keyMessages.findIndex(m => m.id === id);
                kb.keyMessages[idx] = newObj;
            } else {
                kb.keyMessages.push(newObj);
            }
            window.updateData('knowledgeBank', kb);
            refreshKbUI();
            modal.close();
        };
    } else if (type === 'add-faq' || type === 'edit-faq') {
        title.textContent = id ? 'Edit FAQ' : 'Add FAQ';
        const faq = id ? kb.faqs.find(f => f.id === id) : { question: '', answer: '' };
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Question</label>
            <input type="text" id="kb-input-q" value="${faq.question.replace(/"/g, '&quot;')}" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Answer</label>
            <textarea id="kb-input-a" style="width:100%; height:150px; resize:none; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${faq.answer}</textarea>
            
            ${id ? `<button onclick="window.deleteKbItem('faq', '${id}')" style="margin-top:0.5rem; width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239, 68, 68, 0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;" onmouseover="this.style.background='var(--energy-alert)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='var(--energy-alert)';">Delete FAQ</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const newObj = {
                id: id || 'f' + Date.now(),
                question: document.getElementById('kb-input-q').value,
                answer: document.getElementById('kb-input-a').value
            };
            if (id) {
                const idx = kb.faqs.findIndex(f => f.id === id);
                kb.faqs[idx] = newObj;
            } else {
                kb.faqs.push(newObj);
            }
            window.updateData('knowledgeBank', kb);
            refreshKbUI();
            modal.close();
        };
    } else if (type === 'add-audience' || type === 'edit-audience') {
        title.textContent = id ? 'Edit Audience Message' : 'Add Audience Message';
        const aud = id ? kb.audienceMessages.find(a => a.id === id) : { title: '', text: '', icon: 'groups' };
        const stakeholders = window.getData('stakeholders') || [];
        const stakeholderOptions = stakeholders.map(s => `<option value="${s.name.replace(/"/g, '&quot;')}" ${aud.title === s.name ? 'selected' : ''}>${s.name}</option>`).join('');
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Audience Type (Stakeholder)</label>
            <select id="kb-input-aud" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
                <option value="">-- Select a Stakeholder --</option>
                ${stakeholderOptions}
            </select>
            
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Tailored Message</label>
            <textarea id="kb-input-txt" style="width:100%; height:180px; resize:vertical; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${aud.text}</textarea>
            
            ${id ? `<button onclick="window.deleteKbItem('audience', '${id}')" style="margin-top:0.5rem; width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239, 68, 68, 0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;" onmouseover="this.style.background='var(--energy-alert)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='var(--energy-alert)';">Delete Audience</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const newObj = {
                id: id || 'a' + Date.now(),
                icon: 'groups', // fixed icon for now
                title: document.getElementById('kb-input-aud').value,
                text: document.getElementById('kb-input-txt').value
            };
            if (id) {
                const idx = kb.audienceMessages.findIndex(a => a.id === id);
                kb.audienceMessages[idx] = newObj;
            } else {
                kb.audienceMessages.push(newObj);
            }
            window.updateData('knowledgeBank', kb);
            refreshKbUI();
            modal.close();
        };
    }
    
    modal.showModal();
}

window.addKbListPoint = function() {
    const container = document.getElementById('kb-modal-points-container');
    const div = document.createElement('div');
    div.style.cssText = "display:flex; gap:0.5rem; align-items:center;";
    div.innerHTML = `
        <span style="color:var(--text-secondary);">•</span>
        <input type="text" class="kb-point-input" value="" style="flex:1; padding:0.4rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
        <button onclick="window.moveProofPointUp(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_upward</span></button>
        <button onclick="window.moveProofPointDown(this)" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">arrow_downward</span></button>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer; margin-left:0.25rem;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
    `;
    container.appendChild(div);
};

window.deleteKbItem = function(type, id) {
    const pwd = prompt('Enter administrator password to perform deletion (hint: "abracadabra"):');
    if (pwd !== 'abracadabra') {
        alert('Invalid password. Deletion cancelled.');
        return;
    }
    const kb = window.getData('knowledgeBank');
    if (type === 'key-message') {
        kb.keyMessages = kb.keyMessages.filter(o => o.id !== id);
    } else if (type === 'faq') {
        kb.faqs = kb.faqs.filter(o => o.id !== id);
    } else if (type === 'audience') {
        kb.audienceMessages = kb.audienceMessages.filter(o => o.id !== id);
    }
    window.updateData('knowledgeBank', kb);
    refreshKbUI();
    document.getElementById('kb-modal').close();
};

// Forward global wheel events to the main view container when hovering in dead zones
window.addEventListener('wheel', (e) => {
    const vc = document.getElementById('view-container');
    if (vc && !vc.contains(e.target)) {
        const nav = document.getElementById('nav-links-container');
        // If hovering over the sidebar nav and it actually has overflow, let it scroll natively
        if (nav && nav.contains(e.target) && nav.scrollHeight > nav.clientHeight) {
            return; 
        }
        // Otherwise, forward the scroll to the main view
        vc.scrollTop += e.deltaY;
    }
}, { passive: true });
