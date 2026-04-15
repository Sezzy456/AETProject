// ============================================================
//  AET Portal — app.js
//  Architecture: portal.html is the single shell.
//  Each view is a real HTML file in /pages/ loaded via fetch().
// ============================================================

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLayout();
    initNavigation();

    // Burger menu for mobile sidebar
    const burgerBtn = document.getElementById('burger-menu');
    const sidebar = document.getElementById('sidebar');
    if (burgerBtn && sidebar) {
        burgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Login form handler (login.html)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = 'portal.html';
        });
    }

    // If we are on the portal (view-container exists), load the right view
    const viewContainer = document.getElementById('view-container');
    if (viewContainer) {
        // Check if there's a hash-based route e.g. portal.html#actions
        const hash = window.location.hash.replace('#', '');
        loadView(hash || 'dashboard');
    }
});

// ---- THEME ----

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('theme-toggle');
    if (savedTheme === 'bio') {
        document.body.classList.add('bio-mode');
        if (toggle) toggle.checked = true;
    }
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('bio-mode');
                localStorage.setItem('theme', 'bio');
            } else {
                document.body.classList.remove('bio-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// ---- LAYOUT ----

function initLayout() {
    const wrapper = document.getElementById('app-container');
    const toggle = document.getElementById('width-toggle');
    const savedWidth = localStorage.getItem('pageWidth');
    if (wrapper && savedWidth === 'wide') {
        wrapper.classList.add('wide-view');
        if (toggle) toggle.checked = true;
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

// ---- NAVIGATION ----

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            if (view) {
                loadView(view);
                // Update active state
                navItems.forEach(n => n.classList.remove('active'));
                link.classList.add('active');
                // Update URL hash (no page reload)
                history.pushState(null, '', '#' + view);
                // Close mobile sidebar
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            }
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            loadView(hash, false); // false = don't push state again
        }
    });
}

// ---- VIEW LOADER (fetch-based) ----

// Maps view names to their page fragment files
const VIEW_FILES = {
    'dashboard':          'pages/dashboard.html',
    'stakeholders':       'pages/stakeholders.html',
    'stakeholder_detail': 'pages/stakeholder_detail.html',
    'activity_log':       'pages/activity_log.html',
    'actions':            'pages/actions.html',
    'strategy_spine':     'pages/strategy_spine.html',
    'knowledge_bank':     'pages/knowledge_bank.html',
};

// Maps view names to their post-load render functions
const VIEW_RENDERERS = {
    'dashboard':          renderDashboard,
    'stakeholders':       renderStakeholders,
    'stakeholder_detail': renderStakeholderDetail,
    'activity_log':       renderActivityLog,
    'actions':            renderActions,
    'strategy_spine':     renderStrategySpine,
    'knowledge_bank':     renderKnowledgeBank,
};

function loadView(viewName, pushState = true) {
    const container = document.getElementById('view-container');
    if (!container) return;

    // Normalize view name
    if (viewName === 'index' || viewName === 'portal' || !viewName) viewName = 'dashboard';

    const filePath = VIEW_FILES[viewName];
    if (!filePath) {
        container.innerHTML = `<div style="padding:2rem;"><h2>404 – View Not Found</h2><p style="color:var(--text-tertiary);">The view "<strong>${viewName}</strong>" does not exist.</p></div>`;
        return;
    }

    // Show loading state
    container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-tertiary);">
        <span class="material-symbols-outlined" style="font-size:2rem; margin-right:0.5rem; animation: spin 1s linear infinite;">autorenew</span> Loading...
    </div>
    <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>`;

    fetch(filePath + '?v=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} – ${filePath}`);
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
            container.scrollTop = 0;
            window.scrollTo(0, 0);

            // Run the view's render function if one exists
            const renderer = VIEW_RENDERERS[viewName];
            if (typeof renderer === 'function') {
                renderer();
            }

            // Update nav active state to match current view
            const navItems = document.querySelectorAll('.nav-item[data-view]');
            navItems.forEach(n => {
                n.classList.toggle('active', n.getAttribute('data-view') === viewName);
            });
        })
        .catch(err => {
            console.error('loadView error:', err);
            container.innerHTML = `<div style="padding:2rem;">
                <h2 style="color:var(--energy-alert);">Failed to load page</h2>
                <p style="color:var(--text-secondary);">${err.message}</p>
                <button class="btn-secondary" onclick="loadView('dashboard')" style="margin-top:1rem;">← Back to Dashboard</button>
            </div>`;
        });
}

// ---- RENDER FUNCTIONS ----

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
                <span style="font-size:0.75rem; color:${i.type === 'Upcoming' ? 'var(--energy-alert)' : 'var(--text-tertiary)'}; font-weight:600; text-transform:uppercase;">${i.rawDate} - ${i.type}</span>
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

    // 5. Strategy Spine Preview
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
    if (!container) return;
    container.innerHTML = '';

    stakeholders.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'position:relative; cursor:pointer; border:1px solid var(--border-subtle); border-radius:12px; padding:1.5rem; background:var(--bg-surface); transition:all 0.2s;';

        card.onclick = () => {
            window.currentStakeholderId = s.id;
            loadView('stakeholder_detail');
            history.pushState(null, '', '#stakeholder_detail');
        };

        card.onmouseover = () => {
            card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            card.style.transform = 'translateY(-2px)';
            card.style.border = '1px solid var(--border-highlight)';
        };
        card.onmouseout = () => {
            card.style.boxShadow = 'none';
            card.style.transform = 'none';
            card.style.border = '1px solid var(--border-subtle)';
        };

        const owners = s.owner ? s.owner.split('+').map(o => o.trim()) : [];
        const ownersHtml = owners.map(o => `<span style="margin-left:0.5rem; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:1rem; color:var(--text-tertiary);">person</span>${o}</span>`).join('');

        let statusColor = 'var(--text-secondary)', statusBg = 'rgba(0,0,0,0.05)';
        if (s.status === 'Needs Attention') { statusColor = 'var(--energy-alert)'; statusBg = 'rgba(239, 68, 68, 0.2)'; }
        else if (s.status === 'Monitor') { statusColor = 'var(--energy-mid)'; statusBg = 'rgba(245, 158, 11, 0.2)'; }
        else if (s.status === 'Active') { statusBg = 'rgba(0,0,0,0.1)'; }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                <h3 style="margin:0; font-size:1.2rem; color:var(--text-primary);">${s.name}</h3>
                <div style="font-size:0.85rem; color:var(--text-secondary);">${ownersHtml}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span style="color:var(--text-tertiary); width:60px; text-align:right;">Status:</span>
                    <span style="background:${statusBg}; color:${statusColor}; padding:0.1rem 0.5rem; border-radius:4px; font-weight:600; font-size:0.8rem;">${s.status}</span>
                </div>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span style="color:var(--text-tertiary); width:60px; text-align:right;">Role:</span>
                    <span style="color:#3b82f6;">${s.role}</span>
                </div>
                <div style="display:flex; gap:1rem;">
                    <span style="color:var(--text-tertiary); width:60px; text-align:right;">Strategy:</span>
                    <span style="font-style:italic; color:var(--text-secondary); flex:1;">"${s.narrativeHook || ''}"</span>
                </div>
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

    const setTxt = (elId, value) => { const el = document.getElementById(elId); if (el) el.textContent = value || '-'; };
    const setHtml = (elId, value) => { const el = document.getElementById(elId); if (el) el.innerHTML = value || '-'; };

    setTxt('view-breadcrumb-name', s.name);
    setTxt('detail-name', s.name);
    setTxt('view-role', s.role);
    setTxt('view-narrativeHook', `"${s.narrativeHook || ''}"`);

    // Status Badge
    const stBadge = document.getElementById('view-status-badge');
    if (stBadge) {
        stBadge.textContent = s.status || '-';
        let bg = 'rgba(0,0,0,0.1)', color = 'var(--text-secondary)';
        switch (s.status) {
            case 'Critical/At Risk': bg = 'rgba(239, 68, 68, 0.2)'; color = '#ef4444'; break;
            case 'Strained': bg = 'rgba(249, 115, 22, 0.2)'; color = '#f97316'; break;
            case 'Friction Points': bg = 'rgba(234, 179, 8, 0.2)'; color = '#eab308'; break;
            case 'Operational': bg = 'rgba(34, 197, 94, 0.2)'; color = '#22c55e'; break;
            case 'Stable': bg = 'rgba(163, 230, 53, 0.2)'; color = '#065f46'; break;
            case 'Dormant': bg = 'rgba(229, 231, 235, 1)'; color = '#6b7280'; break;
        }
        stBadge.style.background = bg;
        stBadge.style.color = color;

        const currentStatusEl = document.getElementById('view-current-status-text');
        if (currentStatusEl) currentStatusEl.textContent = s.status;

        const segments = document.querySelectorAll('#view-status-selector .seg-block');
        segments.forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-status') === s.status);
        });
    }

    // Values Chips
    const vC = document.getElementById('view-values-container');
    if (vC) {
        if (s.values && s.values.length > 0) {
            vC.innerHTML = s.values.map(v => `<span style="border:1px solid #3b82f6; color:#3b82f6; border-radius:100px; padding:0.2rem 0.6rem; font-size:0.75rem;">${v}</span>`).join('');
        } else {
            vC.innerHTML = '-';
        }
    }

    // Power Dynamics
    if (s.powerDynamics) {
        setTxt('view-influence-label', s.powerDynamics.influence);
        setTxt('view-interest-label', s.powerDynamics.interest);

        const inf = (s.powerDynamics.influence || '').toLowerCase();
        const int_ = (s.powerDynamics.interest || '').toLowerCase();
        let verbStr = 'MONITOR';
        if (inf === 'high' && int_ === 'high') verbStr = 'ENGAGE';
        else if (inf === 'high' && int_ === 'low') verbStr = 'SATISFY';
        else if (inf === 'low' && int_ === 'high') verbStr = 'INFORM';

        const vBadge = document.getElementById('view-matrix-verb');
        if (vBadge) vBadge.textContent = verbStr;

        const getPct = (str) => str.toLowerCase() === 'high' ? '100%' : str.toLowerCase() === 'medium' ? '50%' : '15%';
        const infBar = document.getElementById('view-influence-bar');
        const intBar = document.getElementById('view-interest-bar');
        if (infBar) infBar.style.width = getPct(s.powerDynamics.influence || '');
        if (intBar) intBar.style.width = getPct(s.powerDynamics.interest || '');

        setTxt('view-authority', s.powerDynamics.authority);

        const pvC = document.getElementById('view-power-values-container');
        if (pvC && s.powerDynamics.values) {
            pvC.innerHTML = s.powerDynamics.values.map(v => `<span style="background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-secondary); border-radius:4px; padding:0.2rem 0.5rem; font-size:0.75rem;">${v}</span>`).join('');
        }
    }

    // Posture Journey
    if (s.postureJourney) {
        setTxt('view-posture-current', s.postureJourney.current);
        setTxt('view-posture-desired', s.postureJourney.desired);
        setTxt('view-posture-next', s.postureJourney.nextStep);
        setTxt('view-posture-target', s.postureJourney.target);
    }

    // Status History
    const hl = document.getElementById('view-status-history-lines');
    if (hl && s.statusHistory && s.statusHistory.length > 0) {
        hl.innerHTML = '';
        const statusY = {
            'Operational': '8%', 'Stable': '25%', 'Dormant': '41%',
            'Friction Points': '58%', 'Strained': '75%', 'Critical/At Risk': '91%'
        };
        const len = s.statusHistory.length;
        let svgLines = '', dotsHtml = '';

        s.statusHistory.forEach((sh, i) => {
            const y = statusY[sh.status] || '50%';
            const x = len === 1 ? 50 : 10 + (70 / (len - 1)) * i;
            if (i > 0) {
                const prevY = statusY[s.statusHistory[i - 1].status] || '50%';
                const prevX = 10 + (70 / (len - 1)) * (i - 1);
                svgLines += `<line x1="${prevX}%" y1="${prevY}" x2="${x}%" y2="${y}" stroke="#60a5fa" stroke-width="3" />`;
            }

            dotsHtml += `<div style="position:absolute; left:${x}%; bottom:-25px; transform:translateX(-50%); font-size:0.7rem; color:var(--text-secondary); font-weight:600; white-space:nowrap;">${sh.date}</div>`;

            const isLast = i === len - 1;
            if (isLast) {
                dotsHtml += `
                    <div style="position:absolute; left:${x}%; top:0; height:100%; width:16px; transform:translateX(-50%); display:flex; flex-direction:column; border-radius:100px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.2); border:2px solid #fff; z-index:4; background:#e5e7eb;">
                        <div style="flex:1; cursor:pointer; position:relative; background:#22c55e;" onclick="updateDetailStatus('Operational')" title="Operational">${sh.status === 'Operational' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#a3e635;" onclick="updateDetailStatus('Stable')" title="Stable">${sh.status === 'Stable' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#f9fafb;" onclick="updateDetailStatus('Dormant')" title="Dormant">${sh.status === 'Dormant' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#eab308;" onclick="updateDetailStatus('Friction Points')" title="Friction Points">${sh.status === 'Friction Points' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#f97316;" onclick="updateDetailStatus('Strained')" title="Strained">${sh.status === 'Strained' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#ef4444;" onclick="updateDetailStatus('Critical/At Risk')" title="Critical/At Risk">${sh.status === 'Critical/At Risk' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}</div>
                    </div>
                    <div style="position:absolute; left:${x}%; top:${y}; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; border:2px solid #22c55e; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite; z-index:3; pointer-events:none;"></div>
                    <style>@keyframes ping{75%,100%{transform:scale(1.5);opacity:0;}}</style>
                `;
            } else {
                dotsHtml += `
                    <div class="custom-tooltip" style="position:absolute; left:${x}%; top:${y}; transform:translate(-50%, -50%);">
                       <div style="width:16px; height:16px; border-radius:50%; background:#1e3a8a; border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,0.3); z-index:2;"></div>
                       <div class="custom-tooltip-content" style="top:100%; margin-top:12px; width:220px; z-index:9999;">
                           <div style="font-size:0.75rem; color:var(--text-tertiary); font-family:'JetBrains Mono'; margin-bottom:0.1rem;">${sh.date}</div>
                           <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.25rem;">${sh.status}</div>
                           <div style="font-size:0.8rem; color:var(--text-secondary); max-width:260px; line-height:1.3; white-space:normal;">${sh.notes || ''}</div>
                       </div>
                    </div>
                `;
            }
        });

        hl.innerHTML = `
            <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;" preserveAspectRatio="none">
                ${svgLines}
            </svg>
            ${dotsHtml}
            <div style="position:absolute; left:92%; top:0; bottom:0; width:1px; background:#22c55e; opacity:0.8; z-index:1;"></div>
            <div style="position:absolute; left:92%; top:8%; transform:translate(-50%, -50%); background:#22c55e; color:#fff; padding:2px 10px; border-radius:100px; font-size:0.7rem; font-weight:bold; z-index:2; box-shadow:0 2px 4px rgba(34,197,94,0.3);">Desired</div>
        `;
    } else if (hl) {
        hl.innerHTML = '<div style="color:var(--text-tertiary); font-style:italic; padding-left:1rem; padding-top:1rem; font-size:0.9rem;">No historical status records found.</div>';
    }

    // Strategic Approach
    if (s.strategicApproach) {
        setTxt('view-barriers', `"${s.strategicApproach.barriers || ''}"`);
        setHtml('view-engagement-approach', s.strategicApproach.engagementApproach);
        const tacC = document.getElementById('view-tactics');
        if (tacC && s.strategicApproach.tactics) {
            tacC.innerHTML = s.strategicApproach.tactics.map(t => `<div style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-app); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:4px;">
                <span style="background:#3b82f6; color:white; font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; text-transform:uppercase; font-weight:bold;">${t.type}</span>
                <span style="font-size:0.85rem;">${t.text}</span>
            </div>`).join('');
        }
    }

    // Contact Conduct
    if (s.contactConduct) {
        setTxt('view-contact-pref', s.contactConduct.preferences);
        setTxt('view-contact-tone', s.contactConduct.emailTone);
        setTxt('view-contact-pitch', s.contactConduct.elevatorPitches);
    }

    // Contacts
    const cList = document.getElementById('view-contacts-list');
    if (cList) {
        if (s.contacts && s.contacts.length > 0) {
            cList.innerHTML = s.contacts.map(c => `
                <div class="card" style="display:flex; justify-content:space-between; align-items:flex-start; padding:1rem; border:1px solid var(--border-subtle); border-radius:8px; background:var(--bg-app); cursor:pointer;">
                    <div>
                        <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">${c.name} ${c.isLead ? '<span style="background:rgba(245, 158, 11, 0.2); color:var(--energy-mid); font-size:0.7rem; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.5rem;">PRIMARY CONTACT</span>' : ''}</div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">${c.role || 'Role N/A'}</div>
                        <div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.8rem; color:var(--text-tertiary);">
                            ${c.email ? `<span style="display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:1rem;">mail</span> ${c.email}</span>` : ''}
                            ${c.phone ? `<span style="display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:1rem;">phone</span> ${c.phone}</span>` : ''}
                        </div>
                    </div>
                    <button style="background:none; border:none; cursor:pointer; color:var(--text-tertiary);"><span class="material-symbols-outlined">more_vert</span></button>
                </div>
            `).join('');
        } else {
            cList.innerHTML = '<span style="color:var(--text-tertiary); font-style:italic;">No contacts recorded.</span>';
        }
    }

    // Relationships
    if (s.relationships) {
        setTxt('view-rel-internal', s.relationships.internalLink);
        setTxt('view-rel-external', s.relationships.externalTension);
        const ties = document.getElementById('view-rel-ties');
        if (ties) ties.innerHTML = (s.relationships.keyTies || []).map(t => `<li>${t}</li>`).join('') || '-';
        const friction = document.getElementById('view-rel-friction');
        if (friction) friction.innerHTML = (s.relationships.frictionPoints || []).map(t => `<li>${t}</li>`).join('') || '-';
    }

    // Audience Message from KB
    const kb = window.getData('knowledgeBank');
    if (kb && kb.audienceMessages) {
        const audMsg = kb.audienceMessages.find(a => a.title === s.name);
        if (audMsg) {
            setTxt('view-kb-audience-title', audMsg.title);
            setTxt('view-kb-audience-text', audMsg.text);
        } else {
            setTxt('view-kb-audience-title', 'Specific Audience Messages');
            setTxt('view-kb-audience-text', '(No tailored message in Knowledge Bank mapping to this stakeholder.)');
        }
    }

    // Linked Actions
    const actContainer = document.getElementById('stakeholder-actions-container');
    if (actContainer) {
        const allActions = window.getData('actions') || [];
        const shActions = allActions.filter(a => a.linkType === 'Stakeholder' && a.linkId === s.id);
        actContainer.innerHTML = shActions.length === 0
            ? '<span style="color:var(--text-tertiary); font-style:italic; font-size:0.9rem;">No linked actions.</span>'
            : shActions.map(a => `<div class="card" style="padding:1rem; border:1px solid var(--border-subtle); border-radius:8px; background:var(--bg-app); display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                <div>
                    <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">${a.activity}</div>
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Owner: ${a.owner || '-'} | Due: ${a.dueDate || '-'}</span>
                </div>
                <div><span class="status-badge" style="border-color:#3b82f6; color:#3b82f6; padding:0.1rem 0.5rem; font-size:0.75rem;">${a.status}</span></div>
             </div>`).join('');
    }

    // Linked Interactions
    const intContainer = document.getElementById('stakeholder-interactions-container');
    if (intContainer) {
        const allLogs = window.getData('activityLog') || [];
        const shLogs = allLogs.filter(l => (l.attendees && l.attendees.includes(s.name)) || l.title.includes(s.name));
        intContainer.innerHTML = shLogs.length === 0
            ? '<span style="color:var(--text-tertiary); font-style:italic; font-size:0.9rem;">No recent interactions.</span>'
            : shLogs.map(l => `<div class="card" style="padding:1rem; border:1px solid var(--border-subtle); border-radius:8px; background:var(--bg-app); cursor:pointer;">
                <div style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:0.25rem;">${l.date}</div>
                <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">${l.title}</div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">${l.notes}</div>
             </div>`).join('');
    }
}

// Update status from stakeholder detail
window.updateDetailStatus = function (newStatus) {
    const id = window.currentStakeholderId;
    if (!id) return;
    const stakeholders = window.getData('stakeholders');
    const s = stakeholders.find(item => item.id == id);
    if (!s) return;
    const history = s.statusHistory || [];
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    history.push({ date: dateStr, status: newStatus, notes: 'Status manually updated in portal.' });
    window.updateStakeholder(id, { status: newStatus, statusHistory: history });
    renderStakeholderDetail();
};

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
                <div style="font-size:0.85rem; color:var(--text-tertiary);">${a.attendees}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ---- ACTIONS ----

let _actCurrentTab = 'list';
let _actCurrentId = null;
let _actOriginalData = null;
let _actSortMode = 'due'; // 'due' | 'status' | 'owner'
let _actFilterOpen = false;

function renderActions() {
    _actCurrentTab = 'list';
    _actCurrentId = null;
    _actPopulateObjectiveDropdown();
    window.filterActions();
}

// Helper: resolve objective text from id
function _actGetObjectiveText(id) {
    const spine = window.getData('spine');
    if (!spine) return id;
    const obj = (spine.objectives || []).find(o => o.id === id);
    return obj ? obj.text : id;
}

// Helper: get status color
function _actStatusColor(status) {
    const map = {
        'Pending':     { bg:'rgba(148,163,184,0.15)', color:'#64748b', dot:'#94a3b8' },
        'Planned':     { bg:'rgba(129,140,248,0.15)', color:'#6366f1', dot:'#818cf8' },
        'In Progress': { bg:'rgba(96,165,250,0.15)',  color:'#3b82f6', dot:'#60a5fa' },
        'Completed':   { bg:'rgba(52,211,153,0.15)',  color:'#059669', dot:'#34d399' },
    };
    return map[status] || { bg:'rgba(0,0,0,0.05)', color:'var(--text-secondary)', dot:'#aaa' };
}

// Populate objective <select> in modal
function _actPopulateObjectiveDropdown() {
    const sel = document.getElementById('act-f-objective');
    if (!sel) return;
    const spine = window.getData('spine');
    sel.innerHTML = '<option value="">— Select Objective —</option>';
    if (spine && spine.objectives) {
        spine.objectives.forEach(o => {
            sel.innerHTML += `<option value="${o.id}">🎯 ${o.text.length > 50 ? o.text.substring(0,47)+'...' : o.text}</option>`;
        });
    }
}

// Filter + re-render
window.filterActions = function() {
    const search = (document.getElementById('act-search')?.value || '').toLowerCase();
    const statusF = document.getElementById('act-filter-status')?.value || '';
    const ownerF  = document.getElementById('act-filter-owner')?.value  || '';
    const phaseF  = document.getElementById('act-filter-phase')?.value  || '';

    let actions = window.getData('actions') || [];
    if (search)  actions = actions.filter(a => (a.activity||'').toLowerCase().includes(search) || (a.description||'').toLowerCase().includes(search));
    if (statusF) actions = actions.filter(a => a.status === statusF);
    if (ownerF)  actions = actions.filter(a => (a.owner||'').includes(ownerF));
    if (phaseF)  actions = actions.filter(a => a.phase === phaseF);

    // Sort
    if (_actSortMode === 'due') {
        actions.sort((a,b) => (a.timing?.dueDate || '9999') < (b.timing?.dueDate || '9999') ? -1 : 1);
    } else if (_actSortMode === 'status') {
        const order = ['In Progress','Planned','Pending','Completed'];
        actions.sort((a,b) => order.indexOf(a.status) - order.indexOf(b.status));
    } else if (_actSortMode === 'owner') {
        actions.sort((a,b) => (a.owner||'').localeCompare(b.owner||''));
    }

    const sortLabel = document.getElementById('act-sort-label');
    if (sortLabel) {
        const sortNames = { due:'Due Date ↑', status:'Status', owner:'Owner A–Z' };
        sortLabel.textContent = sortNames[_actSortMode] || '';
    }

    _actRenderList(actions);
    _actRenderKanban(actions);
    _actRenderGantt(actions);
};

window.cycleActionsSort = function() {
    const modes = ['due','status','owner'];
    _actSortMode = modes[(modes.indexOf(_actSortMode)+1) % modes.length];
    window.filterActions();
};

window.toggleActionsFilter = function() {
    _actFilterOpen = !_actFilterOpen;
    const panel = document.getElementById('act-filter-panel');
    if (panel) panel.style.display = _actFilterOpen ? 'flex' : 'none';
};

window.clearActionsFilters = function() {
    ['act-filter-status','act-filter-owner','act-filter-phase'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    window.filterActions();
};

window.switchActionsTab = function(tab, btn) {
    _actCurrentTab = tab;
    ['list','kanban','gantt'].forEach(t => {
        const v = document.getElementById('act-view-'+t);
        if (v) v.style.display = t === tab ? 'block' : 'none';
        if (t === 'gantt' && tab === 'gantt') v.style.display = 'block';
    });
    document.querySelectorAll('.act-tab').forEach(b => {
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--text-tertiary)';
    });
    if (btn) {
        btn.style.borderBottomColor = 'var(--energy-algae)';
        btn.style.color = 'var(--text-primary)';
    }
};

// ---- LIST VIEW ----
function _actRenderList(actions) {
    const container = document.getElementById('act-list-container');
    if (!container) return;
    if (actions.length === 0) {
        container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-tertiary);font-style:italic;">No actions match your filters.</div>`;
        return;
    }
    container.innerHTML = actions.map(a => {
        const sc = _actStatusColor(a.status);
        const isOverdue = a.timing?.dueDate && a.timing.dueDate < new Date().toISOString().substring(0,10) && a.status !== 'Completed';
        const objText = _actGetObjectiveText(a.commsObjectiveId);
        const dueStr = a.timing?.dueDate ? new Date(a.timing.dueDate + 'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'DD/MM/YYYY';
        const advStatus = a.advancedStatus ? `<span style="font-size:0.75rem; color:${isOverdue?'#ef4444':'var(--energy-algae)'};">⚠ ${a.advancedStatus}</span>` : '';
        const tags = (a.tags||[]).map(t => `<span style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:100px; background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.2);">${t}</span>`).join('');

        // Progress dots (complexity)
        const dots = Array.from({length:5}).map((_,i) => `<span style="width:7px;height:7px;border-radius:50%;background:${i<parseInt(a.complexity||0)?sc.dot:'var(--border-subtle)'};display:inline-block;"></span>`).join('');

        return `<div class="act-card${isOverdue?' overdue':''}" onclick="window.openActionModal('${a.id}')" style="cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                        <span class="act-status-badge" style="background:${sc.bg};color:${sc.color};border-color:${sc.dot};">${a.status}</span>
                        <span style="display:inline-flex; gap:3px; align-items:center;">${dots}</span>
                        ${tags}
                    </div>
                    <div style="font-weight:700; font-size:1rem; color:var(--text-primary); margin-bottom:0.3rem;">${a.activity}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.4rem;">${a.description || ''}</div>
                    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; font-size:0.8rem; color:var(--text-tertiary);">
                        ${a.audience && a.audience.length > 0 ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">groups</span>${a.audience.join(', ')}</span>` : ''}
                        ${a.commsObjectiveId ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;"><span style="font-size:0.85rem;">🎯</span> ${objText.length>50?objText.substring(0,47)+'...':objText}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:100px;">
                    <div style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:0.2rem; display:flex; align-items:center; gap:0.25rem; justify-content:flex-end;">
                        <span class="material-symbols-outlined" style="font-size:0.9rem;">person</span> ${a.owner||'-'}
                    </div>
                    ${advStatus ? `<div style="margin-bottom:0.2rem;">${advStatus}</div>` : ''}
                    <div style="font-size:0.8rem; color:${isOverdue?'#ef4444':'var(--text-tertiary)'};">due: ${dueStr}</div>
                    <button onclick="event.stopPropagation(); window.openActionModal('${a.id}')" class="btn-secondary" style="margin-top:0.5rem; font-size:0.75rem; padding:0.25rem 0.6rem; display:inline-flex; align-items:center; gap:0.25rem;">
                        <span class="material-symbols-outlined" style="font-size:0.9rem;">edit</span> Edit
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ---- KANBAN VIEW ----
function _actRenderKanban(actions) {
    const container = document.getElementById('act-kanban-container');
    if (!container) return;
    const columns = ['Pending','Planned','In Progress','Completed'];
    const colColors = { 'Pending':'#94a3b8','Planned':'#818cf8','In Progress':'#60a5fa','Completed':'#34d399' };

    container.innerHTML = columns.map(col => {
        const colActions = actions.filter(a => a.status === col);
        const cards = colActions.map(a => {
            const isOverdue = a.timing?.dueDate && a.timing.dueDate < new Date().toISOString().substring(0,10) && col !== 'Completed';
            const dueStr = a.timing?.dueDate ? new Date(a.timing.dueDate + 'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'DD/MM/YYYY';
            const objText = _actGetObjectiveText(a.commsObjectiveId);
            return `<div class="act-kanban-card${isOverdue?' overdue':''}" onclick="window.openActionModal('${a.id}')"
                style="${col==='Completed'?'border-left:3px solid #34d399;':''}${isOverdue?'border-left:3px solid #ef4444;border-color:#ef4444;background:rgba(239,68,68,0.03);':''}">
                <div style="font-size:0.72rem; color:${isOverdue?'#ef4444':'var(--text-tertiary)'}; margin-bottom:0.3rem;">due: ${dueStr} ${isOverdue?'<span style="color:#ef4444;">⊘</span>':''}</div>
                ${col==='Completed' ? `<div style="font-size:0.7rem;color:#059669;font-weight:600;margin-bottom:0.2rem;">completed: ${a.versionControl?.dateCompleted||dueStr}</div>` : ''}
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); margin-bottom:0.4rem; line-height:1.3;">${a.activity}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.4rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.description||''}</div>
                <div style="font-size:0.75rem; color:var(--text-tertiary); display:flex; flex-direction:column; gap:0.2rem; margin-bottom:0.5rem;">
                    ${a.audience&&a.audience.length>0?`<span><span class="material-symbols-outlined" style="font-size:0.8rem;vertical-align:middle;">groups</span> ${a.audience.slice(0,1).join(', ')}${a.audience.length>1?` + ${a.audience.length-1} more`:''}</span>`:''}
                    ${a.commsObjectiveId?`<span>🎯 ${objText.length>30?objText.substring(0,28)+'...':objText}</span>`:''}
                    <span><span class="material-symbols-outlined" style="font-size:0.8rem;vertical-align:middle;">person</span> ${a.owner||'-'}</span>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button onclick="event.stopPropagation();window.openActionModal('${a.id}')" class="btn-secondary" style="font-size:0.7rem; padding:0.2rem 0.5rem; display:inline-flex; align-items:center; gap:0.2rem;">
                        <span class="material-symbols-outlined" style="font-size:0.8rem;">edit</span> Edit
                    </button>
                </div>
            </div>`;
        }).join('') || `<div style="font-size:0.8rem;color:var(--text-tertiary);font-style:italic;text-align:center;padding:1rem 0;">No items</div>`;

        return `<div class="act-kanban-col">
            <div class="act-kanban-col-header">
                <span style="width:10px;height:10px;background:${colColors[col]};border-radius:2px;display:inline-block;flex-shrink:0;"></span>
                <span>${col}</span>
                <span style="font-size:0.8rem;font-weight:400;color:var(--text-tertiary);margin-left:auto;">${colActions.length}</span>
                <span style="display:inline-flex; gap:2px;">${Array(3).fill('<span style="width:4px;height:14px;border-radius:2px;background:'+colColors[col]+';opacity:0.6;display:inline-block;"></span>').join('')}</span>
            </div>
            ${cards}
        </div>`;
    }).join('');
}

// ---- GANTT VIEW ----
function _actRenderGantt(actions) {
    const container = document.getElementById('act-gantt-container');
    if (!container) return;

    // Build months range
    const now = new Date();
    const months = [];
    for (let i = -1; i <= 5; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ label: d.toLocaleString('default',{month:'long'}), year: d.getFullYear(), month: d.getMonth(), date: d });
    }
    const rangeStart = months[0].date;
    const rangeEnd   = new Date(months[months.length-1].year, months[months.length-1].month + 1, 0);
    const totalDays  = (rangeEnd - rangeStart) / 86400000;

    const getLeft = (dateStr) => {
        if (!dateStr) return 0;
        const d = new Date(dateStr + 'T00:00:00');
        return Math.max(0, Math.min(100, ((d - rangeStart) / 86400000 / totalDays) * 100));
    };
    const getWidth = (startStr, endStr, length) => {
        let start = startStr ? new Date(startStr+'T00:00:00') : rangeStart;
        let end = endStr ? new Date(endStr+'T00:00:00') : start;
        if (!startStr && length) {
            const wks = parseFloat(length) || 4;
            end = new Date(start.getTime() + wks * 7 * 86400000);
        }
        return Math.max(2, ((end - start) / 86400000 / totalDays) * 100);
    };

    // Group by objective
    const spine = window.getData('spine') || {};
    const objectives = spine.objectives || [];
    const todayPct = ((new Date() - rangeStart) / 86400000 / totalDays) * 100;

    // Bar colors by status
    const barColors = { 'Pending':'#94a3b8','Planned':'#818cf8','In Progress':'#60a5fa','Completed':'#34d399' };

    const LABEL_W = 200; // px for task label column

    const headerHtml = `
        <div style="display:flex; position:sticky; top:0; z-index:10; background:var(--bg-surface); border-bottom:1px solid var(--border-subtle); margin-bottom:0.5rem;">
            <div style="width:${LABEL_W}px; flex-shrink:0;"></div>
            <div style="flex:1; display:flex; position:relative; overflow:hidden;">
                ${months.map((m,i) => `<div style="flex:1; padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:600; color:var(--text-secondary); border-left:1px solid var(--border-subtle);">${m.label}</div>`).join('')}
                <div style="position:absolute; top:0; left:${todayPct.toFixed(1)}%; width:2px; height:100%; background:#ef4444; z-index:5;"></div>
                <div style="position:absolute; top:0; left:${todayPct.toFixed(1)}%; background:#ef4444; color:#fff; font-size:0.6rem; font-weight:700; padding:1px 4px; border-radius:2px; transform:translateX(-50%);">Now</div>
            </div>
        </div>`;

    let bodyHtml = '';
    const groupedObjectives = objectives.filter(o => actions.some(a => a.commsObjectiveId === o.id));
    const ungrouped = actions.filter(a => !a.commsObjectiveId);

    const renderGroup = (objText, groupActions, color='#818cf8') => {
        if (groupActions.length === 0) return '';
        const rows = groupActions.map(a => {
            const left  = getLeft(a.timing?.startDate || a.timing?.dueDate);
            const width = getWidth(a.timing?.startDate, a.timing?.dueDate, a.timing?.predictedLength);
            const clr   = barColors[a.status] || '#94a3b8';
            return `<div style="display:flex; align-items:center; margin-bottom:0.5rem; min-height:28px;">
                <div style="width:${LABEL_W}px; flex-shrink:0; font-size:0.78rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:0.75rem; cursor:pointer;" onclick="window.openActionModal('${a.id}')" title="${a.activity}">
                    ${a.activity}
                </div>
                <div style="flex:1; position:relative; height:20px;">
                    ${Array.from({length:months.length}).map((_,i)=>`<div style="position:absolute; top:0; left:${(i/months.length*100).toFixed(1)}%; width:${(100/months.length).toFixed(1)}%; height:100%; border-left:1px solid var(--border-subtle); opacity:0.4;"></div>`).join('')}
                    <div style="position:absolute; left:${left.toFixed(1)}%; width:${width.toFixed(1)}%; height:100%; background:${clr}; border-radius:4px; opacity:0.85; cursor:pointer; display:flex; align-items:center; padding-left:4px; font-size:0.65rem; color:#fff; font-weight:600; white-space:nowrap; overflow:hidden;" onclick="window.openActionModal('${a.id}')" title="${a.status}"></div>
                    <div style="position:absolute; top:0; left:${todayPct.toFixed(1)}%; width:1px; height:100%; background:#ef4444; opacity:0.6;"></div>
                </div>
            </div>`;
        }).join('');

        return `<div style="margin-bottom:1.25rem;">
            <div style="display:flex; align-items:center; margin-bottom:0.5rem;">
                <div style="width:${LABEL_W}px; flex-shrink:0;"></div>
                <div style="flex:1; background:rgba(0,0,0,0.04); border-radius:4px; padding:0.3rem 0.75rem; font-size:0.8rem; font-weight:600; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
                    <span style="font-size:0.85rem;">🎯</span> ${objText}
                </div>
            </div>
            ${rows}
        </div>`;
    };

    groupedObjectives.forEach(o => {
        const groupActions = actions.filter(a => a.commsObjectiveId === o.id);
        bodyHtml += renderGroup(o.text, groupActions);
    });
    if (ungrouped.length > 0) bodyHtml += renderGroup('No Objective', ungrouped, '#aaa');

    container.innerHTML = `
        <div style="overflow-x:auto; padding-bottom:1rem;">
            <div style="min-width:700px;">
                ${headerHtml}
                ${bodyHtml || '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);font-style:italic;">No actions to display.</div>'}
            </div>
        </div>`;
}

// ---- MODAL OPEN/CLOSE ----
window.openActionModal = function(id) {
    _actCurrentId = id;
    const overlay = document.getElementById('act-modal-overlay');
    if (!overlay) return;
    overlay.style.display = 'block';
    _actPopulateObjectiveDropdown();

    const deleteBtn = document.getElementById('act-modal-delete-btn');
    if (deleteBtn) deleteBtn.style.display = id ? 'inline-flex' : 'none';

    if (id) {
        const actions = window.getData('actions') || [];
        const a = actions.find(x => x.id === id);
        if (!a) return;
        _actOriginalData = JSON.parse(JSON.stringify(a));
        _actFillModal(a);
    } else {
        _actOriginalData = null;
        _actClearModal();
    }
};

window.closeActionModal = function() {
    const overlay = document.getElementById('act-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    _actCurrentId = null;
};

window.toggleActSection = function(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

function _actClearModal() {
    const fields = ['act-f-title','act-f-description','act-f-desired-outcome','act-f-kpi','act-f-due-date','act-f-start-date','act-f-predicted-length','act-f-resource','act-f-vc-progress','act-f-vc-blockers','act-f-other'];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const sel = document.getElementById('act-f-status');
    if (sel) sel.value = 'Pending';
    const obj = document.getElementById('act-f-objective');
    if (obj) obj.value = '';
    document.getElementById('act-f-todos').innerHTML = '';
    document.getElementById('act-f-prereqs').innerHTML = '';
    document.getElementById('act-f-audience-chips').innerHTML = '';
    document.getElementById('act-f-owner-chips').innerHTML = '';
    document.querySelectorAll('input[name="act-privacy"]').forEach(r => { r.checked = r.value === 'Public/Official'; });
    document.querySelectorAll('.act-tag-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('act-vc-summary').textContent = '';
    document.getElementById('act-vc-created').textContent = '';
    document.getElementById('act-vc-edited').textContent = '';
    document.getElementById('act-vc-who').textContent = '';
}

function _actFillModal(a) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    set('act-f-title', a.activity);
    set('act-f-description', a.description);
    set('act-f-desired-outcome', a.desiredOutcome);
    set('act-f-kpi', a.kpiTarget);
    set('act-f-due-date', a.timing?.dueDate || '');
    set('act-f-start-date', a.timing?.startDate || '');
    set('act-f-predicted-length', a.timing?.predictedLength || '');
    set('act-f-resource', a.resourceRequirement);
    set('act-f-vc-progress', a.versionControl?.recentProgress || '');
    set('act-f-vc-blockers', a.versionControl?.currentBlockers || '');
    set('act-f-other', a.other);

    const statusEl = document.getElementById('act-f-status');
    if (statusEl) statusEl.value = a.status || 'Pending';
    const objEl = document.getElementById('act-f-objective');
    if (objEl) objEl.value = a.commsObjectiveId || '';

    // Privacy
    document.querySelectorAll('input[name="act-privacy"]').forEach(r => { r.checked = r.value === a.privacy; });

    // Tags
    document.querySelectorAll('.act-tag-btn').forEach(btn => {
        const tag = btn.textContent.trim().replace(/^[^\s]+\s/,'');
        btn.classList.toggle('active', (a.tags||[]).includes(tag.trim()));
    });

    // Audience chips
    const audContainer = document.getElementById('act-f-audience-chips');
    if (audContainer) {
        audContainer.innerHTML = (a.audience||[]).map(aud => _actMakeChip(aud,'audience')).join('');
    }

    // Owner chips
    const ownContainer = document.getElementById('act-f-owner-chips');
    if (ownContainer) {
        ownContainer.innerHTML = (a.owner ? a.owner.split('+').map(o=>o.trim()) : []).map(o => _actMakeOwnerChip(o)).join('');
    }

    // Todos
    const todosEl = document.getElementById('act-f-todos');
    if (todosEl) {
        todosEl.innerHTML = (a.todos||[]).map(t => _actMakeTodoRow(t.id,t.completed,t.detail)).join('');
    }

    // Prereqs
    const prereqsEl = document.getElementById('act-f-prereqs');
    if (prereqsEl) {
        const allActions = window.getData('actions') || [];
        prereqsEl.innerHTML = (a.prerequisites||[]).map(pid => {
            const prereq = allActions.find(x => x.id === pid);
            return _actMakePrereqRow(pid, prereq?.activity || pid);
        }).join('');
    }

    // Version control metadata
    if (a.versionControl) {
        const vc = a.versionControl;
        const vcSumEl = document.getElementById('act-vc-summary');
        if (vcSumEl) vcSumEl.textContent = 'Current Version: ' + (vc.currentVersion || '-') + ' (changes made)';
        const createdEl = document.getElementById('act-vc-created');
        if (createdEl) createdEl.textContent = 'Task Created: ' + (vc.taskCreated || '-');
        const editedEl = document.getElementById('act-vc-edited');
        if (editedEl) editedEl.textContent = 'Task Last Edited: ' + (vc.lastEdited || '-');
        const whoEl = document.getElementById('act-vc-who');
        if (whoEl) whoEl.textContent = vc.whoEdited || '-';
        const hlEl = document.getElementById('act-f-highlight-changes');
        if (hlEl) hlEl.checked = !!vc.highlightChanges;
        const compEl = document.getElementById('act-f-completed-check');
        if (compEl) compEl.checked = !!vc.dateCompleted;
        const compDate = document.getElementById('act-f-date-completed');
        if (compDate) compDate.value = vc.dateCompleted || '';
    }
}

function _actMakeChip(label, type) {
    return `<span style="background:rgba(16,185,129,0.1);color:var(--energy-algae);border:1px solid rgba(16,185,129,0.3);border-radius:100px;padding:0.15rem 0.5rem;font-size:0.72rem;display:inline-flex;align-items:center;gap:0.25rem;">
        ${label}
        <span onclick="this.parentElement.remove()" style="cursor:pointer;font-weight:700;line-height:1;">×</span>
    </span>`;
}

function _actMakeOwnerChip(label) {
    const colors = { 'Vant':'#ef4444', 'AET':'#3b82f6', 'AET + Vant':'#8b5cf6' };
    const clr = colors[label] || '#6b7280';
    return `<span style="background:${clr};color:#fff;border-radius:4px;padding:0.15rem 0.6rem;font-size:0.75rem;font-weight:600;display:inline-flex;align-items:center;gap:0.25rem;">
        ${label}
        <span onclick="this.parentElement.remove()" style="cursor:pointer;font-weight:700;line-height:1;opacity:0.8;">×</span>
    </span>`;
}

function _actMakeTodoRow(id, completed, detail) {
    return `<div style="display:flex;align-items:center;gap:0.5rem;" id="todo-row-${id}">
        <input type="checkbox" ${completed?'checked':''} onchange="window.toggleTodo('${id}',this.checked)" style="flex-shrink:0;cursor:pointer;">
        <span style="font-size:0.75rem;color:var(--text-tertiary);text-decoration:none;font-weight:600;width:70px;">Completed</span>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Details:</span>
        <input type="text" value="${detail||''}" style="flex:1;padding:0.25rem 0.5rem;border:1px solid var(--border-subtle);background:var(--bg-app);color:var(--text-primary);border-radius:4px;font-size:0.8rem;" placeholder="input text">
        <button onclick="document.getElementById('todo-row-${id}').remove()" style="background:#34d399;border:none;color:#fff;width:20px;height:20px;border-radius:3px;cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
        <button onclick="document.getElementById('todo-row-${id}').remove()" style="background:#ef4444;border:none;color:#fff;width:20px;height:20px;border-radius:3px;cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;">−</button>
    </div>`;
}

function _actMakePrereqRow(id, label) {
    return `<div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;color:var(--text-secondary);" id="prereq-row-${id}">
        <span class="material-symbols-outlined" style="font-size:1rem;color:var(--text-tertiary);">drag_indicator</span>
        <span style="flex:1;">${label}</span>
        <button onclick="document.getElementById('prereq-row-${id}').remove()" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:1.1rem;line-height:1;padding:0.1rem 0.3rem;border-radius:3px;border:1px solid var(--border-subtle);">×</button>
    </div>`;
}

window.addTodoItem = function() {
    const el = document.getElementById('act-f-todos');
    if (!el) return;
    const newId = 'new-' + Date.now();
    el.insertAdjacentHTML('beforeend', _actMakeTodoRow(newId, false, ''));
};

window.addPrereqItem = function() {
    const el = document.getElementById('act-f-prereqs');
    if (!el) return;
    const newId = 'new-' + Date.now();
    el.insertAdjacentHTML('beforeend', _actMakePrereqRow(newId, 'Sub Action (action that needs to be done before this one)'));
};

window.addAudienceChip = function() {
    const stakeholders = window.getData('stakeholders') || [];
    const name = prompt('Enter audience name (or stakeholder):',  stakeholders.length ? stakeholders[0].name : '');
    if (!name) return;
    const el = document.getElementById('act-f-audience-chips');
    if (el) el.insertAdjacentHTML('beforeend', _actMakeChip(name,'audience'));
};

window.addOwnerChip = function() {
    const val = prompt('Owner name (e.g. Vant, AET):', 'Vant');
    if (!val) return;
    const el = document.getElementById('act-f-owner-chips');
    if (el) el.insertAdjacentHTML('beforeend', _actMakeOwnerChip(val.trim()));
};

window.toggleTag = function(btn, tag) {
    btn.classList.toggle('active');
};

window.toggleTodo = function(id, checked) {
    const row = document.getElementById('todo-row-' + id);
    if (row) {
        const input = row.querySelector('input[type=text]');
        if (input) input.style.textDecoration = checked ? 'line-through' : 'none';
    }
};

window.revertActionChanges = function() {
    if (_actOriginalData) _actFillModal(_actOriginalData);
    else _actClearModal();
};

window.saveCurrentAction = function() {
    const id = _actCurrentId;
    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'}) + ' ' + now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

    const getTags = () => Array.from(document.querySelectorAll('.act-tag-btn.active')).map(b => b.textContent.trim().replace(/^[^\s]*\s/,''));
    const getOwner = () => Array.from(document.querySelectorAll('#act-f-owner-chips > span')).map(s => s.textContent.replace('×','').trim()).join(' + ');
    const getAudience = () => Array.from(document.querySelectorAll('#act-f-audience-chips > span')).map(s => s.textContent.replace('×','').trim());
    const getTodos = () => Array.from(document.querySelectorAll('#act-f-todos > div')).map((row,i) => ({
        id: row.id.replace('todo-row-','') || ('t'+i),
        completed: row.querySelector('input[type=checkbox]')?.checked || false,
        detail: row.querySelector('input[type=text]')?.value || ''
    }));
    const getPrivacy = () => document.querySelector('input[name="act-privacy"]:checked')?.value || 'Public/Official';

    const updates = {
        activity: document.getElementById('act-f-title')?.value || 'Untitled',
        description: document.getElementById('act-f-description')?.value || '',
        owner: getOwner() || document.getElementById('act-f-title')?.value,
        audience: getAudience(),
        status: document.getElementById('act-f-status')?.value || 'Pending',
        tags: getTags(),
        priority: document.getElementById('act-f-priority')?.value || 'Medium',
        complexity: document.getElementById('act-f-complexity')?.value || '3',
        commsObjectiveId: document.getElementById('act-f-objective')?.value || '',
        desiredOutcome: document.getElementById('act-f-desired-outcome')?.value || '',
        kpiTarget: document.getElementById('act-f-kpi')?.value || '',
        timing: {
            dueDate: document.getElementById('act-f-due-date')?.value || '',
            startDate: document.getElementById('act-f-start-date')?.value || '',
            predictedLength: document.getElementById('act-f-predicted-length')?.value || ''
        },
        resourceRequirement: document.getElementById('act-f-resource')?.value || '',
        todos: getTodos(),
        other: document.getElementById('act-f-other')?.value || '',
        privacy: getPrivacy(),
        versionControl: {
            currentVersion: nowStr,
            recentProgress: document.getElementById('act-f-vc-progress')?.value || '',
            currentBlockers: document.getElementById('act-f-vc-blockers')?.value || '',
            taskCreated: _actOriginalData?.versionControl?.taskCreated || nowStr,
            lastEdited: nowStr,
            whoEdited: 'Portal User',
            highlightChanges: document.getElementById('act-f-highlight-changes')?.checked || false,
            dateCompleted: document.getElementById('act-f-completed-check')?.checked ? (document.getElementById('act-f-date-completed')?.value || nowStr.split(' ')[0]) : ''
        }
    };

    const actions = window.getData('actions') || [];
    if (id) {
        const idx = actions.findIndex(a => a.id === id);
        if (idx !== -1) {
            actions[idx] = { ...actions[idx], ...updates };
        }
    } else {
        updates.id = 'act-' + Date.now();
        actions.push(updates);
    }
    window.updateData('actions', actions);
    window.closeActionModal();
    window.filterActions();
};

window.deleteCurrentAction = function() {
    if (!_actCurrentId) return;
    if (!confirm('Delete this action? This cannot be undone.')) return;
    let actions = window.getData('actions') || [];
    actions = actions.filter(a => a.id !== _actCurrentId);
    window.updateData('actions', actions);
    window.closeActionModal();
    window.filterActions();
};


// ---- STRATEGY SPINE ----

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
            refreshSpineUI();
        });
    }

    // Draggable modal
    const modal = document.getElementById('spine-modal');
    const header = document.getElementById('spine-modal-header');
    if (modal && header) {
        let isDragging = false, offset = { x: 0, y: 0 };
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
        document.addEventListener('mouseup', () => { isDragging = false; });
    }
}

function refreshSpineUI() {
    const spine = window.getData('spine');
    if (!spine) return;

    const purposeEl = document.getElementById('spine-purpose');
    if (purposeEl) purposeEl.textContent = spine.purpose;

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

    const coreEl = document.getElementById('spine-narrative-core');
    const simpleEl = document.getElementById('spine-narrative-simple');
    if (coreEl) coreEl.textContent = `"${spine.narrative.core}"`;
    if (simpleEl) simpleEl.innerHTML = `<strong>Simple:</strong> ${spine.narrative.simple}`;

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

window.openSpineModal = function (type, id = null) {
    const modal = document.getElementById('spine-modal');
    const title = document.getElementById('spine-modal-title');
    const body = document.getElementById('spine-modal-body');
    const saveBtn = document.getElementById('spine-modal-save');
    const spine = window.getData('spine');
    currentEditId = id;
    body.innerHTML = '';

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
        modal.close(); return;
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
        const p = id ? spine.pillars.find(x => x.id === id) : { title: '', message: '', proofPoints: [] };
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Pillar Title</label>
            <input type="text" id="spine-input-ptitle" value="${p.title}" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Pillar Message</label>
            <textarea id="spine-input-pmsg" style="width:100%; height:80px; resize:none; overflow-y:auto; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${p.message}</textarea>
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Proof Points</label>
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
            const proofs = Array.from(document.querySelectorAll('.spine-proof-input')).map(el => el.value).filter(x => x.trim() !== '');
            if (id) {
                const target = spine.pillars.find(x => x.id === id);
                target.title = titleVal; target.message = msgVal; target.proofPoints = proofs;
            } else {
                spine.pillars.push({ id: 'p' + Date.now(), title: titleVal, message: msgVal, proofPoints: proofs });
            }
            saveAndCloseSpine(spine, modal);
        };
    }
    modal.showModal();
};

window.addProofPointInput = function () {
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

window.saveAndCloseSpine = function (spine, modal) {
    window.updateData('spine', spine);
    refreshSpineUI();
    modal.close();
};

window.deleteSpineItem = function (type, id) {
    const pwd = prompt('Enter administrator password to perform deletion (hint: "abracadabra"):');
    if (pwd !== 'abracadabra') { alert('Invalid password. Deletion cancelled.'); return; }
    const spine = window.getData('spine');
    if (type === 'objective') spine.objectives = spine.objectives.filter(o => o.id !== id);
    else if (type === 'pillar') spine.pillars = spine.pillars.filter(p => p.id !== id);
    window.updateData('spine', spine);
    refreshSpineUI();
};

window.moveProofPointUp = function (btn) {
    const row = btn.closest('div');
    if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
};

window.moveProofPointDown = function (btn) {
    const row = btn.closest('div');
    if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
};

window.saveObjectiveInline = function (id, val) {
    if (!val.trim()) return;
    const spine = window.getData('spine');
    const obj = spine.objectives.find(o => o.id === id);
    if (obj) { obj.text = val; window.updateData('spine', spine); }
    refreshSpineUI();
};

window.enableObjectiveInlineEdit = function (id) {
    const li = document.getElementById(`spine-obj-li-${id}`);
    if (!li) return;
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

window.moveObjective = function (id, dir) {
    const spine = window.getData('spine');
    const idx = spine.objectives.findIndex(o => o.id === id);
    if (idx === -1) return;
    if (dir === -1 && idx > 0) { const t = spine.objectives[idx]; spine.objectives[idx] = spine.objectives[idx-1]; spine.objectives[idx-1] = t; }
    else if (dir === 1 && idx < spine.objectives.length - 1) { const t = spine.objectives[idx]; spine.objectives[idx] = spine.objectives[idx+1]; spine.objectives[idx+1] = t; }
    window.updateData('spine', spine);
    refreshSpineUI();
};

window.addObjectiveInline = function () {
    const spine = window.getData('spine');
    const newId = 'obj' + Date.now();
    spine.objectives.push({ id: newId, text: '' });
    window.updateData('spine', spine);
    refreshSpineUI();
    setTimeout(() => window.enableObjectiveInlineEdit(newId), 0);
};

// ---- KNOWLEDGE BANK ----

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

    // Modal drag
    const modal = document.getElementById('kb-modal');
    const header = document.getElementById('kb-modal-header');
    if (modal && header) {
        let dragging = false, startX, startY, initialX, initialY;
        header.addEventListener('mousedown', e => {
            if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            const style = window.getComputedStyle(modal);
            const matrix = new DOMMatrixReadOnly(style.transform !== 'none' ? style.transform : 'matrix(1,0,0,1,0,0)');
            initialX = matrix.m41; initialY = matrix.m42;
            const onMove = e => { if (!dragging) return; modal.style.transform = `translate(${initialX + e.clientX - startX}px, ${initialY + e.clientY - startY}px)`; };
            const onUp = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
}

window.toggleKbAccordion = function (id) {
    if (isKbEditMode) return;
    const el = document.getElementById('kb-accordion-' + id);
    const content = document.getElementById('kb-content-' + id);
    const icon = document.getElementById('kb-icon-' + id);
    if (content.style.display === 'none') {
        content.style.display = 'block'; icon.style.transform = 'rotate(90deg)'; el.style.background = 'var(--bg-app)';
    } else {
        content.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; el.style.background = 'transparent';
    }
};

window.toggleKbFaq = function (id) {
    if (isKbEditMode) return;
    const content = document.getElementById('kb-faq-content-' + id);
    const icon = document.getElementById('kb-faq-icon-' + id);
    const el = document.getElementById('kb-faq-' + id);
    if (content.style.display === 'none') {
        content.style.display = 'block'; icon.style.transform = 'rotate(90deg)'; el.style.fontWeight = '600';
    } else {
        content.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; el.style.fontWeight = '500';
    }
};

function refreshKbUI() {
    const kb = window.getData('knowledgeBank');
    if (!kb) return;

    document.querySelectorAll('.kb-edit-btn').forEach(btn => btn.style.display = isKbEditMode ? 'flex' : 'none');

    // Key Messages
    const keyMsgGrid = document.getElementById('kb-key-messages-grid');
    if (keyMsgGrid) {
        keyMsgGrid.innerHTML = kb.keyMessages.map(km => `
            <div class="card" style="position:relative; background:var(--bg-surface); padding:1.5rem; display:flex; flex-direction:column; justify-content:flex-start; border:1px solid var(--border-subtle); border-radius:12px;">
                ${isKbEditMode ? `<button onclick="openKbModal('edit-key-message', '${km.id}')" style="position:absolute; right:1rem; top:1rem; background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">edit</span></button>` : ''}
                <h4 style="margin:0 0 0.5rem 0; font-size:1.1rem; color:var(--text-primary);">${km.title}</h4>
                <p style="font-size:0.85rem; color:var(--text-tertiary); margin:0 0 0.5rem 0;">Key Message</p>
                <p style="font-size:0.95rem; color:var(--text-secondary); margin:0 0 1.5rem 0;">${km.message}</p>
                <div id="kb-accordion-${km.id}" style="border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem; cursor:${isKbEditMode ? 'default' : 'pointer'}; transition:all 0.2s;" onclick="window.toggleKbAccordion('${km.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.9rem; font-weight:500;">Proof Points</span>
                        <span id="kb-icon-${km.id}" class="material-symbols-outlined" style="font-size:1.2rem; transition:transform 0.2s; transform:${isKbEditMode ? 'rotate(90deg)' : 'rotate(0deg)'};">arrow_right</span>
                    </div>
                    <div id="kb-content-${km.id}" style="display:${isKbEditMode ? 'block' : 'none'}; margin-top:1rem;">
                        <ul style="padding-left:1.5rem; margin:0; font-size:0.85rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.5rem;">
                            ${km.proofPoints.map(pp => `<li>${pp}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // FAQs
    const faqsGrid = document.getElementById('kb-faqs-grid');
    if (faqsGrid) {
        faqsGrid.innerHTML = kb.faqs.map(f => `
            <div class="card" style="position:relative; background:var(--bg-surface); outline:1px solid var(--border-subtle); border-radius:12px; overflow:hidden;">
                ${isKbEditMode ? `<button onclick="openKbModal('edit-faq', '${f.id}')" style="position:absolute; right:1rem; top:1rem; z-index:10; background:none; border:none; color:var(--text-secondary); cursor:pointer;"><span class="material-symbols-outlined">edit</span></button>` : ''}
                <div id="kb-faq-${f.id}" style="padding:0.75rem 1.5rem; cursor:${isKbEditMode ? 'default' : 'pointer'}; display:flex; justify-content:space-between; align-items:center; font-weight:500; font-size:0.95rem;" onclick="window.toggleKbFaq('${f.id}')">
                    <span style="padding-right:2rem;">${f.question}</span>
                    <span id="kb-faq-icon-${f.id}" class="material-symbols-outlined" style="font-size:1.5rem; transition:transform 0.2s; transform:${isKbEditMode ? 'rotate(90deg)' : 'rotate(0deg)'};">arrow_right</span>
                </div>
                <div id="kb-faq-content-${f.id}" style="display:${isKbEditMode ? 'block' : 'none'}; padding:0 1.5rem 1.5rem; border-top:1px solid var(--border-subtle);">
                    <p style="margin-top:1rem; font-size:0.9rem; color:var(--text-secondary); line-height:1.5; white-space:pre-wrap;">${f.answer}</p>
                </div>
            </div>
        `).join('');
    }

    // Audience Messages
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

window.openKbModal = function (type, id) {
    const kb = window.getData('knowledgeBank');
    if (!kb) return;
    const modal = document.getElementById('kb-modal');
    const title = document.getElementById('kb-modal-title');
    const body = document.getElementById('kb-modal-body');
    const saveBtn = document.getElementById('kb-modal-save');
    modal.style.transform = 'none';

    if (type === 'add-key-message' || type === 'edit-key-message') {
        title.textContent = id ? 'Edit Key Message' : 'Add Key Message';
        const msg = id ? kb.keyMessages.find(m => m.id === id) : { title: '', message: '', proofPoints: [] };
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Title</label>
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
                        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
                    </div>
                `).join('')}
            </div>
            ${id ? `<button onclick="window.deleteKbItem('key-message', '${id}')" style="margin-top:1rem; width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239,68,68,0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;">Delete Key Message</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const points = Array.from(document.querySelectorAll('.kb-point-input')).map(i => i.value).filter(v => v.trim() !== '');
            const newObj = { id: id || 'k' + Date.now(), title: document.getElementById('kb-input-title').value, message: document.getElementById('kb-input-msg').value, proofPoints: points };
            if (id) { const idx = kb.keyMessages.findIndex(m => m.id === id); kb.keyMessages[idx] = newObj; } else { kb.keyMessages.push(newObj); }
            window.updateData('knowledgeBank', kb); refreshKbUI(); modal.close();
        };
    } else if (type === 'add-faq' || type === 'edit-faq') {
        title.textContent = id ? 'Edit FAQ' : 'Add FAQ';
        const faq = id ? kb.faqs.find(f => f.id === id) : { question: '', answer: '' };
        body.innerHTML = `
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Question</label>
            <input type="text" id="kb-input-q" value="${faq.question.replace(/"/g, '&quot;')}" style="width:100%; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
            <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">Answer</label>
            <textarea id="kb-input-a" style="width:100%; height:150px; resize:none; padding:0.5rem; margin-bottom:1rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">${faq.answer}</textarea>
            ${id ? `<button onclick="window.deleteKbItem('faq', '${id}')" style="width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239,68,68,0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;">Delete FAQ</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const newObj = { id: id || 'f' + Date.now(), question: document.getElementById('kb-input-q').value, answer: document.getElementById('kb-input-a').value };
            if (id) { const idx = kb.faqs.findIndex(f => f.id === id); kb.faqs[idx] = newObj; } else { kb.faqs.push(newObj); }
            window.updateData('knowledgeBank', kb); refreshKbUI(); modal.close();
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
            ${id ? `<button onclick="window.deleteKbItem('audience', '${id}')" style="width:100%; padding:0.5rem; border:1px solid var(--energy-alert); background:rgba(239,68,68,0.1); color:var(--energy-alert); border-radius:4px; cursor:pointer;">Delete Audience</button>` : ''}
        `;
        saveBtn.onclick = () => {
            const newObj = { id: id || 'a' + Date.now(), icon: 'groups', title: document.getElementById('kb-input-aud').value, text: document.getElementById('kb-input-txt').value };
            if (id) { const idx = kb.audienceMessages.findIndex(a => a.id === id); kb.audienceMessages[idx] = newObj; } else { kb.audienceMessages.push(newObj); }
            window.updateData('knowledgeBank', kb); refreshKbUI(); modal.close();
        };
    }
    modal.showModal();
};

window.addKbListPoint = function () {
    const container = document.getElementById('kb-modal-points-container');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
    div.innerHTML = `
        <span style="color:var(--text-secondary);">•</span>
        <input type="text" class="kb-point-input" value="" style="flex:1; padding:0.4rem; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); border-radius:4px;">
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--energy-alert); cursor:pointer;"><span class="material-symbols-outlined" style="font-size:1.2rem;">delete</span></button>
    `;
    container.appendChild(div);
};

window.deleteKbItem = function (type, id) {
    const pwd = prompt('Enter administrator password to perform deletion (hint: "abracadabra"):');
    if (pwd !== 'abracadabra') { alert('Invalid password. Deletion cancelled.'); return; }
    const kb = window.getData('knowledgeBank');
    if (type === 'key-message') kb.keyMessages = kb.keyMessages.filter(o => o.id !== id);
    else if (type === 'faq') kb.faqs = kb.faqs.filter(o => o.id !== id);
    else if (type === 'audience') kb.audienceMessages = kb.audienceMessages.filter(o => o.id !== id);
    window.updateData('knowledgeBank', kb);
    refreshKbUI();
    document.getElementById('kb-modal').close();
};

// ---- SCROLL FORWARDING ----
window.addEventListener('wheel', (e) => {
    const vc = document.getElementById('view-container');
    if (vc && !vc.contains(e.target)) {
        const nav = document.getElementById('nav-links-container');
        if (nav && nav.contains(e.target) && nav.scrollHeight > nav.clientHeight) return;
        vc.scrollTop += e.deltaY;
    }
}, { passive: true });
