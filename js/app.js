// ============================================================
//  AET Portal — app.js
//  Architecture: portal.html is the single shell.
//  Each view is a real HTML file in /pages/ loaded via fetch().
// ============================================================

// ---- DATE UTILITIES ----

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function relativeDate(dateStr) {
    if (!dateStr) return { text: '—', color: 'var(--text-tertiary)', isOverdue: false };
    const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
    if (isNaN(d.getTime())) return { text: dateStr, color: 'var(--text-tertiary)', isOverdue: false };
    const now = new Date(); now.setHours(0,0,0,0);
    const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
        const absDiff = Math.abs(diff);
        if (absDiff >= 365) return { text: `overdue by ${Math.floor(absDiff/365)} year${Math.floor(absDiff/365)>1?'s':''}`, color: '#ef4444', isOverdue: true };
        if (absDiff >= 31) return { text: `overdue by ${Math.floor(absDiff/30)} month${Math.floor(absDiff/30)>1?'s':''}`, color: '#ef4444', isOverdue: true };
        return { text: `overdue by ${absDiff} day${absDiff>1?'s':''}`, color: '#ef4444', isOverdue: true };
    }
    if (diff === 0) return { text: 'due today', color: '#ef4444', isOverdue: false };
    if (diff <= 7) return { text: `due in ${diff} day${diff>1?'s':''}`, color: '#f97316', isOverdue: false };
    if (diff <= 14) return { text: `due in ${diff} day${diff>1?'s':''}`, color: '#eab308', isOverdue: false };
    if (diff <= 31) return { text: `due in ${diff} days`, color: 'var(--text-tertiary)', isOverdue: false };
    if (diff < 365) return { text: `due in ${Math.floor(diff/30)} month${Math.floor(diff/30)>1?'s':''}`, color: 'var(--text-tertiary)', isOverdue: false };
    return { text: `due in ${Math.floor(diff/365)} year${Math.floor(diff/365)>1?'s':''}`, color: 'var(--text-tertiary)', isOverdue: false };
}

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
    'dashboard': 'pages/dashboard.html',
    'stakeholders': 'pages/stakeholders.html',
    'stakeholder_detail': 'pages/stakeholder_detail.html',
    'interactions': 'pages/interactions.html',
    'interaction_detail': 'pages/interaction_detail.html',
    'interaction_edit': 'pages/interaction_edit.html',
    'actions': 'pages/actions.html',
    'action_detail': 'pages/action_detail.html',
    'strategy_spine': 'pages/strategy_spine.html',
    'knowledge_bank': 'pages/knowledge_bank.html',
    'approvals': 'pages/approvals.html',
};

// Maps view names to their post-load render functions
const VIEW_RENDERERS = {
    'dashboard': renderDashboard,
    'stakeholders': renderStakeholders,
    'stakeholder_detail': renderStakeholderDetail,
    'interactions': renderInteractions,
    'interaction_detail': renderInteractionDetail,
    'interaction_edit': renderInteractionEdit,
    'actions': renderActions,
    'action_detail': renderActionDetail,
    'strategy_spine': renderStrategySpine,
    'knowledge_bank': renderMessaging,
    'approvals': renderApprovals,
};

// Track current action being viewed/edited
window.currentActionId = null;

// Navigate to action detail page
window.viewAction = function (id) {
    window.currentActionId = id;
    loadView('action_detail');
    history.pushState(null, '', '#action_detail');
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

function renderDashboard(pageIdOverride) {
    const container = document.getElementById('dash-cards-container');
    const tabsContainer = document.getElementById('dash-tabs');
    if (!container) return;

    // ── Render variation tabs ──
    const variations = window.getData('dashboardVariations') || [];
    const activePageId = pageIdOverride || 3; // default to Overview (page 3)
    window._dashActivePageId = activePageId;

    if (tabsContainer && variations.length > 0) {
        tabsContainer.innerHTML = variations.map(v => {
            const isActive = v.cp_id === activePageId;
            return `<button id="dash-tab-${v.cp_id}" class="btn-secondary" style="border-radius:20px;font-size:0.85rem;height:32px;padding:0 1rem;${isActive ? 'background:var(--energy-algae);color:#fff;border-color:var(--energy-algae);' : ''}" onclick="window._switchDashTab(${v.cp_id})">${v.cp_variation_label || v.cp_title}</button>`;
        }).join('') + '<button class="btn-secondary" style="border-radius:20px;font-size:0.85rem;height:32px;padding:0 1rem;opacity:0.4;pointer-events:none;">+ Layout</button>';
    }

    // ── Get cards (from cache or override) ──
    let cards;
    if (pageIdOverride && pageIdOverride !== 3) {
        cards = window._dashTabCards || [];
    } else {
        cards = window.getData('dashboardCards') || [];
    }

    const stats = window.getData('stats');
    const actions = window.getData('actions') || [];
    const interactions = window.getData('interactions') || [];
    const spine = window.getData('spine');
    const pageLinks = window.getData('pageLinks') || [];

    if (cards.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;padding:2rem;text-align:center;color:var(--text-tertiary);font-style:italic;">Dashboard cards loading...</div>';
        return;
    }

    // ── Width mapping for 6-col grid ──
    const widthToSpan = { 'full': 'grid-column:1/-1;', 'half': 'grid-column:span 3;', 'third': 'grid-column:span 2;' };

    container.innerHTML = cards.map(card => {
        const colSpan = widthToSpan[card.cc_width || 'full'] || widthToSpan['full'];

        switch (card.cc_card_type) {

            case 'overview_card': {
                const title = card.cc_title || '';
                let statsHtml = '', clickView = 'dashboard';
                if (title === 'Stakeholders' && stats) {
                    clickView = 'stakeholders';
                    statsHtml = `<div style="display:flex;justify-content:space-between;align-items:center;">
                        <div><div style="font-size:2.5rem;font-weight:700;">${stats.stakeholders.total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div>
                        <div style="font-size:0.8rem;line-height:1.6;"><div><span style="color:var(--energy-algae);">●</span> ${stats.stakeholders.healthy} Healthy</div><div><span style="color:var(--energy-solar);">●</span> ${stats.stakeholders.neutral} Neutral</div><div><span style="color:var(--energy-alert);">●</span> ${stats.stakeholders.atRisk} At Risk</div></div></div>`;
                } else if (title === 'Interactions' && stats) {
                    clickView = 'interactions';
                    statsHtml = `<div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:2.5rem;font-weight:700;">${stats.interactions.upcoming}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Upcoming</div></div><div style="text-align:right;"><div style="font-size:2.5rem;font-weight:700;">${stats.interactions.total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div></div>`;
                } else if (title === 'Actions' && stats) {
                    clickView = 'actions';
                    statsHtml = `<div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:2.5rem;font-weight:700;">${stats.actions.total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div><div style="text-align:right;"><div style="font-size:2.5rem;font-weight:700;">${stats.actions.active}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Active</div></div></div>`;
                }
                return `<div class="card" style="${colSpan}cursor:pointer;transition:all 0.2s;" onclick="loadView('${clickView}');history.pushState(null,'','#${clickView}')" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${title}</h3>${statsHtml}</div>`;
            }

            case 'card': {
                return `<div class="card" style="${colSpan}"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${card.cc_title || ''}</h3><p style="font-size:1rem;color:var(--text-secondary);margin:0;">${card.cc_content || ''}</p></div>`;
            }

            case 'actions_link': {
                const filter = card.cc_filter || '';
                let filtered = [...actions];
                const now = new Date();
                const isDone = a => /^complete[d]?$/i.test(a.status || '');
                if (filter === 'completed') filtered = filtered.filter(a => isDone(a));
                else if (filter === 'overdue') filtered = filtered.filter(a => a.timing?.dueDate && new Date(a.timing.dueDate + 'T00:00:00') < now && !isDone(a));
                else if (filter === 'upcoming') filtered = filtered.filter(a => a.timing?.dueDate && new Date(a.timing.dueDate + 'T00:00:00') >= now && !isDone(a));
                // Partition: incomplete sorted by due date asc, then completed at bottom
                const incArr = filtered.filter(a => !isDone(a)).sort((a, b) => (a.timing?.dueDate || '9999-12-31').localeCompare(b.timing?.dueDate || '9999-12-31'));
                const doneArr = filtered.filter(a => isDone(a));
                filtered = [...incArr, ...doneArr];
                const items = filtered.slice(0, 3);
                const itemsHtml = items.length > 0 ? items.map(a => {
                    const dueStr = formatDate(a.timing?.dueDate);
                    const rel = relativeDate(a.timing?.dueDate);
                    const isOver = rel.isOverdue && !isDone(a);
                    const overdueStyle = isOver ? 'border-left:3px solid #ef4444;' : '';
                    const badgeStyle = isOver ? 'border-color:#ef4444;color:#ef4444;' : 'border-color:var(--energy-algae);color:var(--energy-algae);';
                    const hoverBorder = isOver ? '#ef4444' : 'var(--energy-algae)';
                    const mouseoutCode = isOver
                        ? "this.style.border='1px solid var(--border-subtle)';this.style.borderLeft='3px solid #ef4444'"
                        : "this.style.borderColor='var(--border-subtle)'";
                    const relLabel = !isDone(a) && a.timing?.dueDate ? `<div style="text-align:center;font-size:0.72rem;font-weight:600;color:${rel.color};margin-bottom:0.4rem;">${rel.text}</div>` : '';
                    return `<div class="card" style="padding:1rem;border:1px solid var(--border-subtle);cursor:pointer;transition:all 0.15s;${overdueStyle}" onclick="event.stopPropagation();window.viewAction('${a.id}')" onmouseover="this.style.borderColor='${hoverBorder}'" onmouseout="${mouseoutCode}">${relLabel}<div style="display:flex;justify-content:space-between;align-items:center;"><div><span class="status-badge" style="font-size:0.7rem;padding:0.1rem 0.5rem;${badgeStyle}">${a.status}</span><h4 style="margin:0.25rem 0 0;font-size:1rem;color:var(--text-primary);text-transform:none;">${a.activity}</h4><div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem;">Owner: ${a.owner || '\u2014'} | <span style="color:${rel.color}">Due: ${dueStr}</span></div></div><span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--text-tertiary);">open_in_new</span></div></div>`;
                }).join('') : '<div style="padding:1rem;color:var(--text-tertiary);font-style:italic;">No actions found.</div>';
                return `<div class="card" style="${colSpan}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || 'Actions'}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="loadView('actions');history.pushState(null,'','#actions')">View All</button></div><div style="display:flex;flex-direction:column;gap:0.5rem;">${itemsHtml}</div></div>`;
            }





            case 'interactions_link': {
                const filter = card.cc_filter || '';
                let filtered = interactions;
                if (filter === 'upcoming') filtered = interactions.filter(i => i.type === 'Upcoming');
                else if (filter === 'recent') filtered = interactions.filter(i => i.type === 'Recent');
                const items = filtered.slice(0, 3);
                const itemsHtml = items.length > 0 ? items.map(i => {
                    return `<div class="card" style="padding:1rem;border:1px solid var(--border-subtle);cursor:pointer;transition:all 0.15s;" onclick="window.currentInteractionId='${i.id}';loadView('interaction_detail');history.pushState(null,'','#interaction_detail')" onmouseover="this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span style="font-size:0.75rem;color:${i.type === 'Upcoming' ? 'var(--energy-alert)' : 'var(--text-tertiary)'};font-weight:600;text-transform:uppercase;">${i.rawDate} — ${i.type}</span><span class="material-symbols-outlined" style="font-size:1rem;color:var(--text-tertiary);">open_in_new</span></div><h4 style="margin:0;font-size:1rem;color:var(--text-primary);text-transform:none;">${i.title}</h4><div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem;">${i.agenda || i.discussed || ''}</div></div>`;
                }).join('') : '<div style="padding:1rem;color:var(--text-tertiary);font-style:italic;">No interactions found.</div>';
                return `<div class="card" style="${colSpan}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || 'Interactions'}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="loadView('interactions');history.pushState(null,'','#interactions')">View All</button></div><div style="display:flex;flex-direction:column;gap:0.5rem;">${itemsHtml}</div></div>`;
            }

            case 'page_link': {
                const link = pageLinks.find(l => l.cpc_content_card_id === card.cc_id);
                let previewHtml = '', targetView = 'strategy_spine';
                if (link && spine) {
                    const filter = card.cc_filter || link.cpc_filter || '';
                    if (filter === 'objectives' && spine.objectives) {
                        previewHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;"><div class="card" style="background:var(--bg-app);border:1px solid var(--border-subtle);"><h4 style="margin-bottom:1rem;font-size:0.9rem;">Objectives</h4><div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.85rem;">${spine.objectives.slice(0, 3).map(o => `<div style="padding:0.5rem 0.75rem;background:rgba(0,0,0,0.02);border:1px solid var(--border-subtle);border-radius:4px;color:var(--text-secondary);">${o.text}</div>`).join('')}</div></div><div class="card" style="background:var(--bg-app);border:1px solid var(--border-subtle);"><h4 style="margin-bottom:1rem;font-size:0.9rem;">Strategic Pillars</h4><div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.85rem;">${(spine.pillars || []).slice(0, 4).map(p => `<div style="padding:0.5rem 0.75rem;background:rgba(0,0,0,0.02);border:1px solid var(--border-subtle);border-radius:4px;color:var(--text-secondary);">${p.title}</div>`).join('')}</div></div></div>`;
                    }
                }
                return `<div class="card" style="${colSpan}cursor:pointer;" onclick="loadView('${targetView}');history.pushState(null,'','#${targetView}')"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || 'Linked Page'}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="event.stopPropagation();loadView('${targetView}');history.pushState(null,'','#${targetView}')">View</button></div>${previewHtml}</div>`;
            }

            default: return '';
        }
    }).join('');
}

// Tab switching handler — caches loaded cards
window._dashCardCache = {};
window._switchDashTab = async function (pageId) {
    const btn = document.getElementById('dash-tab-' + pageId);
    const origLabel = btn ? btn.textContent.trim() : '';

    if (pageId === 3) {
        // Overview — always cached from preload
        window._dashTabCards = null;
        renderDashboard(3);
    } else if (window._dashCardCache[pageId]) {
        // Already fetched — use cache, no loading needed
        window._dashTabCards = window._dashCardCache[pageId];
        renderDashboard(pageId);
    } else {
        // First load — show spinner next to label
        if (btn) btn.innerHTML = `${origLabel} <span class="material-symbols-outlined" style="font-size:0.9rem;vertical-align:middle;margin-left:0.25rem;animation:spin 0.8s linear infinite;">autorenew</span>`;
        const cards = await window.fetchContentCards(pageId);
        window._dashCardCache[pageId] = cards || [];
        window._dashTabCards = window._dashCardCache[pageId];
        renderDashboard(pageId);
    }
};

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

window.currentInteractionId = null;

window.viewInteraction = function (id) {
    window.currentInteractionId = id;
    loadView('interaction_detail');
    history.pushState(null, '', '#interaction_detail');
};

window.viewInteractionEdit = function (id = null) {
    window.currentInteractionId = id;
    window._interactionOpenInEditMode = true;
    loadView('interaction_detail');
    history.pushState(null, '', '#interaction_detail');
};

function renderInteractions() {
    const interactions = window.getData('interactions') || [];
    const container = document.getElementById('interactions-list');
    if (!container) return;
    container.innerHTML = '';

    interactions.forEach(a => {
        const isUpcoming = a.type === 'Upcoming';
        let statusBadge = '';
        if (isUpcoming) {
            statusBadge = `<div style="font-size: 0.8rem; font-weight: 600; color: #ef4444; margin-bottom: 0.5rem;">Upcoming: In 3 Days</div>`;
        } else {
            statusBadge = `<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #84cc16;"></div>
                <span style="font-size: 0.8rem; color: var(--text-tertiary);">"Good"</span>
            </div>`;
        }

        const dateString = a.date || a.rawDate;

        const agendaHtml = (a.topics || []).map(t => {
            let icon = 'chat';
            if (t.toLowerCase().includes('grant')) icon = 'add_circle';
            if (t.toLowerCase().includes('council')) icon = 'edit';
            return `<span class="interaction-pill agenda-item"><span class="material-symbols-outlined" style="font-size: 0.9rem;">${icon}</span> ${t}</span>`;
        }).join(' ');

        const attendeesHtml = (a.attendees || []).map(att => {
            return `<span class="interaction-pill"><span class="material-symbols-outlined" style="font-size: 0.9rem;">person</span> ${att}</span>`;
        }).join(' ');

        const card = document.createElement('div');
        card.className = `interaction-card-wrapper ${isUpcoming ? 'upcoming' : ''}`;
        card.onclick = () => window.viewInteraction(a.id);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    ${statusBadge}
                    <h3 style="margin: 0; font-size: 1.4rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif; text-transform: none;">${a.title || (a.agenda || a.discussed || '').substring(0, 60) + ((a.agenda || a.discussed || '').length > 60 ? '…' : '') || 'Untitled'}</h3>
                </div>
                <div style="text-align: right;">
                    ${!isUpcoming ? `<div style="font-size: 0.8rem; color: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; margin-bottom: 0.25rem;">${a.rawDate || ''}</div>` : ''}
                    <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary);">${dateString}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.5rem;">
                <div style="color: var(--text-secondary);">Summary:</div>
                <div style="color: var(--text-primary);">${a.agenda || a.discussed || ''}</div>
            </div>
            
            ${agendaHtml ? `
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.5rem; align-items: center;">
                <div style="color: var(--text-secondary);">Agenda:</div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">${agendaHtml}</div>
            </div>` : ''}
            
            ${attendeesHtml ? `
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; font-size: 0.9rem; align-items: center;">
                <div style="color: var(--text-secondary);">Attendees:</div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">${attendeesHtml}</div>
            </div>` : ''}
        `;
        container.appendChild(card);
    });
}

function renderInteractionDetail() {
    const id = window.currentInteractionId;
    if (!id) return;

    const interactions = window.getData('interactions') || [];
    const interaction = interactions.find(i => i.id == id);
    if (!interaction) return;

    document.getElementById('detail-int-title').textContent = interaction.title;
    document.getElementById('detail-int-date').textContent = interaction.rawDate + ' ' + interaction.date;

    const statusEl = document.getElementById('detail-int-status');
    if (interaction.type === 'Upcoming') {
        statusEl.textContent = 'Upcoming';
        statusEl.style.color = '#ef4444';
    } else {
        statusEl.textContent = 'Completed';
        statusEl.style.color = '#22c55e';
    }

    const descEl = document.getElementById('detail-int-description');
    if (interaction.discussed) {
        descEl.innerHTML = interaction.discussed.replace(/@\w+/g, match => `<span style="color: #3b82f6; font-weight: 500;">${match}</span>`).replace(/#[\w-]+/g, match => `<span style="color: #f59e0b; font-weight: 500;">${match}</span>`);
    } else {
        descEl.textContent = interaction.agenda || 'No description available.';
    }

    const attContainer = document.getElementById('detail-int-attendees');
    if (attContainer && interaction.attendees) {
        const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
        attContainer.innerHTML = interaction.attendees.map((a, i) => {
            const initials = a.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const color = avatarColors[i % avatarColors.length];
            return `<div class="interaction-pill" style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="int-avatar" style="background: ${color};">${initials}</div>
                ${a}
            </div>`;
        }).join('');
    }

    // Auto-open edit mode if flagged
    if (window._interactionOpenInEditMode) {
        window._interactionOpenInEditMode = false;
        setTimeout(() => {
            if (typeof window.toggleInteractionEdit === 'function') {
                window.toggleInteractionEdit();
            }
        }, 50);
    }
}

window.saveInteraction = function () {
    // Collect data
    const title = document.getElementById('edit-int-purpose')?.value || 'New Interaction';
    const date = document.getElementById('edit-int-date')?.value || '';
    const desc = document.getElementById('edit-int-description')?.value || '';

    const isNew = !window.currentInteractionId;
    const interactions = window.getData('interactions') || [];

    if (isNew) {
        const newInt = {
            id: Date.now(),
            title: title,
            rawDate: date,
            date: date,
            type: 'Upcoming',
            agenda: desc,
            discussed: desc,
            topics: [],
            attendees: ["Vant", "Mayor of CoGB"]
        };
        interactions.unshift(newInt);
    } else {
        const idx = interactions.findIndex(i => i.id == window.currentInteractionId);
        if (idx !== -1) {
            interactions[idx].title = title;
            interactions[idx].rawDate = date;
            interactions[idx].date = date;
            interactions[idx].agenda = desc;
        }
    }

    window.updateData('interactions', interactions);
    loadView('interactions');
    history.pushState(null, '', '#interactions');
};

function renderInteractionEdit() {
    const id = window.currentInteractionId;
    if (id) {
        document.getElementById('edit-int-page-title').textContent = 'Edit Interaction';
        const interactions = window.getData('interactions') || [];
        const interaction = interactions.find(i => i.id == id);
        if (interaction) {
            document.getElementById('edit-int-purpose').value = interaction.title;
            document.getElementById('edit-int-date').value = interaction.rawDate;
            document.getElementById('edit-int-description').value = interaction.agenda || interaction.discussed || '';
        }
    } else {
        document.getElementById('edit-int-page-title').textContent = 'Add Interaction';
    }
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
    // Fix: collapse filter panel on load
    const fp = document.getElementById('act-filter-panel');
    if (fp) fp.style.display = 'none';
    _actFilterOpen = false;
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
        'Pending': { bg: 'rgba(148,163,184,0.15)', color: '#64748b', dot: '#94a3b8' },
        'Planned': { bg: 'rgba(129,140,248,0.15)', color: '#6366f1', dot: '#818cf8' },
        'In Progress': { bg: 'rgba(96,165,250,0.15)', color: '#3b82f6', dot: '#60a5fa' },
        'Completed': { bg: 'rgba(52,211,153,0.15)', color: '#059669', dot: '#34d399' },
    };
    return map[status] || { bg: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', dot: '#aaa' };
}

// Populate objective <select> in modal
function _actPopulateObjectiveDropdown() {
    const sel = document.getElementById('act-f-objective');
    if (!sel) return;
    const spine = window.getData('spine');
    sel.innerHTML = '<option value="">— Select Objective —</option>';
    if (spine && spine.objectives) {
        spine.objectives.forEach(o => {
            sel.innerHTML += `<option value="${o.id}">🎯 ${o.text.length > 50 ? o.text.substring(0, 47) + '...' : o.text}</option>`;
        });
    }
}

// Filter + re-render
window.filterActions = function () {
    const search = (document.getElementById('act-search')?.value || '').toLowerCase();
    const statusF = document.getElementById('act-filter-status')?.value || '';
    const ownerF = document.getElementById('act-filter-owner')?.value || '';
    const phaseF = document.getElementById('act-filter-phase')?.value || '';

    let actions = window.getData('actions') || [];
    if (search) actions = actions.filter(a => (a.activity || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search));
    if (statusF) actions = actions.filter(a => a.status === statusF);
    if (ownerF) actions = actions.filter(a => (a.owner || '').includes(ownerF));
    if (phaseF) actions = actions.filter(a => a.phase === phaseF);

    // Sort
    if (_actSortMode === 'due') {
        actions.sort((a, b) => (a.timing?.dueDate || '9999') < (b.timing?.dueDate || '9999') ? -1 : 1);
    } else if (_actSortMode === 'status') {
        const order = ['In Progress', 'Planned', 'Pending', 'Completed'];
        actions.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    } else if (_actSortMode === 'owner') {
        actions.sort((a, b) => (a.owner || '').localeCompare(b.owner || ''));
    }

    const sortLabel = document.getElementById('act-sort-label');
    if (sortLabel) {
        const sortNames = { due: 'Due Date ↑', status: 'Status', owner: 'Owner A–Z' };
        sortLabel.textContent = sortNames[_actSortMode] || '';
    }

    _actRenderList(actions);
    _actRenderKanban(actions);
    _actRenderGantt(actions);
};

window.cycleActionsSort = function () {
    const modes = ['due', 'status', 'owner'];
    _actSortMode = modes[(modes.indexOf(_actSortMode) + 1) % modes.length];
    window.filterActions();
};

window.toggleActionsFilter = function () {
    _actFilterOpen = !_actFilterOpen;
    const panel = document.getElementById('act-filter-panel');
    if (panel) panel.style.display = _actFilterOpen ? 'flex' : 'none';
};

window.clearActionsFilters = function () {
    ['act-filter-status', 'act-filter-owner', 'act-filter-phase'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    window.filterActions();
};

window.switchActionsTab = function (tab, btn) {
    _actCurrentTab = tab;
    ['list', 'kanban', 'gantt'].forEach(t => {
        const v = document.getElementById('act-view-' + t);
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

// ---- KANBAN COLUMN TOGGLE ----
let _kanbanHiddenCols = [];
window.toggleKanbanCol = function (col, btn) {
    const idx = _kanbanHiddenCols.indexOf(col);
    if (idx >= 0) {
        _kanbanHiddenCols.splice(idx, 1);
        btn.classList.add('active');
        btn.style.opacity = '1';
    } else {
        _kanbanHiddenCols.push(col);
        btn.classList.remove('active');
        btn.style.opacity = '0.4';
    }
    // Re-render kanban columns
    const container = document.getElementById('act-kanban-container');
    if (!container) return;
    const cols = container.querySelectorAll('.act-kanban-col');
    const allCols = ['Pending', 'Planned', 'In Progress', 'Completed'];
    const visibleCount = allCols.filter(c => !_kanbanHiddenCols.includes(c)).length;
    cols.forEach((colEl, i) => {
        const colName = allCols[i];
        colEl.style.display = _kanbanHiddenCols.includes(colName) ? 'none' : '';
    });
    container.style.gridTemplateColumns = `repeat(${visibleCount || 1}, 1fr)`;
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
        const rel = relativeDate(a.timing?.dueDate);
        const isOverdue = rel.isOverdue && a.status !== 'Completed';
        const objText = _actGetObjectiveText(a.commsObjectiveId);
        const dueStr = formatDate(a.timing?.dueDate);
        const advStatus = a.advancedStatus ? `<span style="font-size:0.75rem; color:${isOverdue ? '#ef4444' : 'var(--energy-algae)'};">⚠ ${a.advancedStatus}</span>` : '';
        const tags = (a.tags || []).map(t => `<span style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:100px; background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.2);">${t}</span>`).join('');

        return `<div class="act-card${isOverdue ? ' overdue' : ''}" onclick="window.viewAction('${a.id}')" style="cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                        <span class="act-status-badge" style="background:${sc.bg};color:${sc.color};border-color:${sc.dot};">${a.status}</span>
                        ${tags}
                    </div>
                    <div style="font-weight:700; font-size:1rem; color:var(--text-primary); margin-bottom:0.3rem;">${a.activity}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.4rem;">${a.description || ''}</div>
                    <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; font-size:0.8rem; color:var(--text-tertiary);">
                        ${a.audience && a.audience.length > 0 ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">groups</span>${a.audience.join(', ')}</span>` : ''}
                        ${a.commsObjectiveId ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;"><span style="font-size:0.85rem;">🎯</span> ${objText.length > 50 ? objText.substring(0, 47) + '...' : objText}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:110px;">
                    <div style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:0.2rem; display:flex; align-items:center; gap:0.25rem; justify-content:flex-end;">
                        <span class="material-symbols-outlined" style="font-size:0.9rem;">person</span> ${a.owner || '-'}
                    </div>
                    ${advStatus ? `<div style="margin-bottom:0.2rem;">${advStatus}</div>` : ''}
                    <div style="font-size:0.8rem; color:${rel.color}; font-weight:${isOverdue ? '600' : '400'};">
                        ${rel.text}
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">
                        ${dueStr}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ---- KANBAN VIEW ----
function _actRenderKanban(actions) {
    const container = document.getElementById('act-kanban-container');
    if (!container) return;
    const columns = ['Pending', 'Planned', 'In Progress', 'Completed'];
    const colColors = { 'Pending': '#94a3b8', 'Planned': '#818cf8', 'In Progress': '#60a5fa', 'Completed': '#34d399' };

    container.innerHTML = columns.map(col => {
        const colActions = actions.filter(a => a.status === col);
        const cards = colActions.map(a => {
            const rel = relativeDate(a.timing?.dueDate);
            const isOverdue = rel.isOverdue && col !== 'Completed';
            const dueStr = formatDate(a.timing?.dueDate);
            const objText = _actGetObjectiveText(a.commsObjectiveId);
            return `<div class="act-kanban-card${isOverdue ? ' overdue' : ''}" onclick="window.viewAction('${a.id}')"
                style="cursor:pointer;${col === 'Completed' ? 'border-left:3px solid #34d399;' : ''}${isOverdue ? 'border-left:3px solid #ef4444;border-color:#ef4444;background:rgba(239,68,68,0.03);' : ''}">
                <div style="font-size:0.72rem; color:${rel.color}; font-weight:${isOverdue?'600':'400'}; margin-bottom:0.3rem;">${rel.text}</div>
                ${col === 'Completed' ? `<div style="font-size:0.7rem;color:#059669;font-weight:600;margin-bottom:0.2rem;">completed: ${formatDate(a.versionControl?.dateCompleted) || dueStr}</div>` : ''}
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); margin-bottom:0.4rem; line-height:1.3;">${a.activity}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.4rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.description || ''}</div>
                <div style="font-size:0.75rem; color:var(--text-tertiary); display:flex; flex-direction:column; gap:0.2rem;">
                    ${a.audience && a.audience.length > 0 ? `<span><span class="material-symbols-outlined" style="font-size:0.8rem;vertical-align:middle;">groups</span> ${a.audience.slice(0, 1).join(', ')}${a.audience.length > 1 ? ` + ${a.audience.length - 1} more` : ''}</span>` : ''}
                    ${a.commsObjectiveId ? `<span>🎯 ${objText.length > 30 ? objText.substring(0, 28) + '...' : objText}</span>` : ''}
                    <span><span class="material-symbols-outlined" style="font-size:0.8rem;vertical-align:middle;">person</span> ${a.owner || '-'}</span>
                </div>
            </div>`;
        }).join('') || `<div style="font-size:0.8rem;color:var(--text-tertiary);font-style:italic;text-align:center;padding:1rem 0;">No items</div>`;

        return `<div class="act-kanban-col">
            <div class="act-kanban-col-header">
                <span style="width:10px;height:10px;background:${colColors[col]};border-radius:2px;display:inline-block;flex-shrink:0;"></span>
                <span>${col}</span>
                <span style="font-size:0.8rem;font-weight:400;color:var(--text-tertiary);margin-left:auto;">${colActions.length}</span>
                <span style="display:inline-flex; gap:2px;">${Array(3).fill('<span style="width:4px;height:14px;border-radius:2px;background:' + colColors[col] + ';opacity:0.6;display:inline-block;"></span>').join('')}</span>
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
        months.push({ label: d.toLocaleString('default', { month: 'long' }), year: d.getFullYear(), month: d.getMonth(), date: d });
    }
    const rangeStart = months[0].date;
    const rangeEnd = new Date(months[months.length - 1].year, months[months.length - 1].month + 1, 0);
    const totalDays = (rangeEnd - rangeStart) / 86400000;

    const getLeft = (dateStr) => {
        if (!dateStr) return 0;
        const d = new Date(dateStr + 'T00:00:00');
        return Math.max(0, Math.min(100, ((d - rangeStart) / 86400000 / totalDays) * 100));
    };
    const getWidth = (startStr, endStr, length) => {
        let start = startStr ? new Date(startStr + 'T00:00:00') : rangeStart;
        let end = endStr ? new Date(endStr + 'T00:00:00') : start;
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
    const barColors = { 'Pending': '#94a3b8', 'Planned': '#818cf8', 'In Progress': '#60a5fa', 'Completed': '#34d399' };

    const LABEL_W = 200; // px for task label column

    const headerHtml = `
        <div style="display:flex; position:sticky; top:0; z-index:10; background:var(--bg-surface); border-bottom:1px solid var(--border-subtle); margin-bottom:0.5rem;">
            <div style="width:${LABEL_W}px; flex-shrink:0;"></div>
            <div style="flex:1; display:flex; position:relative; overflow:hidden;">
                ${months.map((m, i) => `<div style="flex:1; padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:600; color:var(--text-secondary); border-left:1px solid var(--border-subtle);">${m.label}</div>`).join('')}
                <div style="position:absolute; top:0; left:${todayPct.toFixed(1)}%; width:2px; height:100%; background:#ef4444; z-index:5;"></div>
                <div style="position:absolute; top:2px; left:${todayPct.toFixed(1)}%; background:#ef4444; color:#fff; font-size:0.6rem; font-weight:700; padding:1px 4px; border-radius:2px; transform:translateX(-50%); z-index:6;">Now</div>
            </div>
        </div>`;

    let bodyHtml = '';
    const groupedObjectives = objectives.filter(o => actions.some(a => a.commsObjectiveId === o.id));
    const ungrouped = actions.filter(a => !a.commsObjectiveId);

    const renderGroup = (objText, groupActions, color = '#818cf8') => {
        if (groupActions.length === 0) return '';
        const rows = groupActions.map(a => {
            const left = getLeft(a.timing?.startDate || a.timing?.dueDate);
            const width = getWidth(a.timing?.startDate, a.timing?.dueDate, a.timing?.predictedLength);
            const clr = barColors[a.status] || '#94a3b8';
            return `<div style="display:flex; align-items:center; margin-bottom:0.5rem; min-height:28px;">
                <div style="width:${LABEL_W}px; flex-shrink:0; font-size:0.78rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:0.75rem; cursor:pointer;" onclick="window.openActionModal('${a.id}')" title="${a.activity}">
                    ${a.activity}
                </div>
                <div style="flex:1; position:relative; height:20px;">
                    ${Array.from({ length: months.length }).map((_, i) => `<div style="position:absolute; top:0; left:${(i / months.length * 100).toFixed(1)}%; width:${(100 / months.length).toFixed(1)}%; height:100%; border-left:1px solid var(--border-subtle); opacity:0.4;"></div>`).join('')}
                    <div style="position:absolute; left:${left.toFixed(1)}%; width:${width.toFixed(1)}%; height:100%; background:${clr}; border-radius:4px; opacity:0.85; cursor:pointer; display:flex; align-items:center; padding-left:4px; font-size:0.65rem; color:#fff; font-weight:600; white-space:nowrap; overflow:hidden;" onclick="window.openActionModal('${a.id}')" title="${a.status}"></div>
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
            <div style="min-width:700px; position:relative;">
                ${headerHtml}
                ${bodyHtml || '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);font-style:italic;">No actions to display.</div>'}
                <div style="position:absolute; top:0; left:calc(${LABEL_W}px + ${todayPct.toFixed(1)}% * (1 - ${LABEL_W} / 700)); width:2px; height:100%; background:#ef4444; opacity:0.4; pointer-events:none; z-index:1;"></div>
            </div>
        </div>`;
}

// ---- MODAL OPEN/CLOSE ----
window.openActionModal = function (id) {
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

window.closeActionModal = function () {
    const overlay = document.getElementById('act-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    _actCurrentId = null;
};

window.toggleActSection = function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

function _actClearModal() {
    const fields = ['act-f-title', 'act-f-description', 'act-f-desired-outcome', 'act-f-kpi', 'act-f-due-date', 'act-f-start-date', 'act-f-predicted-length', 'act-f-resource', 'act-f-vc-progress', 'act-f-vc-blockers', 'act-f-other'];
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
        const tag = btn.textContent.trim().replace(/^[^\s]+\s/, '');
        btn.classList.toggle('active', (a.tags || []).includes(tag.trim()));
    });

    // Audience chips
    const audContainer = document.getElementById('act-f-audience-chips');
    if (audContainer) {
        audContainer.innerHTML = (a.audience || []).map(aud => _actMakeChip(aud, 'audience')).join('');
    }

    // Owner chips
    const ownContainer = document.getElementById('act-f-owner-chips');
    if (ownContainer) {
        ownContainer.innerHTML = (a.owner ? a.owner.split('+').map(o => o.trim()) : []).map(o => _actMakeOwnerChip(o)).join('');
    }

    // Todos
    const todosEl = document.getElementById('act-f-todos');
    if (todosEl) {
        todosEl.innerHTML = (a.todos || []).map(t => _actMakeTodoRow(t.id, t.completed, t.detail)).join('');
    }

    // Prereqs
    const prereqsEl = document.getElementById('act-f-prereqs');
    if (prereqsEl) {
        const allActions = window.getData('actions') || [];
        prereqsEl.innerHTML = (a.prerequisites || []).map(pid => {
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
    const colors = { 'Vant': '#ef4444', 'AET': '#3b82f6', 'AET + Vant': '#8b5cf6' };
    const clr = colors[label] || '#6b7280';
    return `<span style="background:${clr};color:#fff;border-radius:4px;padding:0.15rem 0.6rem;font-size:0.75rem;font-weight:600;display:inline-flex;align-items:center;gap:0.25rem;">
        ${label}
        <span onclick="this.parentElement.remove()" style="cursor:pointer;font-weight:700;line-height:1;opacity:0.8;">×</span>
    </span>`;
}

function _actMakeTodoRow(id, completed, detail) {
    return `<div style="display:flex;align-items:center;gap:0.5rem;" id="todo-row-${id}">
        <input type="checkbox" ${completed ? 'checked' : ''} onchange="window.toggleTodo('${id}',this.checked)" style="flex-shrink:0;cursor:pointer;">
        <span style="font-size:0.75rem;color:var(--text-tertiary);text-decoration:none;font-weight:600;width:70px;">Completed</span>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Details:</span>
        <input type="text" value="${detail || ''}" style="flex:1;padding:0.25rem 0.5rem;border:1px solid var(--border-subtle);background:var(--bg-app);color:var(--text-primary);border-radius:4px;font-size:0.8rem;" placeholder="input text">
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

window.addTodoItem = function () {
    const el = document.getElementById('act-f-todos');
    if (!el) return;
    const newId = 'new-' + Date.now();
    el.insertAdjacentHTML('beforeend', _actMakeTodoRow(newId, false, ''));
};

window.addPrereqItem = function () {
    const el = document.getElementById('act-f-prereqs');
    if (!el) return;
    const newId = 'new-' + Date.now();
    el.insertAdjacentHTML('beforeend', _actMakePrereqRow(newId, 'Sub Action (action that needs to be done before this one)'));
};

window.addAudienceChip = function () {
    const stakeholders = window.getData('stakeholders') || [];
    const name = prompt('Enter audience name (or stakeholder):', stakeholders.length ? stakeholders[0].name : '');
    if (!name) return;
    const el = document.getElementById('act-f-audience-chips');
    if (el) el.insertAdjacentHTML('beforeend', _actMakeChip(name, 'audience'));
};

window.addOwnerChip = function () {
    const val = prompt('Owner name (e.g. Vant, AET):', 'Vant');
    if (!val) return;
    const el = document.getElementById('act-f-owner-chips');
    if (el) el.insertAdjacentHTML('beforeend', _actMakeOwnerChip(val.trim()));
};

window.toggleTag = function (btn, tag) {
    btn.classList.toggle('active');
};

window.toggleTodo = function (id, checked) {
    const row = document.getElementById('todo-row-' + id);
    if (row) {
        const input = row.querySelector('input[type=text]');
        if (input) input.style.textDecoration = checked ? 'line-through' : 'none';
    }
};

window.revertActionChanges = function () {
    if (_actOriginalData) _actFillModal(_actOriginalData);
    else _actClearModal();
};

window.saveCurrentAction = function () {
    const id = _actCurrentId;
    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const getTags = () => Array.from(document.querySelectorAll('.act-tag-btn.active')).map(b => b.textContent.trim().replace(/^[^\s]*\s/, ''));
    const getOwner = () => Array.from(document.querySelectorAll('#act-f-owner-chips > span')).map(s => s.textContent.replace('×', '').trim()).join(' + ');
    const getAudience = () => Array.from(document.querySelectorAll('#act-f-audience-chips > span')).map(s => s.textContent.replace('×', '').trim());
    const getTodos = () => Array.from(document.querySelectorAll('#act-f-todos > div')).map((row, i) => ({
        id: row.id.replace('todo-row-', '') || ('t' + i),
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

window.deleteCurrentAction = function () {
    if (!_actCurrentId) return;
    if (!confirm('Delete this action? This cannot be undone.')) return;
    let actions = window.getData('actions') || [];
    actions = actions.filter(a => a.id !== _actCurrentId);
    window.updateData('actions', actions);
    window.closeActionModal();
    window.filterActions();
};


// ---- ACTION DETAIL VIEW ----

// ── Shared helpers ──────────────────────────────────────────────────

function _adetGetPrivacyLevel(a) {
    if (a.privacy && typeof a.privacy === 'object') return a.privacy.level || 'public';
    if (typeof a.privacy === 'string') {
        const map = { 'Public/Official': 'public', 'Attendees': 'attendees', 'Restricted': 'restricted', 'Custom': 'custom' };
        return map[a.privacy] || 'public';
    }
    return 'public';
}

function _adetPrivacyMeta(level) {
    return {
        public: { icon: '🌐', label: 'Public / Official', desc: 'Visible to all team members' },
        attendees: { icon: '👥', label: 'Attendees', desc: 'All linked audience members' },
        restricted: { icon: '🔒', label: 'Restricted', desc: 'Admin + creator only' },
        custom: { icon: '⚙️', label: 'Advanced / Custom', desc: 'Custom viewer/editor list' },
    }[level] || { icon: '🌐', label: 'Public / Official', desc: '' };
}

const _adetStatusColors = {
    'Pending': { bg: 'rgba(148,163,184,0.15)', color: '#64748b', border: '#94a3b8' },
    'Planned': { bg: 'rgba(129,140,248,0.15)', color: '#6366f1', border: '#818cf8' },
    'In Progress': { bg: 'rgba(96,165,250,0.15)', color: '#3b82f6', border: '#60a5fa' },
    'Completed': { bg: 'rgba(52,211,153,0.15)', color: '#059669', border: '#34d399' },
};
const _adetPriorityColors = {
    'ASAP': { bg: '#ef4444', text: '#fff' }, 'High': { bg: '#f97316', text: '#fff' },
    'Medium': { bg: '#f59e0b', text: '#fff' }, 'Low': { bg: '#64748b', text: '#fff' },
};
const _adetOwnerColors = { 'Vant': '#ef4444', 'AET': '#3b82f6', 'AET + Vant': '#8b5cf6' };

// ── Read-only renderer ───────────────────────────────────────────────

function renderActionDetail() {
    const id = window.currentActionId;
    const actions = window.getData('actions') || [];
    const a = actions.find(x => x.id === id);

    if (!a) {
        const c = document.getElementById('view-container');
        if (c) c.innerHTML = '<div style="padding:2rem;"><h2>Action not found.</h2><button class="btn-secondary" onclick="loadView(\'actions\')">← Back to Actions</button></div>';
        return;
    }

    const txt = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val || '—'; };
    const html = (elId, val) => { const el = document.getElementById(elId); if (el) el.innerHTML = val || ''; };
    const show = (elId, vis) => { const el = document.getElementById(elId); if (el) el.style.display = vis ? '' : 'none'; };

    // ── Header ──
    const bname = document.getElementById('adet-breadcrumb');
    if (bname) bname.textContent = a.activity;
    txt('adet-title', a.activity);

    const sc = _adetStatusColors[a.status] || _adetStatusColors['Pending'];
    const badge = document.getElementById('adet-status-badge');
    if (badge) {
        badge.textContent = a.status || '—';
        badge.style.color = sc.color; badge.style.background = sc.bg; badge.style.borderColor = sc.border;
    }

    // ── Definition ──
    txt('adet-description', a.description);

    const audEl = document.getElementById('adet-audience');
    if (audEl) {
        const aud = a.audience || [];
        audEl.innerHTML = aud.length > 0
            ? aud.map(s => `<span class="adet-audience-chip">🏛 ${s}</span>`).join('')
            : '<span class="adet-chip-empty">No audience linked</span>';
    }

    const ownEl = document.getElementById('adet-owner-chips');
    if (ownEl) {
        const owners = a.owner ? a.owner.split('+').map(o => o.trim()).filter(Boolean) : [];
        ownEl.innerHTML = owners.length > 0
            ? owners.map(o => {
                const clr = _adetOwnerColors[o] || '#6b7280';
                return `<span class="adet-owner-chip" style="background:${clr};">👤 ${o}</span>`;
            }).join('')
            : '<span class="adet-chip-empty">—</span>';
    }

    // ── Impact: Objective link ──
    const spine = window.getData('spine');
    const obj = (spine?.objectives || []).find(o => o.id === a.commsObjectiveId);
    const objEl = document.getElementById('adet-objective-link');
    if (objEl) {
        if (obj) {
            objEl.innerHTML = `<span style="font-size:1.1rem;">🎯</span> <span style="flex:1;">${obj.text}</span> <span class="material-symbols-outlined" style="font-size:0.9rem;color:var(--text-tertiary);flex-shrink:0;">open_in_new</span>`;
            objEl.title = 'View Strategy Spine';
            objEl.onclick = () => loadView('strategy_spine');
        } else {
            objEl.innerHTML = '<span class="adet-obj-none">No comms objective linked</span>';
            objEl.style.pointerEvents = 'none';
        }
    }

    // ── Status pills ──
    const pillsEl = document.getElementById('adet-status-selector');
    if (pillsEl) {
        const statuses = ['Pending', 'Planned', 'In Progress', 'Completed'];
        pillsEl.innerHTML = statuses.map(s => {
            const sCol = _adetStatusColors[s];
            const isActive = s === a.status;
            return `<span class="adet-status-pill-ro${isActive ? ' active' : ''}"
                style="${isActive ? `color:${sCol.color};background:${sCol.bg};border-color:${sCol.border};` : ''}">
                ${s}
            </span>`;
        }).join('');
    }

    // ── Priority ──
    const priEl = document.getElementById('adet-priority-pill');
    if (priEl && a.priority) {
        const pc = _adetPriorityColors[a.priority] || { bg: '#64748b', text: '#fff' };
        priEl.innerHTML = `<span class="adet-priority-pill" style="background:${pc.bg};color:${pc.text};">${a.priority}</span>`;
    }

    // ── Complexity dots ──
    const cplxEl = document.getElementById('adet-complexity-dots');
    if (cplxEl) {
        const n = parseInt(a.complexity || 0);
        cplxEl.innerHTML = Array.from({ length: 5 }).map((_, i) =>
            `<span class="adet-complexity-dot" style="background:${i < n ? '#6366f1' : 'var(--border-subtle)'};" title="${i + 1}/5"></span>`
        ).join('');
    }

    // ── Tags ──
    const tagsEl = document.getElementById('adet-tags');
    if (tagsEl) {
        tagsEl.innerHTML = (a.tags || []).length > 0
            ? (a.tags || []).map(t => `<span class="adet-tag-chip">${t}</span>`).join('')
            : '<span class="adet-chip-empty">No tags</span>';
    }

    // ── Advanced Status note ──
    const advRow = document.getElementById('adet-adv-status-row');
    if (advRow && a.advancedStatus) {
        advRow.style.display = 'flex';
        const isWarn = /risk|block|delay|urgent/i.test(a.advancedStatus);
        advRow.style.background = isWarn ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.1)';
        advRow.style.color = isWarn ? '#ef4444' : '#b45309';
        advRow.style.border = `1px solid ${isWarn ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'}`;
        advRow.innerHTML = `<span class="material-symbols-outlined" style="font-size:1rem;">${isWarn ? 'warning' : 'info'}</span> ${a.advancedStatus}`;
    } else if (advRow) advRow.style.display = 'none';

    // ── Desired Outcome ──
    const typeLabels = { text: 'Free text', asset: 'Asset', stakeholder_posture: 'Stakeholder posture' };
    const typePill = document.getElementById('adet-outcome-type-pill');
    if (typePill) typePill.textContent = typeLabels[a.desiredOutcomeType] || 'Free text';
    txt('adet-desired-outcome', a.desiredOutcome);

    const linkedItem = document.getElementById('adet-outcome-linked-item');
    if (linkedItem) {
        if (a.desiredOutcomeType === 'stakeholder_posture' && a.desiredPosture) {
            linkedItem.style.display = 'flex';
            const sh = (window.getData('stakeholders') || []).find(s => s.id === a.desiredOutcomeStakeholderId);
            linkedItem.innerHTML = `<span class="material-symbols-outlined" style="font-size:1rem;color:var(--energy-algae);">person</span>
                <span>Stakeholder: <strong>${sh?.name || '—'}</strong></span>
                <span style="margin-left:0.5rem;">→ Desired posture: <strong style="color:var(--energy-algae);">${a.desiredPosture}</strong></span>`;
        } else if (a.desiredOutcomeType === 'asset' && a.desiredOutcomeAsset) {
            linkedItem.style.display = 'flex';
            linkedItem.innerHTML = `<span class="material-symbols-outlined" style="font-size:1rem;color:#6366f1;">attach_file</span>
                <span>Asset: <strong>${a.desiredOutcomeAsset}</strong></span>`;
        } else linkedItem.style.display = 'none';
    }

    // ── Success Criteria ──
    txt('adet-success-criteria', a.successCriteria || a.kpiTarget);

    // ── Logistics: Due Date ──
    const granLabels = { month: 'Month', week: 'Week', day: 'Day', datetime: 'Day + Time' };
    const gran = a.timing?.granularity || 'day';
    const granPill = document.getElementById('adet-granularity-pill');
    if (granPill) granPill.textContent = granLabels[gran] || 'Day';

    let dueDisplay = '—';
    if (a.timing?.dueDateDisplay) {
        dueDisplay = a.timing.dueDateDisplay;
    } else if (a.timing?.dueDate) {
        dueDisplay = formatDate(a.timing.dueDate);
    }
    txt('adet-due-display', dueDisplay);

    // Show relative date below
    const dueDetailEl = document.getElementById('adet-due-detail');
    if (dueDetailEl) {
        const rel = relativeDate(a.timing?.dueDate);
        const dd = a.timing?.dueDetail;
        if (a.timing?.dueDate) {
            dueDetailEl.textContent = rel.text + (dd ? ' — ' + dd : '');
            dueDetailEl.style.color = rel.color;
        } else {
            dueDetailEl.textContent = dd || '';
        }
        dueDetailEl.style.display = (a.timing?.dueDate || dd) ? '' : 'none';
    }

    // ── Advanced Timing ──
    const startDateEl = document.getElementById('adet-start-date');
    if (startDateEl && a.timing?.startDate) {
        startDateEl.textContent = formatDate(a.timing.startDate);
    } else if (startDateEl) startDateEl.textContent = '—';

    txt('adet-predicted-length', a.timing?.predictedLength);

    const predEl = document.getElementById('adet-predecessor-actions');
    if (predEl) {
        const preds = a.timing?.predecessorActions || a.prerequisites || [];
        if (preds.length > 0) {
            const allActs = window.getData('actions') || [];
            predEl.innerHTML = preds.map(pid => {
                const pa = allActs.find(x => x.id === pid);
                return `<span class="adet-predecessor-chip"><span class="material-symbols-outlined" style="font-size:0.8rem;">arrow_right_alt</span>${pa?.activity || pid}</span>`;
            }).join('');
        } else predEl.innerHTML = '<span class="adet-chip-empty">None</span>';
    }

    // ── Resource Requirement ──
    txt('adet-resource', a.resourceRequirement);

    // ── To-Do List ──
    const todos = a.todos || [];
    const done = todos.filter(t => t.completed).length;
    const pct = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;
    const progText = document.getElementById('adet-todo-progress-text');
    if (progText) progText.textContent = todos.length > 0 ? `${done}/${todos.length} complete — ${pct}%` : 'No items';
    const progFill = document.getElementById('adet-todo-progress-fill');
    if (progFill) progFill.style.width = pct + '%';
    const todosEl = document.getElementById('adet-todos');
    if (todosEl) {
        todosEl.innerHTML = todos.length > 0
            ? todos.map(t => `<div class="adet-todo-item${t.completed ? ' done' : ''}">
                <span class="material-symbols-outlined adet-todo-check" style="color:${t.completed ? 'var(--energy-algae)' : 'var(--text-tertiary)'};">
                    ${t.completed ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span style="text-decoration:${t.completed ? 'line-through' : 'none'};flex:1;">${t.detail || ''}</span>
              </div>`).join('')
            : '<span class="adet-chip-empty" style="padding:0.5rem 0;">No to-do items added.</span>';
    }

    // ── Version Control ──
    const vc = a.versionControl || {};
    txt('adet-vc-version', vc.currentVersion || '—');
    txt('adet-vc-created', vc.taskCreated || '—');
    txt('adet-vc-edited', vc.lastEdited || '—');
    txt('adet-vc-who', vc.whoEdited || '—');

    const compPill = document.getElementById('adet-vc-completed-pill');
    if (compPill) {
        if (vc.dateCompleted) {
            compPill.style.display = 'block';
            compPill.textContent = `✓ Completed ${vc.dateCompleted}`;
        } else compPill.style.display = 'none';
    }

    txt('adet-vc-progress', vc.recentProgress || '—');
    txt('adet-vc-blockers', vc.currentBlockers || '—');

    // Previous versions timeline
    const prevEl = document.getElementById('adet-vc-prev-versions');
    if (prevEl) {
        const versions = vc.previousVersions || [];
        const allVersions = [...versions, { version: vc.currentVersion, note: 'Current version', who: vc.whoEdited }];
        prevEl.innerHTML = allVersions.reverse().map((v, i) => `
            <div class="adet-vc-prev-item${i === 0 ? ' latest' : ''}">
                <div class="adet-vc-prev-dot"></div>
                <div>
                    <div style="font-weight:600;color:var(--text-primary);">${v.version || '—'} ${i === 0 ? '<span style="font-size:0.7rem;color:var(--energy-algae);font-weight:700;">(current)</span>' : ''}</div>
                    <div>${v.note || ''} ${v.who ? `— by ${v.who}` : ''}</div>
                </div>
            </div>`).join('');
    }

    // ── Other ──
    txt('adet-other', a.other || '—');

    // ── Privacy ──
    const privLevel = _adetGetPrivacyLevel(a);
    const privDisplay = document.getElementById('adet-privacy-display');
    if (privDisplay) {
        const levels = ['public', 'attendees', 'restricted', 'custom'];
        const pm = _adetPrivacyMeta;
        privDisplay.innerHTML = levels.map(lv => {
            const m = pm(lv);
            return `<div class="adet-privacy-opt-ro${lv === privLevel ? ' active' : ''}">
                <span>${m.icon}</span>
                <div>
                    <div style="font-size:0.82rem;font-weight:600;">${m.label}</div>
                    <div style="font-size:0.72rem;">${m.desc}</div>
                </div>
            </div>`;
        }).join('');
    }

    const customDiv = document.getElementById('adet-privacy-custom-display');
    if (customDiv) {
        if (privLevel === 'custom' && typeof a.privacy === 'object') {
            customDiv.style.display = 'block';
            const viewers = (a.privacy.customViewers || []).join(', ') || '—';
            const editors = (a.privacy.customEditors || []).join(', ') || '—';
            customDiv.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div><div class="adet-fl" style="margin-bottom:0.3rem;">Can view</div><div style="font-size:0.85rem;">${viewers}</div></div>
                    <div><div class="adet-fl" style="margin-bottom:0.3rem;">Can edit</div><div style="font-size:0.85rem;">${editors}</div></div>
                </div>`;
        } else customDiv.style.display = 'none';
    }

    // Populate the objective dropdown in modal (now that DOM exists)
    _adetPopulateObjectiveSelect();
    _adetPopulateStakeholderSelect();
}

// ── Modal helpers ────────────────────────────────────────────────────

function _adetPopulateObjectiveSelect() {
    const sel = document.getElementById('adet-e-objective');
    if (!sel) return;
    const spine = window.getData('spine');
    sel.innerHTML = '<option value="">— No objective linked —</option>';
    (spine?.objectives || []).forEach(o => {
        sel.innerHTML += `<option value="${o.id}">🎯 ${o.text.length > 55 ? o.text.substring(0, 52) + '...' : o.text}</option>`;
    });
}

function _adetPopulateStakeholderSelect() {
    const sel = document.getElementById('adet-e-outcome-stakeholder');
    if (!sel) return;
    const stakeholders = window.getData('stakeholders') || [];
    sel.innerHTML = '<option value="">— Select stakeholder —</option>';
    stakeholders.forEach(s => { sel.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
}

function _adetMakeEditChip(label, removeId) {
    return `<span class="adet-edit-chip" id="${removeId}">
        ${label}
        <span class="adet-edit-chip-x" onclick="this.closest('span').remove()">×</span>
    </span>`;
}

function _adetMakeEditTodoRow(id, completed, detail) {
    return `<div style="display:flex;align-items:center;gap:0.5rem;" id="adet-todo-e-${id}">
        <input type="checkbox" ${completed ? 'checked' : ''} style="flex-shrink:0;cursor:pointer;width:16px;height:16px;">
        <input type="text" value="${(detail || '').replace(/"/g, '&quot;')}" placeholder="To-do item…"
            style="flex:1;padding:0.3rem 0.55rem;border:1px solid var(--border-subtle);background:var(--bg-app);color:var(--text-primary);border-radius:5px;font-size:0.82rem;font-family:inherit;">
        <button onclick="document.getElementById('adet-todo-e-${id}').remove()"
            style="background:#ef4444;border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">−</button>
    </div>`;
}

// ── window.openActionDetailEdit ──────────────────────────────────────

window.openActionDetailEdit = function () {
    const id = window.currentActionId;
    if (!id) return;
    const actions = window.getData('actions') || [];
    const a = actions.find(x => x.id === id);
    if (!a) return;
    window._adetOriginal = JSON.parse(JSON.stringify(a));

    _adetPopulateObjectiveSelect();
    _adetPopulateStakeholderSelect();

    const set = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };

    // Modal title
    const mt = document.getElementById('adet-modal-title-display');
    if (mt) mt.textContent = a.activity;

    // Definition
    set('adet-e-title', a.activity);
    set('adet-e-description', a.description);

    // Audience chips
    const audEl = document.getElementById('adet-e-audience-chips');
    if (audEl) audEl.innerHTML = (a.audience || []).map((aud, i) => _adetMakeEditChip('🏛 ' + aud, 'aud-chip-' + i)).join('');

    // Owner chips
    const ownEl = document.getElementById('adet-e-owner-chips');
    if (ownEl) {
        const owners = a.owner ? a.owner.split('+').map(o => o.trim()).filter(Boolean) : [];
        ownEl.innerHTML = owners.map((o, i) => {
            const clr = _adetOwnerColors[o] || '#6b7280';
            return `<span class="adet-edit-chip" id="own-chip-${i}" style="background:${clr};color:#fff;border-color:${clr};">👤 ${o}<span class="adet-edit-chip-x" onclick="this.closest('span').remove()">×</span></span>`;
        }).join('');
    }

    // Objective
    set('adet-e-objective', a.commsObjectiveId);

    // Status segmented control
    document.querySelectorAll('#adet-e-status-seg .adet-seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === a.status);
    });

    set('adet-e-adv-status', a.advancedStatus);
    set('adet-e-priority', a.priority || 'Medium');
    window._adetComplexity = parseInt(a.complexity || 3);
    _adetRefreshStars();

    // Tags — preset buttons
    document.querySelectorAll('.adet-tag-preset-btn').forEach(btn => {
        const tag = btn.textContent.trim().replace(/^[^\s]+\s/, '').trim();
        btn.classList.toggle('active', (a.tags || []).some(t => t.trim() === tag));
    });
    // Custom tags (non-preset)
    const presets = ['Comms', 'Financial', 'Legal', 'Strategy'];
    const customTags = (a.tags || []).filter(t => !presets.includes(t.trim()));
    const tagChipsEl = document.getElementById('adet-e-tag-chips');
    if (tagChipsEl) tagChipsEl.innerHTML = customTags.map((t, i) => _adetMakeEditChip(t, 'ctag-' + i)).join('');

    // Desired Outcome type
    const typeVal = a.desiredOutcomeType || 'text';
    document.querySelectorAll('input[name="adet-outcome-type"]').forEach(r => { r.checked = r.value === typeVal; });
    window.adetOutcomeTypeChanged();
    set('adet-e-outcome', a.desiredOutcome);
    const sh = document.getElementById('adet-e-outcome-stakeholder');
    if (sh) sh.value = a.desiredOutcomeStakeholderId || '';
    set('adet-e-outcome-posture', a.desiredPosture);
    set('adet-e-outcome-asset', a.desiredOutcomeAsset);
    set('adet-e-kpi', a.successCriteria || a.kpiTarget);

    // Due date granularity
    const gran = a.timing?.granularity || 'day';
    window._adetGranularity = gran;
    document.querySelectorAll('.adet-seg-btn[data-gran]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gran === gran);
    });
    _adetRefreshDueDateInput(gran, a.timing);
    set('adet-e-due-detail', a.timing?.dueDetail);
    set('adet-e-start', a.timing?.startDate);
    set('adet-e-length', a.timing?.predictedLength);

    // Predecessor chips
    const predEl = document.getElementById('adet-e-predecessor-chips');
    if (predEl) {
        const allActs = window.getData('actions') || [];
        const preds = a.timing?.predecessorActions || [];
        predEl.innerHTML = preds.map((pid, i) => {
            const pa = allActs.find(x => x.id === pid);
            return _adetMakeEditChip((pa?.activity || pid), 'pred-chip-' + i);
        }).join('');
        predEl.dataset.preds = JSON.stringify(preds);
    }

    set('adet-e-resource', a.resourceRequirement);

    // Todos
    const todosEl = document.getElementById('adet-e-todos');
    if (todosEl) todosEl.innerHTML = (a.todos || []).map(t => _adetMakeEditTodoRow(t.id, t.completed, t.detail)).join('');

    // VC
    const vc = a.versionControl || {};
    const vcMeta = document.getElementById('adet-e-vc-meta');
    if (vcMeta) vcMeta.innerHTML = `Version <strong>${vc.currentVersion || '—'}</strong> · Created <strong>${vc.taskCreated || '—'}</strong> · By <strong>${vc.whoEdited || '—'}</strong>`;
    set('adet-e-progress', vc.recentProgress);
    set('adet-e-blockers', vc.currentBlockers);
    const compCheck = document.getElementById('adet-e-completed-check');
    if (compCheck) compCheck.checked = !!vc.dateCompleted;
    set('adet-e-completed-date', vc.dateCompleted);

    // Other
    set('adet-e-other', a.other);

    // Privacy
    const privLevel = _adetGetPrivacyLevel(a);
    document.querySelectorAll('input[name="adet-e-priv"]').forEach(r => { r.checked = r.value === privLevel; });
    window.adetPrivacyChanged();
    if (privLevel === 'custom' && typeof a.privacy === 'object') {
        const viewEl = document.getElementById('adet-e-custom-viewers');
        const editEl = document.getElementById('adet-e-custom-editors');
        if (viewEl) viewEl.innerHTML = (a.privacy.customViewers || []).map((p, i) => _adetMakeEditChip(p, 'cv-' + i)).join('');
        if (editEl) editEl.innerHTML = (a.privacy.customEditors || []).map((p, i) => _adetMakeEditChip(p, 'ce-' + i)).join('');
    }

    const overlay = document.getElementById('adet-modal-overlay');
    if (overlay) {
        overlay.style.display = 'block';
        overlay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ── Granularity helpers ──────────────────────────────────────────────

window._adetGranularity = 'day';

function _adetRefreshDueDateInput(gran, timing) {
    const hides = ['adet-e-due-month-wrap', 'adet-e-due-date-wrap', 'adet-e-due-datetime-wrap'];
    hides.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    if (gran === 'month') {
        const wrap = document.getElementById('adet-e-due-month-wrap');
        if (wrap) wrap.style.display = '';
        const inp = document.getElementById('adet-e-due-month');
        if (inp && timing?.dueDate) inp.value = timing.dueDate.substring(0, 7);
    } else if (gran === 'datetime') {
        const wrap = document.getElementById('adet-e-due-datetime-wrap');
        if (wrap) wrap.style.display = '';
        if (timing?.dueDate) {
            const inp = document.getElementById('adet-e-due-datetime');
            if (inp) inp.value = timing.dueDate + 'T00:00';
        }
    } else {
        const wrap = document.getElementById('adet-e-due-date-wrap');
        if (wrap) wrap.style.display = '';
        const inp = document.getElementById('adet-e-due-date');
        if (inp && timing?.dueDate) inp.value = timing.dueDate;
    }
}

window.adetSetGranularity = function (btn, gran) {
    window._adetGranularity = gran;
    document.querySelectorAll('.adet-seg-btn[data-gran]').forEach(b =>
        b.classList.toggle('active', b.dataset.gran === gran));
    _adetRefreshDueDateInput(gran, null);
};

// ── Status & Complexity helpers ──────────────────────────────────────

window._adetCurrentStatus = 'Pending';
window._adetComplexity = 3;

window.adetSetStatus = function (btn, status) {
    window._adetCurrentStatus = status;
    document.querySelectorAll('#adet-e-status-seg .adet-seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.status === status));
};

window.adetSetComplexity = function (n) {
    window._adetComplexity = n;
    _adetRefreshStars();
};

function _adetRefreshStars() {
    const n = window._adetComplexity;
    document.querySelectorAll('#adet-e-complexity-stars .adet-star-btn').forEach((btn, i) =>
        btn.classList.toggle('active', i < n));
}

// ── Tag helpers ──────────────────────────────────────────────────────

window.adetTogglePresetTag = function (btn, tag) { btn.classList.toggle('active'); };

window.adetAddCustomTag = function () {
    const inp = document.getElementById('adet-e-tag-input');
    if (!inp || !inp.value.trim()) return;
    const tag = inp.value.trim();
    const chips = document.getElementById('adet-e-tag-chips');
    if (chips) chips.insertAdjacentHTML('beforeend', _adetMakeEditChip(tag, 'ctag-' + Date.now()));
    inp.value = '';
};

// ── Audience / Owner helpers ─────────────────────────────────────────

window.adetAddAudience = function () {
    const stakeholders = window.getData('stakeholders') || [];
    let name;
    if (stakeholders.length > 0) {
        const nameList = stakeholders.map(s => s.name).join('\n');
        name = prompt(`Enter audience name (stakeholder/contact):\n\nExisting stakeholders:\n${nameList}`, stakeholders[0]?.name || '');
    } else {
        name = prompt('Enter audience name (stakeholder/contact):', '');
    }
    if (!name?.trim()) return;
    const el = document.getElementById('adet-e-audience-chips');
    if (el) el.insertAdjacentHTML('beforeend', _adetMakeEditChip('🏛 ' + name.trim(), 'aud-chip-' + Date.now()));
};

window.adetAddOwner = function () {
    const name = prompt('Owner name (e.g. Vant, AET):', 'Vant');
    if (!name?.trim()) return;
    const clr = _adetOwnerColors[name.trim()] || '#6b7280';
    const el = document.getElementById('adet-e-owner-chips');
    if (el) el.insertAdjacentHTML('beforeend',
        `<span class="adet-edit-chip" id="own-chip-${Date.now()}" style="background:${clr};color:#fff;border-color:${clr};">👤 ${name.trim()}<span class="adet-edit-chip-x" onclick="this.closest('span').remove()">×</span></span>`);
};

// ── Predecessor helpers ──────────────────────────────────────────────

window.adetAddPredecessor = function () {
    const allActs = window.getData('actions') || [];
    const currentId = window.currentActionId;
    const available = allActs.filter(x => x.id !== currentId);
    if (available.length === 0) { alert('No other actions available to link.'); return; }
    const list = available.map((a, i) => `${i + 1}. ${a.activity}`).join('\n');
    const choice = prompt(`Select a preceding action (enter the number):\n\n${list}`, '1');
    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= available.length) return;
    const picked = available[idx];
    const el = document.getElementById('adet-e-predecessor-chips');
    if (el) el.insertAdjacentHTML('beforeend', _adetMakeEditChip(picked.activity, 'pred-chip-' + Date.now()));
};

// ── Todo helpers ─────────────────────────────────────────────────────

window.adetAddTodo = function () {
    const el = document.getElementById('adet-e-todos');
    if (!el) return;
    el.insertAdjacentHTML('beforeend', _adetMakeEditTodoRow('new-' + Date.now(), false, ''));
};

// ── Desired Outcome type ─────────────────────────────────────────────

window.adetOutcomeTypeChanged = function () {
    const val = document.querySelector('input[name="adet-outcome-type"]:checked')?.value || 'text';
    const pfEl = document.getElementById('adet-outcome-posture-fields');
    const afEl = document.getElementById('adet-outcome-asset-fields');
    if (pfEl) pfEl.style.display = val === 'stakeholder_posture' ? '' : 'none';
    if (afEl) afEl.style.display = val === 'asset' ? '' : 'none';
};

// ── Privacy ──────────────────────────────────────────────────────────

window.adetPrivacyChanged = function () {
    const val = document.querySelector('input[name="adet-e-priv"]:checked')?.value || 'public';
    const customEl = document.getElementById('adet-e-custom-privacy');
    if (customEl) customEl.style.display = val === 'custom' ? '' : 'none';
};

window.adetAddCustomPerson = function (role) {
    const name = prompt(`Enter name for ${role === 'viewers' ? 'viewer' : 'editor'}:`);
    if (!name?.trim()) return;
    const elId = role === 'viewers' ? 'adet-e-custom-viewers' : 'adet-e-custom-editors';
    const el = document.getElementById(elId);
    if (el) el.insertAdjacentHTML('beforeend', _adetMakeEditChip(name.trim(), 'cust-' + Date.now()));
};

// ── Accordion helper ─────────────────────────────────────────────────

window.adetToggleSection = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isOpen = el.style.display !== 'none';
    el.style.display = isOpen ? 'none' : '';
    // Rotate the chevron on the nearby toggle button
    const toggle = el.previousElementSibling;
    if (toggle) {
        const icon = toggle.querySelector('.material-symbols-outlined');
        if (icon) icon.style.transform = isOpen ? '' : 'rotate(90deg)';
    }
};

// ── Save ─────────────────────────────────────────────────────────────

window.closeActionDetailEdit = function () {
    const overlay = document.getElementById('adet-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adetRevert = function () {
    if (window._adetOriginal) window.openActionDetailEdit();
};

window.adetSave = function () {
    const id = window.currentActionId;
    if (!id) return;

    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        + ' ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Collect tags
    const presets = ['Comms', 'Financial', 'Legal', 'Strategy'];
    const activePre = Array.from(document.querySelectorAll('.adet-tag-preset-btn.active'))
        .map(b => b.textContent.trim().replace(/^[^\s]+\s/, '').trim());
    const customTags = Array.from(document.querySelectorAll('#adet-e-tag-chips .adet-edit-chip'))
        .map(c => c.textContent.replace('×', '').trim());
    const allTags = [...new Set([...activePre, ...customTags])];

    // Collect audience chips (strip icon prefix)
    const getAudience = () => Array.from(document.querySelectorAll('#adet-e-audience-chips .adet-edit-chip'))
        .map(c => c.textContent.replace('×', '').replace(/^[^\s]+\s/, '').trim());

    // Collect owner chips
    const getOwner = () => Array.from(document.querySelectorAll('#adet-e-owner-chips .adet-edit-chip'))
        .map(c => c.textContent.replace('×', '').replace(/^👤\s/, '').trim())
        .join(' + ');

    // Collect todos
    const getTodos = () => Array.from(document.querySelectorAll('[id^="adet-todo-e-"]')).map((row, i) => ({
        id: row.id.replace('adet-todo-e-', '') || 't' + i,
        completed: row.querySelector('input[type=checkbox]')?.checked || false,
        detail: row.querySelector('input[type=text]')?.value || ''
    }));

    // Due date
    const gran = window._adetGranularity || 'day';
    let dueDate = '', dueDateDisplay = '';
    if (gran === 'month') {
        const mv = document.getElementById('adet-e-due-month')?.value;
        if (mv) { dueDate = mv + '-01'; const d = new Date(dueDate + 'T00:00'); dueDateDisplay = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
    } else if (gran === 'datetime') {
        const dtv = document.getElementById('adet-e-due-datetime')?.value;
        if (dtv) { dueDate = dtv.substring(0, 10); dueDateDisplay = new Date(dtv).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    } else {
        const dv = document.getElementById('adet-e-due-date')?.value;
        if (dv) { dueDate = dv; const d = new Date(dv + 'T00:00'); dueDateDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    }

    // Privacy
    const privLevel = document.querySelector('input[name="adet-e-priv"]:checked')?.value || 'public';
    const customViewers = Array.from(document.querySelectorAll('#adet-e-custom-viewers .adet-edit-chip')).map(c => c.textContent.replace('×', '').trim());
    const customEditors = Array.from(document.querySelectorAll('#adet-e-custom-editors .adet-edit-chip')).map(c => c.textContent.replace('×', '').trim());

    // Current status from segmented control
    const currentStatus = document.querySelector('#adet-e-status-seg .adet-seg-btn.active')?.dataset.status
        || document.querySelector('[value="status"]')?.value || 'Pending';

    const actions = window.getData('actions') || [];
    const idx = actions.findIndex(x => x.id === id);
    if (idx === -1) return;
    const orig = actions[idx];

    actions[idx] = {
        ...orig,
        activity: document.getElementById('adet-e-title')?.value || orig.activity,
        description: document.getElementById('adet-e-description')?.value || '',
        owner: getOwner() || orig.owner,
        audience: getAudience(),
        status: currentStatus,
        advancedStatus: document.getElementById('adet-e-adv-status')?.value || '',
        tags: allTags,
        priority: document.getElementById('adet-e-priority')?.value || orig.priority,
        complexity: String(window._adetComplexity || 3),
        commsObjectiveId: document.getElementById('adet-e-objective')?.value || '',
        desiredOutcome: document.getElementById('adet-e-outcome')?.value || '',
        desiredOutcomeType: document.querySelector('input[name="adet-outcome-type"]:checked')?.value || 'text',
        desiredOutcomeStakeholderId: document.getElementById('adet-e-outcome-stakeholder')?.value || '',
        desiredPosture: document.getElementById('adet-e-outcome-posture')?.value || '',
        desiredOutcomeAsset: document.getElementById('adet-e-outcome-asset')?.value || '',
        successCriteria: document.getElementById('adet-e-kpi')?.value || '',
        kpiTarget: document.getElementById('adet-e-kpi')?.value || '',
        timing: {
            granularity: gran,
            dueDate, dueDateDisplay,
            dueDetail: document.getElementById('adet-e-due-detail')?.value || '',
            startDate: document.getElementById('adet-e-start')?.value || '',
            predecessorActions: orig.timing?.predecessorActions || [],
            predictedLength: document.getElementById('adet-e-length')?.value || ''
        },
        resourceRequirement: document.getElementById('adet-e-resource')?.value || '',
        todos: getTodos(),
        other: document.getElementById('adet-e-other')?.value || '',
        privacy: { level: privLevel, customViewers, customEditors },
        versionControl: {
            ...(orig.versionControl || {}),
            currentVersion: nowStr,
            recentProgress: document.getElementById('adet-e-progress')?.value || '',
            currentBlockers: document.getElementById('adet-e-blockers')?.value || '',
            lastEdited: nowStr,
            whoEdited: 'Portal User',
            dateCompleted: document.getElementById('adet-e-completed-check')?.checked
                ? (document.getElementById('adet-e-completed-date')?.value || nowStr.split(' ')[0]) : '',
            previousVersions: [
                ...(orig.versionControl?.previousVersions || []),
                { version: orig.versionControl?.currentVersion || nowStr, note: 'Auto-saved version', who: orig.versionControl?.whoEdited || '—' }
            ]
        }
    };

    window.updateData('actions', actions);
    window.closeActionDetailEdit();
    renderActionDetail();
};

window.adetDelete = function () {
    const id = window.currentActionId;
    if (!id) return;
    if (!confirm('Delete this action? This cannot be undone.')) return;
    let actions = window.getData('actions') || [];
    actions = actions.filter(x => x.id !== id);
    window.updateData('actions', actions);
    window.closeActionDetailEdit();
    loadView('actions');
};




// ---- APPROVALS PAGE ----

function renderApprovals() {
    if (typeof window._doRenderApprovals === 'function') {
        window._doRenderApprovals();
    } else {
        console.log('[Approvals] Page loaded (but async renderer not found)');
    }
}

window.switchApprovalTab = function (tab, btn) {
    // Toggle tab content
    const aiView = document.getElementById('appr-view-ai');
    const userView = document.getElementById('appr-view-user');
    if (aiView) aiView.style.display = tab === 'ai' ? 'block' : 'none';
    if (userView) userView.style.display = tab === 'user' ? 'block' : 'none';

    // Toggle tab styles
    document.querySelectorAll('.appr-tab').forEach(t => {
        const isActive = t.dataset.tab === tab;
        t.style.borderBottomColor = isActive ? 'var(--energy-algae)' : 'transparent';
        t.style.color = isActive ? 'var(--text-primary)' : 'var(--text-tertiary)';
        t.style.fontWeight = isActive ? '600' : '500';
        t.classList.toggle('active', isActive);
    });
};

// ---- STRATEGY SPINE (inline card-driven editing) ----

let isSpineEditMode = false;
let _spineCards = null;
let _spinePendingReorders = [];

async function renderStrategySpine() {
    isSpineEditMode = false;
    _spineCards = await window.fetchContentCards(1);
    renderSpineCards();
    setupSpineEditToggle();
}

function renderSpineCards() {
    const container = document.getElementById('strategy-cards-container');
    if (!container) return;
    const spine = window.getData('spine');
    const cards = (_spineCards || []).filter(c => c.cc_active !== false).sort((a, b) => a.cc_order - b.cc_order);
    const topCards = cards.filter(c => !c.cc_parent_card_id);

    // Group into sections with width inheritance
    const sections = [];
    let cur = null;
    topCards.forEach(card => {
        if (card.cc_card_type === 'section') {
            cur = { sectionCard: card, width: card.cc_width || 'full', cards: [] };
            sections.push(cur);
        } else {
            if (!cur) { cur = { sectionCard: null, width: 'full', cards: [] }; sections.push(cur); }
            cur.cards.push(card);
        }
    });

    let html = '';
    sections.forEach(section => {
        const sc = section.sectionCard;
        if (sc) {
            html += `<div class="spine-section-row" data-card-id="${sc.cc_id}" style="display:flex;justify-content:space-between;align-items:center;margin:2rem 0 1rem;">
                <h3 class="spine-section-title" data-card-id="${sc.cc_id}" style="color:var(--text-tertiary);margin:0;">${sc.cc_title||''}</h3>
                <div class="spine-edit-ctrl" style="display:none;gap:0.5rem;align-items:center;">
                    <select class="spine-width-select" data-card-id="${sc.cc_id}" style="display:none;font-size:0.75rem;padding:0.15rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);">
                        <option value="full"${sc.cc_width==='full'?' selected':''}>Full</option>
                        <option value="half"${sc.cc_width==='half'?' selected':''}>Half</option>
                        <option value="third"${sc.cc_width==='third'?' selected':''}>Third</option>
                        <option value="quarter"${sc.cc_width==='quarter'?' selected':''}>Quarter</option>
                    </select>
                    <button onclick="window.spineMoveCard(${sc.cc_id},-1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move up"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
                    <button onclick="window.spineMoveCard(${sc.cc_id},1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move down"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
                    <button onclick="window.spineDeleteCard(${sc.cc_id})" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);padding:2px;" title="Remove"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
                </div>
            </div>`;
        }

        // Render content cards in this section
        const gridCols = section.width === 'half' ? 'repeat(2,1fr)' :
                         section.width === 'third' ? 'repeat(3,1fr)' :
                         section.width === 'quarter' ? 'repeat(4,1fr)' : '1fr';
        if (section.cards.length > 0) {
            html += `<div style="display:grid;grid-template-columns:${gridCols};gap:1.5rem;margin-bottom:1.5rem;">`;
            section.cards.forEach(c => {
                const editCtrl = `<div class="spine-edit-ctrl" style="display:none;position:absolute;right:0.5rem;top:0.5rem;gap:0.25rem;align-items:center;z-index:2;">
                    <button onclick="event.stopPropagation();window.spineMoveCard(${c.cc_id},-1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
                    <button onclick="event.stopPropagation();window.spineMoveCard(${c.cc_id},1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
                    <button onclick="event.stopPropagation();window.spineDeleteCard(${c.cc_id})" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
                </div>`;
                // objectives_link card type: render objectives from tbl_strategy_objective
                if (c.cc_card_type === 'objectives_link' && spine && spine.objectives) {
                    html += `<div class="card" style="position:relative;padding:1.5rem;" data-card-id="${c.cc_id}">${editCtrl}`;
                    html += renderSpineObjectives(spine.objectives, false);
                    html += '</div>';
                } else {
                    html += `<div class="card" style="position:relative;padding:1.5rem;" data-card-id="${c.cc_id}">
                        ${editCtrl}
                        <h4 class="spine-card-title" data-card-id="${c.cc_id}" style="margin:0 0 0.75rem 0;">${c.cc_title||''}</h4>
                        <div class="spine-card-content" data-card-id="${c.cc_id}" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${c.cc_content||''}</div>
                    </div>`;
                }
            });
            html += '</div>';
        }
    });

    // Add card/section buttons (visible in edit mode)
    html += `<div class="spine-edit-ctrl" style="display:none;gap:0.5rem;margin-top:1rem;">
        <button class="btn-secondary" onclick="window.spineAddSection()" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Section</button>
        <button class="btn-secondary" onclick="window.spineAddCard()" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Card</button>
    </div>`;

    container.innerHTML = html;
}

function renderSpineObjectives(objectives, wrapInCard = true) {
    let html = wrapInCard ? '<div class="card" style="margin-bottom:1.5rem;">' : '';
    html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;">';
    objectives.forEach((o, idx) => {
        html += `<li class="spine-obj-li" data-obj-id="${o.id}" style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.03);padding:0.5rem 0.8rem;border-radius:6px;gap:1rem;transition:background 0.15s,transform 0.15s;cursor:default;" onmouseenter="this.style.background='rgba(0,0,0,0.07)';this.style.transform='translateX(2px)'" onmouseleave="this.style.background='rgba(0,0,0,0.03)';this.style.transform='none'">
            <div style="display:flex;align-items:center;gap:0.5rem;flex:1;">
                <span style="color:var(--energy-alert);">🎯</span>
                <span class="spine-obj-text" data-obj-id="${o.id}">${o.text}</span>
            </div>
            <div class="spine-edit-ctrl" style="display:none;gap:0.25rem;align-items:center;">
                <button onclick="window.spineMoveObj('${o.id}',-1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);opacity:${idx===0?'0.2':'1'};" ${idx===0?'disabled':''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_upward</span></button>
                <button onclick="window.spineMoveObj('${o.id}',1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);opacity:${idx===objectives.length-1?'0.2':'1'};" ${idx===objectives.length-1?'disabled':''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_downward</span></button>
                <button onclick="window.spineDeleteObj('${o.id}')" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);"><span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span></button>
            </div>
        </li>`;
    });
    html += '</ul>';
    html += '<button class="btn-secondary spine-edit-ctrl" onclick="window.spineAddObj()" style="display:none;font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.5rem;">+ Add Objective</button>';
    if (wrapInCard) html += '</div>';
    return html;
}

function setupSpineEditToggle() {
    const old = document.getElementById('spine-edit-toggle');
    if (!old) return;
    const editToggle = old.cloneNode(true);
    old.parentNode.replaceChild(editToggle, old);

    // Wire cancel button
    const cancelBtn = document.getElementById('spine-cancel-btn');
    if (cancelBtn) {
        const freshCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
        freshCancel.addEventListener('click', async () => {
            isSpineEditMode = false;
            _spinePendingReorders = [];
            editToggle.style.background = ''; editToggle.style.color = '';
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            freshCancel.style.display = 'none';
            // Re-fetch and re-render (discard local changes)
            _spineCards = await window.fetchContentCards(1);
            renderSpineCards(); setupSpineEditToggle();
        });
    }

    editToggle.addEventListener('click', async () => {
        isSpineEditMode = !isSpineEditMode;
        editToggle.style.background = isSpineEditMode ? 'var(--energy-algae)' : '';
        editToggle.style.color = isSpineEditMode ? '#000' : '';
        editToggle.innerHTML = isSpineEditMode
            ? '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done'
            : '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';

        // Show/hide cancel button
        const cb = document.getElementById('spine-cancel-btn');
        if (cb) cb.style.display = isSpineEditMode ? 'flex' : 'none';

        if (isSpineEditMode) {
            // Show edit controls
            document.querySelectorAll('.spine-edit-ctrl').forEach(el => { el.style.display = 'flex'; });
            document.querySelectorAll('.spine-width-select').forEach(el => { el.style.display = 'inline-block'; });

            // Section titles → inputs
            document.querySelectorAll('.spine-section-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'spine-edit-sec-title'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:1.17rem;font-weight:600;color:var(--text-tertiary);background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.25rem 0.5rem;';
                el.replaceWith(input);
            });

            // Card titles → inputs
            document.querySelectorAll('.spine-card-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'spine-edit-card-title'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:1.1rem;font-weight:600;color:var(--text-primary);background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.3rem 0.5rem;width:100%;margin-bottom:0.5rem;';
                el.replaceWith(input);
            });

            // Card content → textareas
            document.querySelectorAll('.spine-card-content').forEach(el => {
                const ta = document.createElement('textarea');
                ta.value = el.textContent; ta.className = 'spine-edit-card-content'; ta.dataset.cardId = el.dataset.cardId;
                ta.style.cssText = 'width:100%;min-height:150px;resize:vertical;padding:0.5rem;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);border-radius:4px;font-family:Inter,sans-serif;font-size:0.9rem;line-height:1.6;';
                el.replaceWith(ta);
            });

            // Objective text → inputs
            document.querySelectorAll('.spine-obj-text').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'spine-edit-obj-text'; input.dataset.objId = el.dataset.objId;
                input.style.cssText = 'flex:1;padding:0.3rem 0.5rem;background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;font-size:0.95rem;color:var(--text-primary);';
                el.replaceWith(input);
            });
        } else {
            // "Done" — show loading, persist everything
            editToggle.disabled = true;
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;animation:spin 1s linear infinite;">autorenew</span> Saving...';
            try {
                await persistSpineEdits();
            } finally {
                editToggle.disabled = false;
                editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            }
        }
    });
}

async function persistSpineEdits() {
    const spine = window.getData('spine');
    const updates = [];

    // Collect section title & width changes
    document.querySelectorAll('.spine-edit-sec-title').forEach(input => {
        const id = parseInt(input.dataset.cardId);
        if (id) updates.push({ ccId: id, fields: { cc_title: input.value } });
    });
    document.querySelectorAll('.spine-width-select').forEach(sel => {
        const id = parseInt(sel.dataset.cardId);
        if (id) {
            const existing = updates.find(u => u.ccId === id);
            if (existing) existing.fields.cc_width = sel.value;
            else updates.push({ ccId: id, fields: { cc_width: sel.value } });
        }
    });

    // Collect card title + content changes
    document.querySelectorAll('.spine-edit-card-title').forEach(input => {
        const id = parseInt(input.dataset.cardId);
        if (id) updates.push({ ccId: id, fields: { cc_title: input.value } });
    });
    document.querySelectorAll('.spine-edit-card-content').forEach(ta => {
        const id = parseInt(ta.dataset.cardId);
        if (id) {
            const existing = updates.find(u => u.ccId === id);
            if (existing) existing.fields.cc_content = ta.value;
            else updates.push({ ccId: id, fields: { cc_content: ta.value } });
        }
    });

    // Persist card updates
    if (window.updateContentCard && updates.length > 0) {
        for (const { ccId, fields } of updates) {
            await window.updateContentCard(ccId, fields);
        }
        console.log('[Strategy] Persisted', updates.length, 'card updates');
    }

    // Persist objective text changes
    const objInputs = document.querySelectorAll('.spine-edit-obj-text');
    for (const input of objInputs) {
        const id = input.dataset.objId;
        const soId = parseInt(id.replace('obj', ''));
        if (soId && window.updateStrategyObjective) {
            await window.updateStrategyObjective(soId, input.value);
        }
        if (spine) {
            const obj = spine.objectives.find(o => o.id === id);
            if (obj) obj.text = input.value;
        }
    }
    if (spine) window.updateData('spine', spine);

    // Persist any pending reorder changes
    if (window.reorderContentCards && _spinePendingReorders.length > 0) {
        await window.reorderContentCards(_spinePendingReorders);
        console.log('[Strategy] Persisted', _spinePendingReorders.length, 'reorder updates');
        _spinePendingReorders = [];
    }

    // Refresh spine cache and re-render
    _spineCards = await window.fetchContentCards(1);
    // Also refresh spine data for objectives
    const freshSpine = await window.getData('spine');
    renderSpineCards();
    setupSpineEditToggle();
}

// ---- STRATEGY CARD OPERATIONS ----

window.spineMoveCard = function (ccId, direction) {
    if (!_spineCards) return;
    const topCards = _spineCards.filter(c => !c.cc_parent_card_id && c.cc_active !== false).sort((a, b) => a.cc_order - b.cc_order);
    const idx = topCards.findIndex(c => c.cc_id === ccId);
    if (idx === -1) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= topCards.length) return;
    const tmpOrder = topCards[idx].cc_order;
    topCards[idx].cc_order = topCards[swapIdx].cc_order;
    topCards[swapIdx].cc_order = tmpOrder;
    // Track pending reorders (will be persisted on Done)
    _spinePendingReorders.push(
        { ccId: topCards[idx].cc_id, newOrder: topCards[idx].cc_order },
        { ccId: topCards[swapIdx].cc_id, newOrder: topCards[swapIdx].cc_order }
    );
    renderSpineCards();
    setupSpineEditToggle();
    if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); }
};

window.spineDeleteCard = async function (ccId) {
    if (!confirm('Remove this card?')) return;
    if (window.softDeleteContentCard) await window.softDeleteContentCard(ccId);
    _spineCards = (_spineCards || []).filter(c => c.cc_id !== ccId);
    // Also update spine cache for pillars
    const spine = window.getData('spine');
    if (spine) { spine.pillars = spine.pillars.filter(p => p.id !== 'p' + ccId); window.updateData('spine', spine); }
    renderSpineCards(); setupSpineEditToggle();
    if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); }
};

window.spineAddSection = async function () {
    const maxOrder = (_spineCards || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const card = await window.insertContentCard({ cc_page_id: 1, cc_card_type: 'section', cc_title: 'New Section', cc_width: 'full', cc_order: maxOrder + 1 });
        if (card) { _spineCards.push(card); renderSpineCards(); setupSpineEditToggle(); if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); } }
    }
};

window.spineAddCard = async function () {
    const maxOrder = (_spineCards || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const card = await window.insertContentCard({ cc_page_id: 1, cc_card_type: 'card', cc_title: 'New Card', cc_content: '', cc_width: 'full', cc_order: maxOrder + 1 });
        if (card) { _spineCards.push(card); renderSpineCards(); setupSpineEditToggle(); if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); } }
    }
};

window.spineMoveObj = function (id, dir) {
    const spine = window.getData('spine');
    if (!spine) return;
    const idx = spine.objectives.findIndex(o => o.id === id);
    if (idx === -1) return;
    if (dir === -1 && idx > 0) { [spine.objectives[idx], spine.objectives[idx-1]] = [spine.objectives[idx-1], spine.objectives[idx]]; }
    else if (dir === 1 && idx < spine.objectives.length - 1) { [spine.objectives[idx], spine.objectives[idx+1]] = [spine.objectives[idx+1], spine.objectives[idx]]; }
    window.updateData('spine', spine);
    renderSpineCards(); setupSpineEditToggle();
    if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); }
};

window.spineDeleteObj = async function (id) {
    if (!confirm('Remove this objective?')) return;
    const spine = window.getData('spine');
    if (!spine) return;
    spine.objectives = spine.objectives.filter(o => o.id !== id);
    const soId = parseInt(id.replace('obj', ''));
    if (soId && window.softDeleteStrategyObjective) await window.softDeleteStrategyObjective(soId);
    window.updateData('spine', spine);
    renderSpineCards(); setupSpineEditToggle();
    if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); }
};

window.spineAddObj = async function () {
    const spine = window.getData('spine');
    if (!spine) return;
    const order = spine.objectives.length + 1;
    if (window.insertStrategyObjective) {
        const row = await window.insertStrategyObjective('New Objective', order);
        if (row) { spine.objectives.push({ id: 'obj' + row.so_id, text: 'New Objective' }); }
    } else { spine.objectives.push({ id: 'obj' + Date.now(), text: 'New Objective' }); }
    window.updateData('spine', spine);
    renderSpineCards(); setupSpineEditToggle();
    if (isSpineEditMode) { isSpineEditMode = false; document.getElementById('spine-edit-toggle')?.click(); }
};










// ---- MESSAGING & Q&As (Card-driven, replaces Knowledge Bank) ----

let isMsgEditMode = false;
let _msgCards = null;
let _msgPendingReorders = [];

async function renderMessaging() {
    isMsgEditMode = false;
    if (!_msgCards && window.fetchContentCards) {
        _msgCards = await window.fetchContentCards(2);
    }
    if (!_msgCards || _msgCards.length === 0) {
        renderMessagingFromMock();
        return;
    }
    renderMsgCards(_msgCards);
    setupMsgEditToggle();
}

function renderMsgCards(cards) {
    const container = document.getElementById('messaging-cards-container');
    if (!container) return;
    const topCards = cards.filter(c => !c.cc_parent_card_id).sort((a, b) => a.cc_order - b.cc_order);
    const childMap = {};
    cards.filter(c => c.cc_parent_card_id).forEach(c => {
        if (!childMap[c.cc_parent_card_id]) childMap[c.cc_parent_card_id] = [];
        childMap[c.cc_parent_card_id].push(c);
    });

    // Build sections with width inheritance
    const sections = [];
    let cur = null;
    topCards.forEach(card => {
        if (card.cc_card_type === 'section') {
            cur = { sectionCard: card, title: card.cc_title, width: card.cc_width || 'full', cards: [] };
            sections.push(cur);
        } else if (cur) {
            cur.cards.push(card);
        } else {
            if (!sections.length) sections.push({ sectionCard: null, title: null, width: 'full', cards: [] });
            sections[0].cards.push(card);
        }
    });

    let html = '';
    sections.forEach(section => {
        const secId = section.sectionCard ? section.sectionCard.cc_id : null;
        if (section.title) {
            const sc = section.sectionCard;
            const editControls = `<div class="msg-edit-ctrl" style="display:none;gap:0.5rem;align-items:center;">
                <select class="msg-width-select" data-card-id="${secId}" style="display:none;font-size:0.75rem;padding:0.15rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);">
                    <option value="full"${section.width==='full'?' selected':''}>Full</option>
                    <option value="half"${section.width==='half'?' selected':''}>Half</option>
                    <option value="third"${section.width==='third'?' selected':''}>Third</option>
                    <option value="quarter"${section.width==='quarter'?' selected':''}>Quarter</option>
                </select>
                <button onclick="window.msgMoveCard(${secId},-1)" class="btn-secondary" style="padding:0.15rem 0.3rem;font-size:0.7rem;" title="Move up"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
                <button onclick="window.msgMoveCard(${secId},1)" class="btn-secondary" style="padding:0.15rem 0.3rem;font-size:0.7rem;" title="Move down"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
                <button onclick="window.msgDeleteCard(${secId})" class="btn-secondary" style="padding:0.15rem 0.3rem;font-size:0.7rem;color:var(--energy-alert);" title="Remove section"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
            </div>`;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;margin-top:2rem;" data-section-id="${secId}">
                <h3 class="msg-section-title" data-card-id="${secId}" style="color:var(--text-tertiary);margin:0;">${section.title}</h3>
                ${editControls}
            </div>`;
        }

        // Section width determines grid layout for child cards
        const gridCols = section.width === 'half' ? 'repeat(2,1fr)' :
                         section.width === 'third' ? 'repeat(3,1fr)' :
                         section.width === 'quarter' ? 'repeat(4,1fr)' : '1fr';
        
        const st = (section.title || '').toLowerCase();
        html += `<div style="display:grid;grid-template-columns:${gridCols};gap:1.5rem;margin-bottom:3rem;">`;
        section.cards.forEach(c => {
            const editWrap = `<div class="msg-edit-ctrl" style="display:none;position:absolute;right:0.5rem;top:0.5rem;gap:0.25rem;align-items:center;z-index:2;">
                <button onclick="event.stopPropagation();window.msgMoveCard(${c.cc_id},-1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move up"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
                <button onclick="event.stopPropagation();window.msgMoveCard(${c.cc_id},1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move down"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
                <button onclick="event.stopPropagation();window.msgDeleteCard(${c.cc_id})" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);padding:2px;" title="Remove"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
            </div>`;
            if (st.includes('faq')) {
                html += renderFaqCard(c, editWrap);
            } else if (st.includes('audience')) {
                html += renderAudienceCard(c, editWrap);
            } else {
                html += renderKeyMessageCard(c, childMap[c.cc_id] || [], editWrap);
            }
        });
        html += '</div>';
    });

    // Add card/section buttons (visible in edit mode)
    html += `<div class="msg-edit-ctrl" style="display:none;gap:0.5rem;margin-top:1rem;">
        <button class="btn-secondary" onclick="window.msgAddSection()" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Section</button>
        <button class="btn-secondary" onclick="window.msgAddCard()" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Card</button>
    </div>`;

    container.innerHTML = html;
}

function renderKeyMessageCard(card, children, editWrap) {
    let childHtml = '';
    children.sort((a, b) => a.cc_order - b.cc_order).forEach(child => {
        childHtml += `<div id="msg-accordion-${child.cc_id}" style="border:1px solid var(--border-subtle);border-radius:8px;padding:0.75rem;cursor:pointer;transition:all 0.2s;margin-top:0.5rem;" onclick="window.toggleMsgAccordion(${child.cc_id})">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="msg-editable-title" data-card-id="${child.cc_id}" style="font-size:0.9rem;font-weight:500;">${child.cc_title}</span>
                <span id="msg-icon-${child.cc_id}" class="material-symbols-outlined" style="font-size:1.2rem;transition:transform 0.2s;transform:rotate(0deg);">arrow_right</span>
            </div>
            <div id="msg-content-${child.cc_id}" style="display:none;margin-top:1rem;">
                <div class="msg-editable-content" data-card-id="${child.cc_id}" style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap;">${child.cc_content || ''}</div>
            </div>
        </div>`;
    });
    return `<div class="card" style="position:relative;background:var(--bg-surface);padding:1.5rem;display:flex;flex-direction:column;justify-content:flex-start;border:1px solid var(--border-subtle);border-radius:12px;">${editWrap||''}<h4 class="msg-editable-title" data-card-id="${card.cc_id}" style="margin:0 0 0.75rem 0;font-size:1.1rem;color:var(--text-primary);">${card.cc_title}</h4><div class="msg-editable-content" data-card-id="${card.cc_id}" style="font-size:0.95rem;color:var(--text-secondary);margin:0 0 1.5rem 0;white-space:pre-wrap;">${card.cc_content || ''}</div>${childHtml}</div>`;
}

function renderFaqCard(card, editWrap) {
    return `<div class="card" style="position:relative;background:var(--bg-surface);outline:1px solid var(--border-subtle);border-radius:12px;overflow:hidden;cursor:pointer;" onclick="window.toggleMsgFaq(${card.cc_id})">${editWrap||''}<div id="msg-faq-header-${card.cc_id}" style="padding:0.75rem 1.5rem;display:flex;justify-content:space-between;align-items:center;font-weight:500;font-size:0.95rem;"><span class="msg-editable-title" data-card-id="${card.cc_id}" style="padding-right:2rem;">${card.cc_title}</span><span id="msg-faq-icon-${card.cc_id}" class="material-symbols-outlined" style="font-size:1.5rem;transition:transform 0.2s;transform:rotate(0deg);">arrow_right</span></div><div id="msg-faq-content-${card.cc_id}" style="display:none;padding:0 1.5rem 1.5rem;border-top:1px solid var(--border-subtle);"><p class="msg-editable-content" data-card-id="${card.cc_id}" style="margin-top:1rem;font-size:0.9rem;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap;">${card.cc_content || ''}</p></div></div>`;
}

function renderAudienceCard(card, editWrap) {
    const sId = card.cc_stakeholder_original_id;
    const click = sId ? `onclick="window.currentStakeholderId='${sId}';loadView('stakeholder_detail');history.pushState(null,'','#stakeholder_detail')"` : '';
    const cur = sId ? 'cursor:pointer;' : '';
    return `<div class="card" style="position:relative;border:1px solid var(--border-subtle);border-radius:12px;padding:1.5rem;background:var(--bg-surface);${cur}" ${click}>${editWrap||''}<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;color:var(--text-primary);font-weight:600;"><span class="material-symbols-outlined" style="color:var(--energy-algae);">groups</span> <span class="msg-editable-title" data-card-id="${card.cc_id}">${card.cc_title}</span>${sId ? '<span class="material-symbols-outlined" style="font-size:1rem;color:var(--text-tertiary);margin-left:auto;">open_in_new</span>' : ''}</div><p class="msg-editable-content" data-card-id="${card.cc_id}" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">${card.cc_content || ''}</p></div>`;
}

function renderMessagingFromMock() {
    const kb = window.getData('knowledgeBank');
    if (!kb) return;
    const fakeCards = [];
    let order = 1;
    fakeCards.push({ cc_id: 900, cc_card_type: 'section', cc_title: 'Project Key Messages', cc_order: order++ });
    (kb.keyMessages || []).forEach(km => {
        const pid = 900 + order;
        fakeCards.push({ cc_id: pid, cc_card_type: 'card', cc_title: km.title, cc_content: km.message, cc_order: order++ });
        fakeCards.push({ cc_id: 900 + order, cc_card_type: 'card', cc_title: 'Proof Points', cc_content: km.proofPoints.join('\n'), cc_order: order++, cc_is_collapsible: true, cc_parent_card_id: pid });
    });
    fakeCards.push({ cc_id: 900 + order, cc_card_type: 'section', cc_title: 'FAQs', cc_order: order++ });
    (kb.faqs || []).forEach(f => {
        fakeCards.push({ cc_id: 900 + order, cc_card_type: 'card', cc_title: f.question, cc_content: f.answer, cc_order: order++, cc_is_collapsible: true });
    });
    fakeCards.push({ cc_id: 900 + order, cc_card_type: 'section', cc_title: 'Key Audience Specific Messages', cc_order: order++ });
    (kb.audienceMessages || []).forEach(a => {
        fakeCards.push({ cc_id: 900 + order, cc_card_type: 'card', cc_title: a.title, cc_content: a.text, cc_order: order++ });
    });
    renderMsgCards(fakeCards);
    setupMsgEditToggle();
}

window.toggleMsgAccordion = function (id) {
    if (isMsgEditMode) return;
    const content = document.getElementById('msg-content-' + id);
    const icon = document.getElementById('msg-icon-' + id);
    const el = document.getElementById('msg-accordion-' + id);
    if (!content) return;
    if (content.style.display === 'none') {
        content.style.display = 'block'; icon.style.transform = 'rotate(90deg)'; el.style.background = 'var(--bg-app)';
    } else {
        content.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; el.style.background = 'transparent';
    }
};

window.toggleMsgFaq = function (id) {
    if (isMsgEditMode) return;
    const content = document.getElementById('msg-faq-content-' + id);
    const icon = document.getElementById('msg-faq-icon-' + id);
    const header = document.getElementById('msg-faq-header-' + id);
    if (!content) return;
    if (content.style.display === 'none') {
        content.style.display = 'block'; icon.style.transform = 'rotate(90deg)'; if (header) header.style.fontWeight = '600';
    } else {
        content.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; if (header) header.style.fontWeight = '500';
    }
};

function setupMsgEditToggle() {
    const old = document.getElementById('msg-edit-toggle');
    if (!old) return;
    const editToggle = old.cloneNode(true);
    old.parentNode.replaceChild(editToggle, old);

    // Wire cancel button
    const cancelBtn = document.getElementById('msg-cancel-btn');
    if (cancelBtn) {
        const freshCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
        freshCancel.addEventListener('click', async () => {
            isMsgEditMode = false;
            _msgPendingReorders = [];
            editToggle.style.background = ''; editToggle.style.color = '';
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            freshCancel.style.display = 'none';
            _msgCards = await window.fetchContentCards(2);
            if (_msgCards && _msgCards.length > 0) { renderMsgCards(_msgCards); setupMsgEditToggle(); }
        });
    }

    editToggle.addEventListener('click', async () => {
        isMsgEditMode = !isMsgEditMode;
        editToggle.style.background = isMsgEditMode ? 'var(--energy-algae)' : '';
        editToggle.style.color = isMsgEditMode ? '#000' : '';
        editToggle.innerHTML = isMsgEditMode
            ? '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done'
            : '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';

        // Show/hide cancel button
        const cb = document.getElementById('msg-cancel-btn');
        if (cb) cb.style.display = isMsgEditMode ? 'flex' : 'none';

        if (isMsgEditMode) {
            // Show edit controls + width selects
            document.querySelectorAll('.msg-edit-ctrl').forEach(el => { el.style.display = 'flex'; });
            document.querySelectorAll('.msg-width-select').forEach(el => { el.style.display = 'inline-block'; });

            // Make section titles editable
            document.querySelectorAll('.msg-section-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'msg-edit-section-title'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:1.17rem;font-weight:600;color:var(--text-tertiary);background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.25rem 0.5rem;';
                el.replaceWith(input);
            });

            // Make card titles editable
            document.querySelectorAll('.msg-editable-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'msg-edit-title-input'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:inherit;font-weight:inherit;color:inherit;background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.2rem 0.4rem;width:100%;';
                el.replaceWith(input);
            });

            // Make content editable
            document.querySelectorAll('.msg-editable-content').forEach(el => {
                const ta = document.createElement('textarea');
                ta.value = el.textContent;
                ta.className = 'msg-edit-textarea'; ta.dataset.cardId = el.dataset.cardId;
                ta.style.cssText = 'width:100%;min-height:150px;resize:vertical;padding:0.5rem;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);border-radius:4px;font-family:Inter,sans-serif;font-size:0.9rem;line-height:1.5;';
                el.replaceWith(ta);
            });

            // Expand all accordions
            document.querySelectorAll('[id^="msg-content-"]').forEach(el => { el.style.display = 'block'; });
            document.querySelectorAll('[id^="msg-icon-"]').forEach(el => { el.style.transform = 'rotate(90deg)'; });
            document.querySelectorAll('[id^="msg-faq-content-"]').forEach(el => { el.style.display = 'block'; });
            document.querySelectorAll('[id^="msg-faq-icon-"]').forEach(el => { el.style.transform = 'rotate(90deg)'; });
        } else {
            // "Done" — persist ALL changes to Supabase
            const updates = [];

            // Collect section title + width changes
            document.querySelectorAll('.msg-edit-section-title').forEach(input => {
                const cardId = parseInt(input.dataset.cardId);
                if (cardId) updates.push({ ccId: cardId, fields: { cc_title: input.value } });
            });
            document.querySelectorAll('.msg-width-select').forEach(sel => {
                const cardId = parseInt(sel.dataset.cardId);
                if (cardId) {
                    const existing = updates.find(u => u.ccId === cardId);
                    if (existing) existing.fields.cc_width = sel.value;
                    else updates.push({ ccId: cardId, fields: { cc_width: sel.value } });
                }
            });

            // Collect card title changes
            document.querySelectorAll('.msg-edit-title-input').forEach(input => {
                const cardId = parseInt(input.dataset.cardId);
                if (cardId) {
                    const existing = updates.find(u => u.ccId === cardId);
                    if (existing) existing.fields.cc_title = input.value;
                    else updates.push({ ccId: cardId, fields: { cc_title: input.value } });
                }
            });

            // Collect content changes
            document.querySelectorAll('.msg-edit-textarea').forEach(ta => {
                const cardId = parseInt(ta.dataset.cardId);
                if (cardId) {
                    const existing = updates.find(u => u.ccId === cardId);
                    if (existing) existing.fields.cc_content = ta.value;
                    else updates.push({ ccId: cardId, fields: { cc_content: ta.value } });
                }
            });

            // Persist card updates
            editToggle.disabled = true;
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;animation:spin 1s linear infinite;">autorenew</span> Saving...';
            try {
                if (window.updateContentCard && updates.length > 0) {
                    for (const { ccId, fields } of updates) {
                        await window.updateContentCard(ccId, fields);
                    }
                    console.log('[Messaging] Persisted', updates.length, 'card updates');
                }

                // Persist any pending reorder changes
                if (window.reorderContentCards && _msgPendingReorders.length > 0) {
                    await window.reorderContentCards(_msgPendingReorders);
                    console.log('[Messaging] Persisted', _msgPendingReorders.length, 'reorder updates');
                    _msgPendingReorders = [];
                }
            } finally {
                editToggle.disabled = false;
                editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            }

            // Re-fetch and re-render
            _msgCards = await window.fetchContentCards(2);
            if (_msgCards && _msgCards.length > 0) {
                renderMsgCards(_msgCards);
                setupMsgEditToggle();
            }
        }
    });
}

// ---- MESSAGING CARD OPERATIONS ----

window.msgMoveCard = function (ccId, direction) {
    if (!_msgCards) return;
    const topCards = _msgCards.filter(c => !c.cc_parent_card_id).sort((a, b) => a.cc_order - b.cc_order);
    const idx = topCards.findIndex(c => c.cc_id === ccId);
    if (idx === -1) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= topCards.length) return;

    // Swap orders in local cache only
    const tmpOrder = topCards[idx].cc_order;
    topCards[idx].cc_order = topCards[swapIdx].cc_order;
    topCards[swapIdx].cc_order = tmpOrder;

    // Track pending reorders (will be persisted on Done)
    _msgPendingReorders.push(
        { ccId: topCards[idx].cc_id, newOrder: topCards[idx].cc_order },
        { ccId: topCards[swapIdx].cc_id, newOrder: topCards[swapIdx].cc_order }
    );

    // Re-render keeping edit mode
    renderMsgCards(_msgCards);
    setupMsgEditToggle();
    if (isMsgEditMode) {
        isMsgEditMode = false;
        document.getElementById('msg-edit-toggle')?.click();
    }
};

window.msgDeleteCard = async function (ccId) {
    if (!confirm('Remove this card?')) return;
    if (window.softDeleteContentCard) {
        await window.softDeleteContentCard(ccId);
    }
    // Also soft-delete children
    const children = (_msgCards || []).filter(c => c.cc_parent_card_id === ccId);
    for (const child of children) {
        if (window.softDeleteContentCard) await window.softDeleteContentCard(child.cc_id);
    }
    // Remove from local cache
    _msgCards = (_msgCards || []).filter(c => c.cc_id !== ccId && c.cc_parent_card_id !== ccId);
    renderMsgCards(_msgCards);
    setupMsgEditToggle();
    if (isMsgEditMode) {
        isMsgEditMode = false;
        document.getElementById('msg-edit-toggle')?.click();
    }
};

window.msgAddSection = async function () {
    const maxOrder = (_msgCards || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const card = await window.insertContentCard({ cc_page_id: 2, cc_card_type: 'section', cc_title: 'New Section', cc_width: 'full', cc_order: maxOrder + 1 });
        if (card) { _msgCards.push(card); renderMsgCards(_msgCards); setupMsgEditToggle(); if (isMsgEditMode) { isMsgEditMode = false; document.getElementById('msg-edit-toggle')?.click(); } }
    }
};

window.msgAddCard = async function () {
    const maxOrder = (_msgCards || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const card = await window.insertContentCard({ cc_page_id: 2, cc_card_type: 'card', cc_title: 'New Card', cc_content: '', cc_order: maxOrder + 1 });
        if (card) { _msgCards.push(card); renderMsgCards(_msgCards); setupMsgEditToggle(); if (isMsgEditMode) { isMsgEditMode = false; document.getElementById('msg-edit-toggle')?.click(); } }
    }
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

// ── APPROVALS (memo_pending_change) ──────────────────────────────────────────

window.renderApprovals = window._doRenderApprovals = async function() {
    const container = document.getElementById('approvals-list-container');
    if (!container) return;

    if (typeof window.fetchPendingApprovals !== 'function') {
        container.innerHTML = `<div style="padding:2rem; color:#ef4444;">Error: fetchPendingApprovals not found in supabase.js</div>`;
        return;
    }

    try {
        const approvals = await window.fetchPendingApprovals();
        if (!approvals || approvals.length === 0) {
            container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 2rem; color:var(--text-tertiary); text-align:center;">
                <span class="material-symbols-outlined" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">check_circle</span>
                <p>No pending approvals. Inbox zero!</p>
            </div>`;
            return;
        }

        let html = '';
        approvals.forEach(app => {
            const proposedStr = typeof app.mpc_proposed_data === 'string' 
                ? app.mpc_proposed_data 
                : JSON.stringify(app.mpc_proposed_data, null, 2);
                
            html += `
            <div class="approval-card" id="approval-card-${app.mpc_id}">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; align-items:flex-start;">
                    <div>
                        <div style="font-size:1.1rem; font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">
                            Action: ${app.mpc_action}
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-tertiary);">
                            Source: ${app.mpc_source} | Created: ${new Date(app.created_at).toLocaleString()}
                        </div>
                    </div>
                    <span class="approval-badge">${app.mpc_table_name}</span>
                </div>
                
                <div class="approval-field">
                    <label>Proposed Data (AI Extraction)</label>
                    <textarea id="app-proposed-${app.mpc_id}" rows="6" class="json-view" spellcheck="false">${proposedStr}</textarea>
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
                    <button class="btn-secondary" onclick="window.rejectApproval('${app.mpc_id}')" style="color:#ef4444; border-color:#ef4444;">
                        Reject
                    </button>
                    <button class="btn-primary" onclick="window.saveAndApproveApproval('${app.mpc_id}')">
                        Save & Approve
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error('Error rendering approvals:', err);
        container.innerHTML = `<div style="padding:2rem; color:#ef4444;">Error loading approvals. Check console.</div>`;
    }
};

window.rejectApproval = async function(mpcId) {
    if (!confirm('Are you sure you want to reject this extraction?')) return;
    const card = document.getElementById(`approval-card-${mpcId}`);
    if (card) card.style.opacity = '0.5';
    
    const success = await window.approvePendingChange(mpcId, null, 'rejected');
    if (success) {
        if (card) card.remove();
        // check if empty
        const container = document.getElementById('approvals-list-container');
        if (container && container.children.length === 0) {
            window.renderApprovals();
        }
    } else {
        alert('Failed to reject. Check console for errors.');
        if (card) card.style.opacity = '1';
    }
};

window.saveAndApproveApproval = async function(mpcId) {
    const textarea = document.getElementById(`app-proposed-${mpcId}`);
    if (!textarea) return;
    
    let finalData;
    try {
        finalData = JSON.parse(textarea.value);
    } catch (e) {
        alert('Invalid JSON. Please fix formatting before approving.\n\nError: ' + e.message);
        return;
    }
    
    const card = document.getElementById(`approval-card-${mpcId}`);
    if (card) card.style.opacity = '0.5';
    
    const success = await window.approvePendingChange(mpcId, finalData, 'edited_then_approved');
    if (success) {
        if (card) card.remove();
        // check if empty
        const container = document.getElementById('approvals-list-container');
        if (container && container.children.length === 0) {
            window.renderApprovals();
        }
    } else {
        alert('Failed to approve. Check console for errors.');
        if (card) card.style.opacity = '1';
    }
};

