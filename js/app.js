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

function relativeDate(dateStr, isCompleted = false) {
    if (!dateStr) return { text: '—', color: 'var(--text-tertiary)', isOverdue: false };
    const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
    if (isNaN(d.getTime())) return { text: dateStr, color: 'var(--text-tertiary)', isOverdue: false };
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
        if (isCompleted) return { text: '', color: 'inherit', isOverdue: false };
        const absDiff = Math.abs(diff);
        if (absDiff >= 365) return { text: `overdue by ${Math.floor(absDiff / 365)} year${Math.floor(absDiff / 365) > 1 ? 's' : ''}`, color: '#ef4444', isOverdue: true };
        if (absDiff >= 31) return { text: `overdue by ${Math.floor(absDiff / 30)} month${Math.floor(absDiff / 30) > 1 ? 's' : ''}`, color: '#ef4444', isOverdue: true };
        return { text: `overdue by ${absDiff} day${absDiff > 1 ? 's' : ''}`, color: '#ef4444', isOverdue: true };
    }
    if (isCompleted) return { text: '', color: 'inherit', isOverdue: false };
    if (diff === 0) return { text: 'due today', color: '#ef4444', isOverdue: false };
    if (diff <= 7) return { text: `due in ${diff} day${diff > 1 ? 's' : ''}`, color: '#f97316', isOverdue: false };
    if (diff <= 14) return { text: `due in ${diff} day${diff > 1 ? 's' : ''}`, color: '#eab308', isOverdue: false };
    if (diff <= 31) return { text: `due in ${diff} days`, color: 'var(--text-tertiary)', isOverdue: false };
    if (diff < 365) return { text: `due in ${Math.floor(diff / 30)} month${Math.floor(diff / 30) > 1 ? 's' : ''}`, color: 'var(--text-tertiary)', isOverdue: false };
    return { text: `due in ${Math.floor(diff / 365)} year${Math.floor(diff / 365) > 1 ? 's' : ''}`, color: 'var(--text-tertiary)', isOverdue: false };
}

function relativePastDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        const minDiff = Math.round((d - now) / (1000 * 60));
        if (minDiff > 60) return `in ${Math.round(minDiff / 60)} hours`;
        if (minDiff > 0) return `in ${minDiff} min`;
        if (minDiff < -60) return `${Math.round(Math.abs(minDiff) / 60)} hours ago`;
        if (minDiff < 0) return `${Math.abs(minDiff)} min ago`;
        return 'today';
    }

    const nowZero = new Date(now); nowZero.setHours(0, 0, 0, 0);
    const dZero = new Date(d); dZero.setHours(0, 0, 0, 0);
    const diff = Math.round((nowZero - dZero) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
        const absDiff = Math.abs(diff);
        if (absDiff >= 365) return `in ${Math.floor(absDiff / 365)} year${Math.floor(absDiff / 365) > 1 ? 's' : ''}`;
        if (absDiff >= 31) return `in ${Math.floor(absDiff / 30)} month${Math.floor(absDiff / 30) > 1 ? 's' : ''}`;
        return `in ${absDiff} day${absDiff > 1 ? 's' : ''}`;
    }
    if (diff === 1) return 'yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 14) return '1 week ago';
    if (diff < 31) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 60) return '1 month ago';
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} year${Math.floor(diff / 365) > 1 ? 's' : ''} ago`;
}


// ---- VERSIONED SAVE UTILITY ----
// Creates new version row (active=true), deactivates old row.
// tableName: e.g. 'tbl_action'
// idCol: e.g. 'ac_id'
// activeCol: e.g. 'ac_active'
// originalIdCol: e.g. 'ac_original_id'
// modifiedCol: e.g. 'ac_modified'
// oldId: the current row's PK (e.g. ac_id value)
// newData: object of column values for the new row (excluding PK and active flag)
window.versionedSave = async function (tableName, idCol, activeCol, originalIdCol, modifiedCol, oldId, newData) {
    if (!window._sb) { console.warn('[versionedSave] No Supabase client'); return null; }
    try {
        // 1. Deactivate old row
        await window._sb.from(tableName).update({ [activeCol]: false }).eq(idCol, oldId);
        // 2. Insert new row with active=true and updated modified timestamp
        const insertData = { ...newData, [activeCol]: true, [modifiedCol]: new Date().toISOString() };
        delete insertData[idCol]; // Let DB auto-generate PK
        const { data, error } = await window._sb.from(tableName).insert(insertData).select().single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error(`[versionedSave] Error saving to ${tableName}:`, e);
        // Try to reactivate old row on failure
        try { await window._sb.from(tableName).update({ [activeCol]: true }).eq(idCol, oldId); } catch (_) { }
        throw e;
    }
};

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
    'contacts': 'pages/contacts.html',
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
    'contacts': renderContacts,
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
    const stakeholders = window.getData('stakeholders') || [];
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
                if (card.cc_title === 'Executive Summary' || card.cc_title === 'Retrospective Summary') {
                    const cardId = 'ai-summary-' + Math.random().toString(36).substr(2, 9);
                    setTimeout(async () => {
                        const el = document.getElementById(cardId);
                        if (!el) return;
                        try {
                            const data = await window.generateAISummary();
                            if (data && data.success) {
                                el.innerHTML = data.summary || 'Summary unavailable.';
                            } else {
                                console.error('AI Summary Error:', data);
                                el.innerHTML = `Failed to load AI summary. ${data?.error ? '(' + data.error + ')' : ''}`;
                            }
                        } catch (e) {
                            console.error('AI Summary Network/Fetch Error:', e);
                            el.innerHTML = 'Error loading AI summary.';
                        }
                    }, 50);
                    return `<div class="card" style="${colSpan}"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.5rem;">${card.cc_title || ''} <span style="font-size:0.9rem;color:var(--energy-mid);">✨ AI Generated</span></h3><p id="${cardId}" style="font-size:1rem;color:var(--text-secondary);margin:0;line-height:1.5;"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite; font-size:1rem; vertical-align:middle; margin-right: 0.25rem;">autorenew</span> Generating live summary...</p></div>`;
                }
                return `<div class="card" style="${colSpan}"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${card.cc_title || ''}</h3><p style="font-size:1rem;color:var(--text-secondary);margin:0;">${card.cc_content || ''}</p></div>`;
            }

            case 'action_view':
            case 'action_single': {
                const isSingle = card.cc_card_type === 'action_single';
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
                const items = filtered.slice(0, isSingle ? 1 : 3);
                const itemsHtml = items.length > 0 ? items.map(a => {
                    const dueStr = formatDate(a.timing?.dueDate);
                    const isCompleted = a.status === 'Completed';
                    const rel = relativeDate(a.timing?.dueDate, isCompleted);
                    const isOver = rel.isOverdue && !isDone(a);
                    const overdueStyle = isOver ? 'border-left:3px solid #ef4444;' : '';
                    const badgeStyle = isOver ? 'border-color:#ef4444;color:#ef4444;' : 'border-color:var(--energy-algae);color:var(--energy-algae);';
                    const hoverBorder = isOver ? '#ef4444' : 'var(--energy-algae)';
                    const mouseoutCode = isOver
                        ? "this.style.border='1px solid var(--border-subtle)';this.style.borderLeft='3px solid #ef4444'"
                        : "this.style.borderColor='var(--border-subtle)'";
                    const relLabel = !isDone(a) && a.timing?.dueDate ? `<div style="text-align:center;font-size:0.72rem;font-weight:600;color:${rel.color};margin-bottom:0.4rem;">${rel.text}</div>` : '';
                    const ownerBadge = a.owner ? `<span style="display:inline-block;padding:0.2rem 0.6rem;background:var(--energy-algae);color:#fff;border-radius:100px;font-size:0.7rem;font-weight:600;line-height:1;margin-left:0.25rem;">${a.owner}</span>` : '—';
                    return `<div class="card" style="padding:1rem;border:1px solid var(--border-subtle);cursor:pointer;transition:all 0.15s;${overdueStyle}" onclick="event.stopPropagation();window.viewAction('${a.id}')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='${hoverBorder}'" onmouseout="${mouseoutCode}">${relLabel}<div style="display:flex;justify-content:space-between;align-items:center;"><div><span class="status-badge" style="font-size:0.7rem;padding:0.1rem 0.5rem;${badgeStyle}">${a.status}</span><h4 style="margin:0.25rem 0 0;font-size:1rem;color:var(--text-primary);text-transform:none;">${a.activity}</h4><div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.35rem;display:flex;align-items:center;">Owner: ${ownerBadge} <span style="margin:0 0.5rem;color:var(--border-subtle);">|</span> <span style="color:${rel.color}">Due: ${dueStr}</span></div></div><span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--text-tertiary);">open_in_new</span></div></div>`;
                }).join('') : '<div style="padding:1rem;color:var(--text-tertiary);font-style:italic;">No actions found.</div>';
                return `<div class="card" style="${colSpan}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || (isSingle ? 'Action' : 'Actions')}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="loadView('actions');history.pushState(null,'','#actions')">View All</button></div><div style="display:flex;flex-direction:column;gap:0.5rem;">${itemsHtml}</div></div>`;
            }

            case 'interaction_view':
            case 'interaction_single': {
                const isSingle = card.cc_card_type === 'interaction_single';
                const filter = card.cc_filter || '';
                let filtered = interactions;
                if (filter === 'upcoming') filtered = interactions.filter(i => i.type === 'Upcoming');
                else if (filter === 'recent') filtered = interactions.filter(i => i.type === 'Recent');
                const items = filtered.slice(0, isSingle ? 1 : 3);
                const itemsHtml = items.length > 0 ? items.map(i => {
                    return `<div class="card" style="padding:1rem;border:1px solid var(--border-subtle);cursor:pointer;transition:all 0.15s;" onclick="window.currentInteractionId='${i.id}';loadView('interaction_detail');history.pushState(null,'','#interaction_detail')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span style="font-size:0.75rem;color:${i.type === 'Upcoming' ? 'var(--energy-alert)' : 'var(--text-tertiary)'};font-weight:600;text-transform:uppercase;">${i.rawDate} — ${i.type}</span><span class="material-symbols-outlined" style="font-size:1rem;color:var(--text-tertiary);">open_in_new</span></div><h4 style="margin:0;font-size:1rem;color:var(--text-primary);text-transform:none;">${i.title}</h4><div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem;">${i.agenda || i.discussed || ''}</div></div>`;
                }).join('') : '<div style="padding:1rem;color:var(--text-tertiary);font-style:italic;">No interactions found.</div>';
                return `<div class="card" style="${colSpan}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || (isSingle ? 'Update' : 'Update Log')}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="loadView('interactions');history.pushState(null,'','#interactions')">View All</button></div><div style="display:flex;flex-direction:column;gap:0.5rem;">${itemsHtml}</div></div>`;
            }

            case 'stakeholder_view':
            case 'stakeholder_single': {
                const isSingle = card.cc_card_type === 'stakeholder_single';
                const items = stakeholders.slice(0, isSingle ? 1 : 3);
                const itemsHtml = items.length > 0 ? items.map(s => {
                    const col = s.status === 'Needs Attention' ? '#ef4444' : s.status === 'Active' ? 'var(--energy-algae)' : s.status === 'Monitor' ? 'var(--energy-mid)' : 'var(--text-secondary)';
                    return `<div class="card" style="padding:1rem;border:1px solid var(--border-subtle);cursor:pointer;transition:all 0.15s;" onclick="window.currentStakeholderId='${s.id}';loadView('stakeholder_detail');history.pushState(null,'','#stakeholder_detail')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <h4 style="margin:0;font-size:1rem;color:var(--text-primary);">${s.name}</h4>
                                <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.2rem;"><span style="color:${col};font-weight:600;">${s.status}</span> · ${s.role || '—'}</div>
                            </div>
                            <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--text-tertiary);">open_in_new</span>
                        </div>
                    </div>`;
                }).join('') : '<div style="padding:1rem;color:var(--text-tertiary);font-style:italic;">No stakeholders found.</div>';
                return `<div class="card" style="${colSpan}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || (isSingle ? 'Stakeholder' : 'Stakeholders')}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="loadView('stakeholders');history.pushState(null,'','#stakeholders')">View All</button></div><div style="display:flex;flex-direction:column;gap:0.5rem;">${itemsHtml}</div></div>`;
            }

            case 'action_summary': {
                const total = actions.length;
                const active = actions.filter(a => !/^complete[d]?$/i.test(a.status)).length;
                const now = new Date();
                const overdue = actions.filter(a => a.timing?.dueDate && new Date(a.timing.dueDate + 'T00:00:00') < now && !/^complete[d]?$/i.test(a.status)).length;
                const title = card.cc_title || 'Actions Summary';
                const statsHtml = `<div style="display:flex;gap:1.5rem;align-items:baseline;">
                    <div style="font-size:2rem;font-weight:700;color:var(--text-primary);">${total}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Total</span></div>
                    <div style="font-size:1.5rem;font-weight:600;color:var(--energy-algae);">${active}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Active</span></div>
                    ${overdue > 0 ? `<div style="font-size:1.2rem;font-weight:600;color:#ef4444;">${overdue}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Overdue</span></div>` : ''}
                </div>`;
                return `<div class="card" style="${colSpan}cursor:pointer;transition:all 0.2s;" onclick="loadView('actions');history.pushState(null,'','#actions')" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${title}</h3>${statsHtml}</div>`;
            }

            case 'interaction_summary': {
                const total = interactions.length;
                const upcoming = interactions.filter(i => i.type === 'Upcoming').length;
                const title = card.cc_title || 'Update Log Summary';
                const statsHtml = `<div style="display:flex;gap:1.5rem;align-items:baseline;">
                    <div style="font-size:2rem;font-weight:700;color:var(--text-primary);">${total}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Total</span></div>
                    ${upcoming > 0 ? `<div style="font-size:1.5rem;font-weight:600;color:var(--energy-alert);">${upcoming}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Upcoming</span></div>` : ''}
                </div>`;
                return `<div class="card" style="${colSpan}cursor:pointer;transition:all 0.2s;" onclick="loadView('interactions');history.pushState(null,'','#interactions')" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${title}</h3>${statsHtml}</div>`;
            }

            case 'stakeholder_summary': {
                const total = stakeholders.length;
                const healthy = stakeholders.filter(s => ['Active', 'Operational', 'Stable'].includes(s.status)).length;
                const neutral = stakeholders.filter(s => ['Monitor', 'Dormant'].includes(s.status)).length;
                const risk = stakeholders.filter(s => ['Needs Attention', 'Critical/At Risk', 'Strained', 'Friction Points'].includes(s.status)).length;
                const title = card.cc_title || 'Stakeholders Summary';
                const statsHtml = `<div style="display:flex;gap:1.25rem;align-items:baseline;">
                    <div style="font-size:2rem;font-weight:700;color:var(--text-primary);">${total}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Total</span></div>
                    <div style="font-size:1.2rem;font-weight:600;color:var(--energy-algae);">${healthy}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Healthy</span></div>
                    <div style="font-size:1.2rem;font-weight:600;color:var(--energy-mid);">${neutral}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">Neutral</span></div>
                    ${risk > 0 ? `<div style="font-size:1.2rem;font-weight:600;color:#ef4444;">${risk}<span style="font-size:0.85rem;font-weight:400;color:var(--text-tertiary);margin-left:0.3rem;">At Risk</span></div>` : ''}
                </div>`;
                return `<div class="card" style="${colSpan}cursor:pointer;transition:all 0.2s;" onclick="loadView('stakeholders');history.pushState(null,'','#stakeholders')" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'"><h3 style="color:var(--text-tertiary);margin-bottom:0.5rem;">${title}</h3>${statsHtml}</div>`;
            }

            case 'objectives_link': {
                let previewHtml = '', targetView = 'strategy_spine';
                if (spine && spine.objectives) {
                    previewHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;"><div class="card" style="background:var(--bg-app);border:1px solid var(--border-subtle);"><h4 style="margin-bottom:1rem;font-size:0.9rem;">Objectives</h4><div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.85rem;">${spine.objectives.slice(0, 3).map(o => `<div style="padding:0.5rem 0.75rem;background:rgba(0,0,0,0.02);border:1px solid var(--border-subtle);border-radius:4px;color:var(--text-secondary);">${o.text}</div>`).join('')}</div></div><div class="card" style="background:var(--bg-app);border:1px solid var(--border-subtle);"><h4 style="margin-bottom:1rem;font-size:0.9rem;">Strategic Pillars</h4><div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.85rem;">${(spine.pillars || []).slice(0, 4).map(p => `<div style="padding:0.5rem 0.75rem;background:rgba(0,0,0,0.02);border:1px solid var(--border-subtle);border-radius:4px;color:var(--text-secondary);">${p.title}</div>`).join('')}</div></div></div>`;
                }
                return `<div class="card" style="${colSpan}cursor:pointer;" onclick="loadView('${targetView}');history.pushState(null,'','#${targetView}')"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h3 style="color:var(--text-tertiary);margin:0;">${card.cc_title || 'Linked Objectives'}</h3><button class="btn-secondary" style="font-size:0.75rem;height:28px;padding:0 0.5rem;" onclick="event.stopPropagation();loadView('${targetView}');history.pushState(null,'','#${targetView}')">View</button></div>${previewHtml}</div>`;
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
    window.setupMultiSelectFilters();
    window.filterStakeholders();
}

window.filterStakeholders = function () {
    const rawData = window.getData('stakeholders');
    if (!rawData) {
        const container = document.getElementById('stakeholder-list');
        if (container) container.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-tertiary);"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:1rem;display:block;">hourglass_empty</span>Loading stakeholders...</div>`;
        return;
    }
    let stakeholders = rawData;
    const search = (document.getElementById('stakeholder-search')?.value || '').toLowerCase();
    const statusF = window.getMultiSelectValues('stakeholder-filter-status');
    const roleF = window.getMultiSelectValues('stakeholder-filter-role');
    const sortMode = document.getElementById('stakeholder-sort')?.value || 'name';
    const sortDir = document.getElementById('stakeholder-sort-dir')?.dataset.dir || 'asc';

    // Dynamic role populate (once)
    const rolePill = document.getElementById('stakeholder-filter-role');
    if (rolePill && rolePill.querySelectorAll('input[type="checkbox"]').length <= 1) {
        const roles = [...new Set(stakeholders.map(s => s.role).filter(Boolean))].sort();
        roles.forEach(r => {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; font-size:0.82rem; cursor:pointer; color:var(--text-secondary);';
            label.innerHTML = `<input type="checkbox" value="${r}"> ${r}`;
            rolePill.appendChild(label);
        });
        if (rolePill.dataset.setupDone === 'true') {
            rolePill.dataset.setupDone = 'false';
            window.setupMultiSelectFilters();
        }
    }

    if (search) stakeholders = stakeholders.filter(s => (s.name || '').toLowerCase().includes(search) || (s.role || '').toLowerCase().includes(search));
    if (statusF.length > 0) stakeholders = stakeholders.filter(s => statusF.includes(s.status));
    if (roleF.length > 0) stakeholders = stakeholders.filter(s => roleF.includes(s.role));

    if (sortMode === 'name') stakeholders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortMode === 'status') {
        const order = ['Critical/At Risk', 'Strained', 'Friction Points', 'Operational', 'Stable', 'Dormant'];
        stakeholders.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    } else if (sortMode === 'role') stakeholders.sort((a, b) => (a.role || '').localeCompare(b.role || ''));

    if (sortDir === 'desc') stakeholders.reverse();

    const container = document.getElementById('stakeholder-list');
    if (!container) return;
    container.innerHTML = '';

    stakeholders.forEach(s => {
        const card = document.createElement('div');
        card.className = 'act-card';
        card.style.cssText = 'background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem 1.25rem; transition:box-shadow 0.2s, transform 0.15s; cursor:pointer; margin-bottom:0.5rem;';

        card.onclick = () => {
            window.currentStakeholderId = s.id;
            loadView('stakeholder_detail');
            history.pushState(null, '', '#stakeholder_detail');
        };

        card.onmouseover = () => {
            card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            card.style.transform = 'translateY(-1px)';
        };
        card.onmouseout = () => {
            card.style.boxShadow = 'none';
            card.style.transform = 'none';
        };

        const owners = s.owner ? s.owner.split('+').map(o => o.trim()) : [];
        const ownersHtml = owners.map(o => `<span style="display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">person</span>${o}</span>`).join(' ');

        let statusColor = 'var(--text-secondary)', statusBg = 'rgba(0,0,0,0.05)', statusBorder = 'transparent';
        if (s.status === 'Needs Attention' || s.status === 'Critical/At Risk') { statusColor = '#ef4444'; statusBg = 'rgba(239,68,68,0.1)'; statusBorder = 'rgba(239,68,68,0.3)'; }
        else if (s.status === 'Monitor' || s.status === 'Strained' || s.status === 'Friction Points') { statusColor = '#f97316'; statusBg = 'rgba(249,115,22,0.1)'; statusBorder = 'rgba(249,115,22,0.3)'; }
        else if (s.status === 'Active' || s.status === 'Stable' || s.status === 'Operational') { statusColor = '#10b981'; statusBg = 'rgba(16,185,129,0.1)'; statusBorder = 'rgba(16,185,129,0.3)'; }
        else if (s.status === 'Dormant') { statusColor = '#6b7280'; statusBg = 'rgba(107,114,128,0.1)'; statusBorder = 'rgba(107,114,128,0.3)'; }

        // Find last interaction for this stakeholder
        const allInteractions = window.getData('interactions') || [];
        const linkedInt = allInteractions.find(i => i.stakeholder === s.name || i.stakeholder === s.id);
        const lastIntDate = linkedInt ? (linkedInt.rawDate || linkedInt.date || '') : '';
        const lastIntContact = linkedInt && linkedInt.attendees ? linkedInt.attendees[0] || '' : '';

        // If a date is to be formatted per user requirements: "days / months / years information but a specific date should be shown when you click on the details. It could say Xth of Month. But the full date including year should be in the more intimate showing"
        // Wait, I will use `relativePastDate` to show "2 days ago" or "Xth of Month".
        const pastRelative = relativePastDate(lastIntDate);
        let dateStr = pastRelative || formatDate(lastIntDate);
        // The user says "It should not say recent or upcoming on it's own. It should have that day tracking." 
        // We can just use the relative text (e.g. "3 days ago") or just omit the year from `formatDate` if it's the current year.
        // For now, I will stick to what the user says: "under the role there should be the most recent interaction (who and when)."

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary); margin-bottom:0.4rem;">${s.name}</div>
                    
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                        <span style="font-size:0.8rem; color:var(--text-tertiary);">Status:</span>
                        <span style="background:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder}; padding:0.15rem 0.6rem; border-radius:100px; font-weight:600; font-size:0.75rem;">${s.status}</span>
                    </div>

                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
                        <span style="color:var(--text-tertiary);">Role:</span> <span style="color:#3b82f6;">${s.role || '—'}</span>
                    </div>

                    <div style="font-size:0.8rem; color:var(--text-tertiary);">
                        ${lastIntContact || lastIntDate ? `Most recent interaction: ${lastIntContact ? `<span style="color:var(--text-secondary); font-weight:500;">${lastIntContact}</span>` : ''}${lastIntContact && lastIntDate ? ' · ' : ''}${lastIntDate ? `<span style="color:var(--text-secondary); font-weight:500;">${dateStr}</span>` : ''}` : '<span style="font-style:italic;">No interactions recorded</span>'}
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:110px;">
                    ${ownersHtml ? `<div style="font-size:0.8rem; color:var(--text-tertiary); display:flex; align-items:center; gap:0.25rem; justify-content:flex-end;">${ownersHtml}</div>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.clearStakeholdersFilters = function () {
    const search = document.getElementById('stakeholder-search');
    if (search) search.value = '';

    ['stakeholder-filter-status', 'stakeholder-filter-role'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const allCb = el.querySelector('input[type="checkbox"][value=""]');
            if (allCb) {
                allCb.checked = true;
                allCb.dispatchEvent(new Event('change'));
            }
        }
    });
    window.filterStakeholders();
};

function renderStakeholderDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || window.currentStakeholderId;

    if (window._stakeholderOpenInEditMode) {
        window._stakeholderOpenInEditMode = false;
        setTimeout(() => {
            if (typeof window.toggleStakeholderEdit === 'function') {
                window.toggleStakeholderEdit();
            }
        }, 50);
        if (!id) {
            const setTxt = (elId, value) => { const el = document.getElementById(elId); if (el) el.textContent = value || '-'; };
            setTxt('detail-name', 'New Stakeholder');
            setTxt('view-role', '');
            document.getElementById('sdet-e-name-row').style.display = 'flex';
            document.getElementById('sdet-e-role-row').style.display = 'flex';
            return;
        }
    }

    if (!id) return;

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

        const inf = parseInt(s.powerDynamics.influence, 10) || 5;
        const int_ = parseInt(s.powerDynamics.interest, 10) || 5;
        let verbStr = 'MONITOR';
        if (inf >= 5 && int_ >= 5) verbStr = 'ENGAGE';
        else if (inf >= 5 && int_ < 5) verbStr = 'SATISFY';
        else if (inf < 5 && int_ >= 5) verbStr = 'INFORM';

        const vBadge = document.getElementById('view-matrix-verb');
        if (vBadge) vBadge.textContent = verbStr;

        const infBar = document.getElementById('view-influence-bar');
        const intBar = document.getElementById('view-interest-bar');
        const infLabel = document.getElementById('view-influence-label');
        const intLabel = document.getElementById('view-interest-label');
        if (infBar) infBar.style.width = (inf / 10 * 100) + '%';
        if (intBar) intBar.style.width = (int_ / 10 * 100) + '%';
        if (infLabel) infLabel.innerText = inf + '/10';
        if (intLabel) intLabel.innerText = int_ + '/10';
        setTxt('header-influence-label', inf + '/10');
        setTxt('header-interest-label', int_ + '/10');

        setTxt('view-authority', s.powerDynamics.authority);

        const pvC = document.getElementById('view-values-container');
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

    // Audience Message from sta_audience_message (direct DB field)
    const audContainer = document.getElementById('audience-msg-container');
    if (audContainer) {
        if (s.audienceMessage && s.audienceMessage.trim()) {
            audContainer.innerHTML = `
                <div class="sdet-card" id="aud-msg-card">
                    <div style="display:flex; align-items:center; gap:0.5rem; color:#3b82f6; font-weight:600; margin-bottom:1rem;">
                        <span class="material-symbols-outlined">groups</span> ${s.name}
                    </div>
                    <p id="aud-msg-text" style="font-size:0.9rem; line-height:1.5; color:var(--text-primary); margin:0;">${s.audienceMessage}</p>
                </div>`;
        } else {
            audContainer.innerHTML = '<span style="color:var(--text-tertiary); font-style:italic; font-size:0.9rem;">No audience specific message set.</span>';
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

window.viewStakeholderEdit = function (id = null) {
    window.currentStakeholderId = id;
    window._stakeholderOpenInEditMode = true;
    loadView('stakeholder_detail');
    history.pushState(null, '', '#stakeholder_detail');
};

window.cancelStakeholderEdit = function () {
    const editMode = document.getElementById('sdet-edit-mode');
    if (!editMode) return;

    if (!window.currentStakeholderId) {
        loadView('stakeholders');
        history.pushState(null, '', '#stakeholders');
        return;
    }

    const viewMode = document.getElementById('sdet-view-mode');
    const editBtn = document.getElementById('sdet-edit-toggle-btn');
    const cancelBtn = document.getElementById('sdet-cancel-btn');

    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    if (editBtn) editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
    if (cancelBtn) cancelBtn.style.display = 'none';
};

window.toggleStakeholderEdit = function () {
    const viewMode = document.getElementById('sdet-view-mode');
    const editMode = document.getElementById('sdet-edit-mode');
    const editBtn = document.getElementById('sdet-edit-toggle-btn');
    const cancelBtn = document.getElementById('sdet-cancel-btn');

    if (!viewMode || !editMode) return;

    const isEditing = editMode.style.display !== 'none';

    if (isEditing) {
        if (window.saveStakeholder) window.saveStakeholder();
    } else {
        const id = window.currentStakeholderId;
        const set = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
        const nameRow = document.getElementById('sdet-e-name-row');
        const roleRow = document.getElementById('sdet-e-role-row');
        if (nameRow) nameRow.style.display = 'flex';
        if (roleRow) roleRow.style.display = 'flex';

        ['sdet-e-name', 'sdet-e-role', 'sdet-e-narrativeHook', 'sdet-e-audience-message', 'sdet-e-values', 'sdet-e-authority', 'sdet-e-posture-current', 'sdet-e-posture-desired', 'sdet-e-posture-next', 'sdet-e-posture-target', 'sdet-e-barriers', 'sdet-e-engagement-approach', 'sdet-e-tactics', 'sdet-e-rel-internal', 'sdet-e-rel-external', 'sdet-e-contact-pref', 'sdet-e-contact-tone', 'sdet-e-contact-pitch'].forEach(eid => set(eid, ''));
        set('sdet-e-status', 'Operational');
        set('sdet-e-influence', '5');
        set('sdet-e-interest', '5');
        const infDisp = document.getElementById('sdet-e-inf-display');
        if (infDisp) infDisp.innerText = '5';
        const intDisp = document.getElementById('sdet-e-int-display');
        if (intDisp) intDisp.innerText = '5';

        if (id) {
            const stakeholders = window.getData('stakeholders') || [];
            const s = stakeholders.find(x => x.id === id);
            if (s) {
                set('sdet-e-name', s.name);
                set('sdet-e-role', s.role);
                set('sdet-e-narrativeHook', s.narrativeHook);
                set('sdet-e-audience-message', s.audienceMessage || '');
                set('sdet-e-values', (s.powerDynamics?.values || []).join(', '));
                set('sdet-e-status', s.status);
                set('sdet-e-influence', s.powerDynamics?.influence || '5');
                set('sdet-e-interest', s.powerDynamics?.interest || '5');
                set('sdet-e-authority', s.powerDynamics?.authority || s.decisionAuthority || '');
                const infDisp = document.getElementById('sdet-e-inf-display');
                if (infDisp) infDisp.innerText = s.powerDynamics?.influence || '5';
                const intDisp = document.getElementById('sdet-e-int-display');
                if (intDisp) intDisp.innerText = s.powerDynamics?.interest || '5';

                set('sdet-e-posture-current', s.postureJourney?.current || '');
                set('sdet-e-posture-desired', s.postureJourney?.desired || '');
                set('sdet-e-posture-next', s.postureJourney?.nextStep || '');
                set('sdet-e-posture-target', s.postureJourney?.target || s.postureJourney?.goalTarget || '');
                set('sdet-e-barriers', s.strategicApproach?.barriers || '');
                set('sdet-e-engagement-approach', s.strategicApproach?.engagementApproach || '');
                set('sdet-e-tactics', s.strategicApproach?.tactics ? JSON.stringify(s.strategicApproach.tactics, null, 2) : '');
                set('sdet-e-rel-internal', s.relationships?.internalLink || '');
                set('sdet-e-rel-external', s.relationships?.externalTension || '');
                set('sdet-e-contact-pref', s.contactConduct?.preferences || '');
                set('sdet-e-contact-tone', s.contactConduct?.emailTone || '');
                set('sdet-e-contact-pitch', s.contactConduct?.elevatorPitches || '');
            }
        }
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    }
};

window.saveStakeholder = function () {
    let id = window.currentStakeholderId;
    const stakeholders = window.getData('stakeholders') || [];
    const get = (elId) => { const el = document.getElementById(elId); return el ? el.value : ''; };

    let s;
    if (!id) {
        id = 'stk-' + Date.now();
        window.currentStakeholderId = id;
        s = { id: id, powerDynamics: {}, postureJourney: {}, strategicApproach: {}, relationships: {}, contactConduct: {}, statusHistory: [] };
        stakeholders.push(s);
    } else {
        s = stakeholders.find(x => x.id === id);
        if (!s) return;
    }

    s.name = get('sdet-e-name').trim() || s.name || 'New Stakeholder';
    s.role = get('sdet-e-role').trim() || s.role || '';
    s.narrativeHook = get('sdet-e-narrativeHook');
    s.audienceMessage = get('sdet-e-audience-message');

    if (!s.powerDynamics) s.powerDynamics = {};
    s.powerDynamics.values = get('sdet-e-values').split(',').map(v => v.trim()).filter(Boolean);
    s.powerDynamics.influence = parseInt(get('sdet-e-influence'), 10) || 5;
    s.powerDynamics.interest = parseInt(get('sdet-e-interest'), 10) || 5;
    s.powerDynamics.authority = get('sdet-e-authority');
    s.decisionAuthority = s.powerDynamics.authority; // Keep for compatibility if needed

    const newStatus = get('sdet-e-status');
    if (newStatus && newStatus !== s.status) {
        if (!s.statusHistory) s.statusHistory = [];
        const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        s.statusHistory.push({ date: dateStr, status: newStatus, notes: 'Status updated via profile edit.' });
        s.status = newStatus;
    }

    if (!s.postureJourney) s.postureJourney = {};
    s.postureJourney.current = get('sdet-e-posture-current');
    s.postureJourney.desired = get('sdet-e-posture-desired');
    s.postureJourney.nextStep = get('sdet-e-posture-next');
    s.postureJourney.target = get('sdet-e-posture-target');

    if (!s.strategicApproach) s.strategicApproach = {};
    s.strategicApproach.barriers = get('sdet-e-barriers');
    s.strategicApproach.engagementApproach = get('sdet-e-engagement-approach');
    try {
        const tacticsVal = get('sdet-e-tactics');
        if (tacticsVal.trim().startsWith('[')) {
            s.strategicApproach.tactics = JSON.parse(tacticsVal);
        } else {
            s.strategicApproach.tactics = tacticsVal.split('\n').filter(Boolean).map(t => ({ type: 'Tactic', text: t.trim() }));
        }
    } catch (e) {
        console.warn('Failed to parse tactics JSON', e);
    }

    if (!s.relationships) s.relationships = {};
    s.relationships.internalLink = get('sdet-e-rel-internal');
    s.relationships.externalTension = get('sdet-e-rel-external');

    if (!s.contactConduct) s.contactConduct = {};
    s.contactConduct.preferences = get('sdet-e-contact-pref');
    s.contactConduct.emailTone = get('sdet-e-contact-tone');
    s.contactConduct.elevatorPitches = get('sdet-e-contact-pitch');

    window.updateData('stakeholders', stakeholders);
    renderStakeholderDetail();

    const viewMode = document.getElementById('sdet-view-mode');
    const editMode = document.getElementById('sdet-edit-mode');
    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    const editBtn = document.getElementById('sdet-edit-toggle-btn');
    if (editBtn) editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
    const cancelBtn = document.getElementById('sdet-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
};

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

// ---- UPLOAD MODAL: RECORDING ----
let _uploadMediaRecorder = null;
let _uploadRecChunks = [];
let _uploadRecTimer = null;
let _uploadRecStart = 0;

window.toggleUploadRecording = async function () {
    const btn = document.getElementById('upload-record-btn');
    const indicator = document.getElementById('upload-record-indicator');
    const timerEl = document.getElementById('upload-record-timer');

    if (_uploadMediaRecorder && _uploadMediaRecorder.state === 'recording') {
        // Stop recording
        _uploadMediaRecorder.stop();
        clearInterval(_uploadRecTimer);
        btn.dataset.recording = '';
        btn.style.boxShadow = 'inset 0 0 0 4px #fff, inset 0 0 0 20px #ef4444';
        btn.querySelector('span').style.display = 'none';
        if (indicator) indicator.style.display = 'none';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _uploadRecChunks = [];
        _uploadMediaRecorder = new MediaRecorder(stream);
        _uploadMediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) _uploadRecChunks.push(e.data); };
        _uploadMediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(_uploadRecChunks, { type: 'audio/webm' });
            console.log('[Upload] Recording complete:', blob.size, 'bytes');
            // Could attach to upload here in future
        };
        _uploadMediaRecorder.start();
        _uploadRecStart = Date.now();
        btn.dataset.recording = 'true';
        btn.style.boxShadow = 'inset 0 0 0 4px #fff, inset 0 0 0 10px #ef4444';
        btn.querySelector('span').style.display = 'block';
        btn.querySelector('span').textContent = 'stop';
        if (indicator) indicator.style.display = 'flex';

        // Timer
        _uploadRecTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - _uploadRecStart) / 1000);
            const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const ss = String(elapsed % 60).padStart(2, '0');
            if (timerEl) timerEl.textContent = mm + ':' + ss;
        }, 500);
    } catch (err) {
        console.warn('[Upload] Microphone access denied:', err);
        alert('Microphone access is required for recording. Please allow microphone access and try again.');
    }
};

function renderInteractions() {
    window.setupMultiSelectFilters();
    window.filterInteractions();
}

window.filterInteractions = function () {
    const rawData = window.getData('interactions');
    if (!rawData) {
        const container = document.getElementById('interactions-list');
        if (container) container.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-tertiary);"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:1rem;display:block;">hourglass_empty</span>Loading update log...</div>`;
        return;
    }
    let interactions = rawData;
    const search = (document.getElementById('interactions-search')?.value || '').toLowerCase();
    const sortMode = document.getElementById('interactions-sort')?.value || 'date';
    const sortDir = document.getElementById('interactions-sort-dir')?.dataset.dir || 'desc';
    const typeF = window.getMultiSelectValues('interactions-filter-type');
    const stakeholderF = window.getMultiSelectValues('interactions-filter-stakeholder');

    // Dynamic stakeholder populate (once)
    const stakeholderPill = document.getElementById('interactions-filter-stakeholder');
    if (stakeholderPill && stakeholderPill.querySelectorAll('input[type="checkbox"]').length <= 1) {
        const stakeholders = [...new Set(interactions.map(i => i.stakeholder).filter(Boolean))].sort();
        stakeholders.forEach(s => {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; font-size:0.82rem; cursor:pointer; color:var(--text-secondary);';
            label.innerHTML = `<input type="checkbox" value="${s}"> ${s}`;
            stakeholderPill.appendChild(label);
        });
        if (stakeholderPill.dataset.setupDone === 'true') {
            stakeholderPill.dataset.setupDone = 'false';
            window.setupMultiSelectFilters();
        }
    }

    if (search) interactions = interactions.filter(i => (i.title || '').toLowerCase().includes(search) || (i.agenda || i.discussed || '').toLowerCase().includes(search) || (i.attendees || []).some(a => a.toLowerCase().includes(search)));
    if (typeF.length > 0) interactions = interactions.filter(i => typeF.includes(i.type));
    if (stakeholderF.length > 0) interactions = interactions.filter(i => stakeholderF.includes(i.stakeholder));

    if (sortMode === 'title') interactions.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sortMode === 'type') interactions.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
    else if (sortMode === 'date') interactions.sort((a, b) => new Date(a.rawDate || a.date || 0) - new Date(b.rawDate || b.date || 0));

    if (sortDir === 'desc') interactions.reverse();

    _renderInteractionsList(interactions);
};

window.clearInteractionsFilters = function () {
    const search = document.getElementById('interactions-search');
    if (search) search.value = '';

    ['interactions-filter-type', 'interactions-filter-stakeholder'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const allCb = el.querySelector('input[type="checkbox"][value=""]');
            if (allCb) {
                allCb.checked = true;
                allCb.dispatchEvent(new Event('change'));
            }
        }
    });
    window.filterInteractions();
};

function _renderInteractionsList(interactions) {
    const container = document.getElementById('interactions-list');
    if (!container) return;
    container.innerHTML = '';

    interactions.forEach(a => {
        const rawDateStr = a.rawDate || a.date || '';
        const pastRelative = relativePastDate(rawDateStr);
        let isUpcoming = false;
        let color = 'var(--text-tertiary)';
        let fw = '400';

        if (rawDateStr) {
            const d = new Date(rawDateStr);
            const now = new Date();
            if (d > now) {
                isUpcoming = true;
                color = '#ef4444'; // upcoming
                fw = '600';
            } else {
                const diffDays = Math.round((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
                if (diffDays <= 14) {
                    color = '#10b981'; // recent
                    fw = '600';
                }
            }
        }

        let statusBadge = `<span style="color:${color}; font-weight:${fw}; font-size:0.8rem;">${pastRelative || (isUpcoming ? 'Upcoming' : 'Completed')}</span>`;

        const agendaHtml = (a.topics || []).map(t => `<span style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:100px; background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.2);">${t}</span>`).join('');

        const attendeesHtml = (a.attendees || []).map(att => `<span style="display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">person</span>${att}</span>`).join(' ');

        const card = document.createElement('div');
        card.className = 'act-card' + (isUpcoming ? ' overdue' : '');
        card.style.cssText = 'background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem 1.25rem; transition:box-shadow 0.2s, transform 0.15s; cursor:pointer; margin-bottom:0.75rem;';
        if (isUpcoming) card.style.borderLeft = '3px solid #ef4444';

        card.onclick = () => window.viewInteraction(a.id);

        card.onmouseover = () => {
            card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            card.style.transform = 'translateY(-1px)';
        };
        card.onmouseout = () => {
            card.style.boxShadow = 'none';
            card.style.transform = 'none';
        };

        const titleText = a.title || (a.agenda || a.discussed || '').substring(0, 60) + ((a.agenda || a.discussed || '').length > 60 ? '…' : '') || 'Untitled';
        const summaryText = a.agenda || a.discussed || '';

        let linkedStakeholderName = a.stakeholder || '';
        let linkedObjectiveName = '';
        let linkedActionName = '';

        if (a.linkedStakeholderId) {
            const stas = window.getData('stakeholders') || [];
            const st = stas.find(s => s.id === a.linkedStakeholderId);
            if (st) linkedStakeholderName = st.name;
        }
        if (a.linkedObjectiveId) {
            const spine = window.getData('spine') || { objectives: [] };
            const obj = (spine.objectives || []).find(o => String(o.id) === 'obj' + a.linkedObjectiveId || String(o.id) === String(a.linkedObjectiveId));
            if (obj) linkedObjectiveName = obj.text;
        }
        if (a.linkedActionId) {
            const acts = window.getData('actions') || [];
            const ac = acts.find(act => String(act.id) === String(a.linkedActionId));
            if (ac) linkedActionName = ac.activity;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:stretch; gap:1rem; min-height: 100%;">
                <div style="flex:1; min-width:0; display:flex; flex-direction:column;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                        ${statusBadge}
                    </div>
                    <div style="font-weight:700; font-size:1rem; color:var(--text-primary); margin-bottom:0.3rem;">${titleText}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.6rem;">${summaryText.length > 150 ? summaryText.substring(0, 147) + '...' : summaryText}</div>
                    ${agendaHtml ? `<div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.6rem; flex-wrap:wrap;"><span style="font-size:0.85rem; font-weight:400; color:var(--text-tertiary);">Agenda:</span> ${agendaHtml}</div>` : ''}
                    <div style="font-size:0.8rem; color:var(--text-tertiary); margin-top:auto; display:flex; flex-wrap:wrap; gap:0.75rem;">
                        ${linkedStakeholderName ? `<span><span style="font-weight:600; color:var(--text-secondary);">Stakeholder:</span> ${linkedStakeholderName}</span>` : ''}
                        ${linkedObjectiveName ? `<span><span style="font-weight:600; color:var(--text-secondary);">Objective:</span> ${linkedObjectiveName}</span>` : ''}
                        ${linkedActionName ? `<span><span style="font-weight:600; color:var(--text-secondary);">Action:</span> ${linkedActionName}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0; display:flex; flex-direction:column; justify-content:flex-end;">
                    ${attendeesHtml ? `<div style="font-size:0.8rem; color:var(--text-tertiary); display:flex; align-items:center; gap:0.6rem; justify-content:flex-end; white-space:nowrap;">${attendeesHtml}</div>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderInteractionDetail() {
    const id = window.currentInteractionId;

    // Auto-open edit mode if flagged
    if (window._interactionOpenInEditMode) {
        window._interactionOpenInEditMode = false;
        setTimeout(() => {
            if (typeof window.toggleInteractionEdit === 'function') {
                window.toggleInteractionEdit();
            }
        }, 50);

        if (!id) {
            const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
            const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
            setTxt('detail-int-title', 'New Update');
            setTxt('detail-int-date', '');
            setHtml('detail-int-status', 'Draft');
            setHtml('detail-int-description', '<em>No details provided yet.</em>');
            setHtml('detail-int-attendees', '');
            const agContainer = document.getElementById('detail-int-agenda-view-container');
            if (agContainer) agContainer.innerHTML = '';

            ['detail-int-link-stakeholder', 'detail-int-link-objective', 'detail-int-link-action'].forEach(linkId => {
                const el = document.getElementById(linkId);
                if (el) el.style.display = 'none';
            });
            return;
        }
    }

    if (!id) return;

    const interactions = window.getData('interactions') || [];
    const interaction = interactions.find(i => i.id == id);
    if (!interaction) return;

    document.getElementById('detail-int-title').textContent = interaction.title;
    const intDateStr = interaction.rawDate || interaction.date || '';
    const intRelPast = relativePastDate(intDateStr);
    document.getElementById('detail-int-date').textContent = formatDate(intDateStr) + (intRelPast ? ' · ' + intRelPast : '');

    const statusEl = document.getElementById('detail-int-status');
    let statusVal = interaction.status || 'Completed';
    // Clean up old 'Upcoming' types masquerading as status
    if (statusVal !== 'Upcoming' && statusVal !== 'Completed') {
        const d = new Date(interaction.rawDate || '');
        statusVal = (d > new Date()) ? 'Upcoming' : 'Completed';
    }

    if (statusVal === 'Upcoming') {
        statusEl.innerHTML = 'Upcoming';
        statusEl.style.color = '#ef4444';
    } else {
        const score = parseInt(interaction.outcomeScore) || 5;
        let color = '#eab308';
        let word = 'Neutral';
        if (score >= 7) { color = '#22c55e'; word = 'Positive'; }
        else if (score <= 3) { color = '#ef4444'; word = 'Negative'; }

        let intType = interaction.type || 'Other';
        if (intType === 'Upcoming' || intType === 'Recent') intType = 'Other';

        statusEl.innerHTML = `Completed <div style="display:inline-flex; align-items:center; gap:0.4rem; margin-left:1rem; padding:0.2rem 0.6rem; border-radius:100px; background:rgba(0,0,0,0.05); color:var(--text-secondary); font-size:0.8rem; font-weight:600;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${color};"></span> Outcome: ${word} (${score}/10)</div> <span style="color:var(--text-secondary); font-size:0.9rem; margin-left:0.5rem;">• ${intType}</span>`;
        statusEl.style.color = '#22c55e';
    }

    let linkedStakeholderName = '';
    let linkedObjectiveName = '';
    let linkedActionName = '';

    if (interaction.linkedStakeholderId) {
        const stas = window.getData('stakeholders') || [];
        const st = stas.find(s => s.id === interaction.linkedStakeholderId);
        if (st) linkedStakeholderName = st.name;
    }
    if (interaction.linkedObjectiveId) {
        const spine = window.getData('spine') || { objectives: [] };
        const obj = (spine.objectives || []).find(o => String(o.id) === 'obj' + interaction.linkedObjectiveId || String(o.id) === String(interaction.linkedObjectiveId));
        if (obj) linkedObjectiveName = obj.text;
    }
    if (interaction.linkedActionId) {
        const acts = window.getData('actions') || [];
        const ac = acts.find(act => String(act.id) === String(interaction.linkedActionId));
        if (ac) linkedActionName = ac.activity;
    }

    const stEl = document.getElementById('detail-int-link-stakeholder');
    if (stEl) {
        if (linkedStakeholderName) { stEl.style.display = 'inline-flex'; stEl.querySelector('span:last-child').textContent = linkedStakeholderName; }
        else stEl.style.display = 'none';
    }
    const obEl = document.getElementById('detail-int-link-objective');
    if (obEl) {
        if (linkedObjectiveName) { obEl.style.display = 'inline-flex'; obEl.querySelector('span:last-child').textContent = linkedObjectiveName; }
        else obEl.style.display = 'none';
    }
    const acEl = document.getElementById('detail-int-link-action');
    if (acEl) {
        if (linkedActionName) { acEl.style.display = 'inline-flex'; acEl.querySelector('span:last-child').textContent = linkedActionName; }
        else acEl.style.display = 'none';
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

    const agendaContainer = document.getElementById('detail-int-agenda-view-container');
    if (agendaContainer) {
        const items = interaction.agendaItems || [];
        const spine = window.getData('spine') || {};
        const actions = window.getData('actions') || [];

        if (items.length === 0) {
            agendaContainer.innerHTML = `<div style="font-size: 0.9rem; color: var(--text-tertiary); font-style: italic;">No agenda items</div>`;
        } else {
            const icons = { 'action': 'task', 'objective': 'flag', 'new_action': 'add_circle', 'Discuss': 'chat' };
            agendaContainer.innerHTML = items.map(item => {
                let linkTitle = item.new_action_name || 'New Action';
                if (item.linkType === 'objective') {
                    linkTitle = spine.objectives?.find(o => o.id === item.linked_objective_id)?.text || 'Unknown Objective';
                } else if (item.linkType === 'action') {
                    linkTitle = actions.find(a => a.id === item.linked_action_original_id)?.activity || 'Unknown Action';
                }
                const iconName = icons[item.linkType] || 'chat';
                const typeLabel = item.linkType === 'action' ? 'Action' : (item.linkType === 'objective' ? 'Objective' : (item.linkType === 'new_action' ? 'New Action' : 'Discuss'));

                return `
                <div class="card" style="border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem; position: relative;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <span class="interaction-pill" style="background: rgba(0,0,0,0.05); border: none;">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">${iconName}</span> ${typeLabel}
                        </span>
                        <div style="flex: 1; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.5rem; background: var(--bg-app); font-size: 0.9rem; color: var(--text-secondary);">
                            ${linkTitle}
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="width: 60px; font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Details:</div>
                        <div style="flex: 1; font-size: 0.9rem; color: var(--text-primary);">${item.details || 'No details provided.'}</div>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

}

window.updateInteractionStatus = function () {
    const dateInput = document.getElementById('edit-int-date');
    const statusDisplay = document.getElementById('edit-int-status-display');
    const outcomeWrapper = document.getElementById('edit-int-outcome-wrapper');
    const completedCb = document.getElementById('edit-int-completed-cb');
    const completedLabel = document.getElementById('edit-int-completed-label');
    if (!dateInput || !statusDisplay) return;

    const d = new Date(dateInput.value);
    const now = new Date();

    let isCompleted = false;

    if (!dateInput.value) {
        isCompleted = false;
        if (completedLabel) completedLabel.style.display = 'none';
    } else if (d > now) {
        if (d.toDateString() === now.toDateString()) {
            if (completedLabel) completedLabel.style.display = 'flex';
            isCompleted = completedCb && completedCb.checked;
        } else {
            if (completedLabel) completedLabel.style.display = 'none';
            if (completedCb) completedCb.checked = false;
            isCompleted = false;
        }
    } else {
        if (completedLabel) completedLabel.style.display = 'none';
        if (completedCb) completedCb.checked = true;
        isCompleted = true;
    }

    if (!isCompleted) {
        statusDisplay.innerText = 'Upcoming';
        statusDisplay.style.color = '#ef4444';
        if (outcomeWrapper) outcomeWrapper.style.display = 'none';
    } else {
        statusDisplay.innerText = 'Completed';
        statusDisplay.style.color = '#22c55e';
        if (outcomeWrapper) outcomeWrapper.style.display = 'block';
    }
};

window._currentOutcomeScore = null;

window.updateIntOutcome = function (val, fromLoad = false) {
    window._currentOutcomeScore = val;
    const sVal = document.getElementById('edit-int-outcome-val');
    const sValBtn = document.getElementById('edit-int-outcome-val-btn');
    const sBtn = document.getElementById('edit-int-outcome-btn');
    const slider = document.getElementById('edit-int-outcome-slider');

    if (sVal) sVal.innerText = val;
    if (sValBtn) {
        sValBtn.innerText = val;
        sValBtn.style.background = val >= 7 ? '#22c55e' : (val >= 4 ? '#eab308' : '#ef4444');
    }
    if (sBtn) sBtn.style.background = val >= 7 ? '#22c55e' : (val >= 4 ? '#eab308' : '#ef4444');

    if (slider) {
        slider.style.filter = 'none';
        slider.style.opacity = '1';
        if (!fromLoad) slider.value = val;
    }
};

window.clearIntOutcome = function (fromLoad = false) {
    window._currentOutcomeScore = null;
    const sVal = document.getElementById('edit-int-outcome-val');
    const sValBtn = document.getElementById('edit-int-outcome-val-btn');
    const sBtn = document.getElementById('edit-int-outcome-btn');
    const slider = document.getElementById('edit-int-outcome-slider');

    if (sVal) sVal.innerText = '—';
    if (sValBtn) {
        sValBtn.innerText = '—';
        sValBtn.style.background = '#94a3b8';
    }
    if (sBtn) sBtn.style.background = '#fff';

    if (slider) {
        slider.style.filter = 'grayscale(100%)';
        slider.style.opacity = '0.6';
        if (!fromLoad) slider.value = 5;
    }
};

window.saveInteraction = function () {
    // Collect data
    const title = document.getElementById('edit-int-purpose')?.value || 'New Interaction';
    const date = document.getElementById('edit-int-date')?.value || '';
    const desc = document.getElementById('edit-int-description')?.value || '';
    const typeGroup = document.getElementById('edit-int-type-group');
    const typeBtns = typeGroup ? typeGroup.querySelectorAll('.update-type-btn.active') : document.querySelectorAll('.update-type-btn.active');
    const type = typeBtns.length > 0 ? typeBtns[0].getAttribute('data-val') : 'Other';
    const outcomeScore = window._currentOutcomeScore;
    const outcomeNotes = document.getElementById('edit-int-outcome-notes')?.value || '';
    const statusEl = document.getElementById('edit-int-status-display');
    const status = statusEl ? statusEl.innerText : 'Completed';

    const linkedStakeholderId = document.getElementById('edit-int-link-stakeholder')?.value || '';
    const linkedObjectiveId = document.getElementById('edit-int-link-objective')?.value || '';
    const linkedActionId = document.getElementById('edit-int-link-action')?.value || '';

    const isNew = !window.currentInteractionId;
    const interactions = window.getData('interactions') || [];

    if (isNew) {
        const newInt = {
            id: 'int-' + Date.now(),
            title: title,
            rawDate: date,
            date: date,
            type: type,
            status: status,
            agenda: desc,
            discussed: desc,
            outcomeScore: parseInt(outcomeScore, 10),
            outcomeNotes: outcomeNotes,
            topics: [],
            attendeeIds: window._currentAttendeeIds ? window._currentAttendeeIds.map(a => a.id) : [],
            attendees: window._currentAttendeeIds ? window._currentAttendeeIds.map(a => a.name) : [],
            followUpDate: (document.getElementById('edit-int-followup') && document.getElementById('edit-int-followup').checked) ? document.getElementById('edit-int-followup-date').value : '',
            linkedStakeholderId: linkedStakeholderId,
            linkedObjectiveId: linkedObjectiveId,
            linkedActionId: linkedActionId,
            agendaItems: JSON.parse(JSON.stringify(window._currentAgendaItems || []))
        };
        window.currentInteractionId = newInt.id;
        interactions.unshift(newInt);
    } else {
        const idx = interactions.findIndex(i => i.id == window.currentInteractionId);
        if (idx !== -1) {
            interactions[idx].title = title;
            interactions[idx].rawDate = date;
            interactions[idx].date = date;
            interactions[idx].type = type;
            interactions[idx].status = status;
            interactions[idx].agenda = desc;
            interactions[idx].discussed = desc;
            interactions[idx].outcomeScore = parseInt(outcomeScore, 10);
            interactions[idx].outcomeNotes = outcomeNotes;
            interactions[idx].attendeeIds = window._currentAttendeeIds ? window._currentAttendeeIds.map(a => a.id) : [];
            interactions[idx].attendees = window._currentAttendeeIds ? window._currentAttendeeIds.map(a => a.name) : [];
            interactions[idx].followUpDate = (document.getElementById('edit-int-followup') && document.getElementById('edit-int-followup').checked) ? document.getElementById('edit-int-followup-date').value : '';
            interactions[idx].linkedStakeholderId = linkedStakeholderId;
            interactions[idx].linkedObjectiveId = linkedObjectiveId;
            interactions[idx].linkedActionId = linkedActionId;
            interactions[idx].agendaItems = JSON.parse(JSON.stringify(window._currentAgendaItems || []));
        }
    }

    window.updateData('interactions', interactions);
    renderInteractionDetail();

    // We do NOT showToast or cancelEdit here. supabase.js intercepts saveInteraction and will do it after the async save completes.
};

window.archiveInteraction = function () {
    if (!window.currentInteractionId) return;

    let interactions = window.getData('interactions') || [];
    interactions = interactions.filter(i => i.id != window.currentInteractionId);
    window.updateData('interactions', interactions);

    const toast = document.getElementById('global-toast');
    if (toast) {
        toast.innerText = 'Update log archived';
        toast.style.background = '#6b7280';
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }

    window.currentInteractionId = null;
    loadView('interactions');
    history.pushState(null, '', '#interactions');
};

window.toggleActionPullup = function () {
    const pu = document.getElementById('action-pullup-overlay');
    if (pu) {
        pu.style.display = pu.style.display === 'none' ? 'block' : 'none';
    }
};

window.savePullupAction = function () {
    const title = document.getElementById('pu-title').value;
    const desc = document.getElementById('pu-desc').value;

    const newAction = {
        id: "act-" + Date.now(),
        activity: title,
        description: desc,
        owner: "Vant",
        audience: ["current stakeholder"],
        status: "At Risk",
        tags: ["Comms"],
        priority: "High",
        phase: "Phase 1",
        timing: { dueDate: "2026-02-27", startDate: "", predictedLength: "" },
        versionControl: { currentVersion: "Just now", recentProgress: "Task created from Interaction" }
    };

    if (window.addData) {
        window.addData('actions', newAction);
    } else {
        const actions = window.getData('actions') || [];
        actions.push(newAction);
        window.updateData('actions', actions);
    }

    toggleActionPullup();

    const quickEditBtn = document.querySelector('[onclick="toggleActionPullup()"] span:last-child')?.previousElementSibling;
    if (quickEditBtn && quickEditBtn.textContent.includes('not edited')) {
        quickEditBtn.textContent = '(1 detail entered)';
        quickEditBtn.style.color = '#10b981';
    }

    alert('Action added to Actions list successfully.');
};

window._currentAgendaItems = [];

window.renderAgendaItems = function () {
    const container = document.getElementById('edit-int-agenda-container');
    if (!container) return;

    if (!document.getElementById('agenda-styles-injected')) {
        document.head.insertAdjacentHTML('beforeend', '<style id="agenda-styles-injected">details[open] > summary .agenda-expand-icon { transform: rotate(0deg) !important; } details > summary::-webkit-details-marker { display: none; }</style>');
    }

    const spine = window.getData('spine') || {};
    const objectives = spine.objectives || [];
    const actions = window.getData('actions') || [];

    container.innerHTML = window._currentAgendaItems.map((item, index) => {
        const isActionLinked = item.linkType === 'action' && item.linked_action_original_id;

        return `
        <div style="flex: 1; border: 1px solid var(--border-subtle); border-radius: 8px; position: relative; margin-bottom: 0.5rem; background:#fff;">
            <div style="padding: 1rem 1.5rem;">
                <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="color: var(--text-tertiary); cursor: move; padding-top:0.4rem;">
                        <span class="material-symbols-outlined">drag_indicator</span>
                    </div>
                    <div style="flex: 1; display:flex; flex-direction:column; gap:0.5rem;">
                        <div style="display: flex; gap: 1rem; align-items: center; width:100%;">
                            <select class="agenda-link-type" data-id="${item.id}" style="flex: 1; min-width: 0; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; font-family: 'Inter', sans-serif; background: #fff;" onchange="window.updateAgendaItem(${item.id}, 'linkType', this.value); window.renderAgendaItems();">
                                <option value="">Select Link Type...</option>
                                <option value="action" ${item.linkType === 'action' ? 'selected' : ''}>Link to Action</option>
                                <option value="objective" ${item.linkType === 'objective' ? 'selected' : ''}>Link to Objective</option>
                                <option value="new_action" ${item.linkType === 'new_action' ? 'selected' : ''}>Make New Action</option>
                            </select>
                            
                            ${item.linkType === 'action' ? `
                                <select class="agenda-action" data-id="${item.id}" style="flex: 1; min-width: 0; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; font-family: 'Inter', sans-serif; background: #fff;" onchange="window.updateAgendaItem(${item.id}, 'linked_action_original_id', this.value); window.renderAgendaItems();">
                                    <option value="">Select Action...</option>
                                    ${actions.map(a => `<option value="${a.id}" ${item.linked_action_original_id == a.id ? 'selected' : ''}>${a.activity || a.title || 'Unnamed Action'}</option>`).join('')}
                                </select>
                            ` : item.linkType === 'objective' ? `
                                <select class="agenda-objective" data-id="${item.id}" style="flex: 1; min-width: 0; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; font-family: 'Inter', sans-serif; background: #fff;" onchange="window.updateAgendaItem(${item.id}, 'linked_objective_id', this.value); window.renderAgendaItems();">
                                    <option value="">Select Objective...</option>
                                    ${objectives.map(o => `<option value="${o.id}" ${item.linked_objective_id == o.id ? 'selected' : ''}>${o.text}</option>`).join('')}
                                </select>
                            ` : item.linkType === 'new_action' ? `
                                <div style="flex: 1; min-width: 0; display:flex; gap:0.5rem;">
                                    <input type="text" id="agenda-new-action-${item.id}" placeholder="New Action Name" value="${item.new_action_name || ''}" style="flex: 1; min-width: 0; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; font-family: 'Inter', sans-serif; background: #fff;" oninput="window.updateAgendaItem(${item.id}, 'new_action_name', this.value)">
                                    <button type="button" style="border: 1px solid #2563eb; background: #3b82f6; color:white; border-radius: 6px; padding: 0 0.75rem; font-size:0.85rem; font-weight:500; cursor:pointer;" onclick="const t = document.getElementById('pu-title'); if(t) t.value=document.getElementById('agenda-new-action-${item.id}').value; window.toggleActionPullup();">Quick Add</button>
                                </div>
                            ` : `
                                <div style="flex:1;"></div>
                            `}
                            
                            <div style="display: flex; gap: 0.25rem;">
                                <button type="button" style="width: 32px; height: 32px; border: none; background: #ef4444; color:white; border-radius:4px; cursor: pointer; display:flex; align-items:center; justify-content:center;" onclick="window.removeAgendaItem(${item.id})" title="Remove Agenda Item"><span class="material-symbols-outlined" style="font-size:1rem;">remove</span></button>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <label style="font-weight: 600; margin: 0; font-size:0.9rem;">Details:</label>
                            <input type="text" class="agenda-details" data-id="${item.id}" value="${item.details || ''}" style="flex: 1; border: 1px solid var(--border-subtle); border-radius: 6px; background: #fff; padding: 0.5rem; font-family: 'Inter', sans-serif;" oninput="window.updateAgendaItem(${item.id}, 'details', this.value)">
                        </div>
                    </div>
                </div>
            </div>
            
            ${isActionLinked ? `
            <details style="border-top: 1px solid var(--border-subtle);">
                <summary style="padding: 0.75rem 1.5rem; background: rgba(0,0,0,0.02); cursor: pointer; display: flex; justify-content: space-between; align-items: center; list-style:none;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem; font-weight:600;">Quick Edit Action</span>
                    <span class="material-symbols-outlined agenda-expand-icon" style="color: var(--text-tertiary); transition: transform 0.2s; transform: rotate(-90deg);">expand_more</span>
                </summary>
                
                <div style="padding:1.5rem; background:#fff; border-top:1px solid var(--border-subtle); border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <label style="width: 100px; color: var(--text-secondary); font-size:0.9rem;">Action Title:</label>
                            <input type="text" value="${item.details || ''}" style="flex: 1; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; background: #fff;">
                        </div>
                        
                        <div style="display: flex; align-items: flex-start; gap: 1rem;">
                            <label style="width: 100px; color: var(--text-secondary); padding-top: 0.5rem; font-size:0.9rem;">Description:</label>
                            <textarea rows="2" style="flex: 1; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; background: #fff;"></textarea>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 1rem; justify-content:space-between;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <label style="width: 100px; color: var(--text-secondary); font-size:0.9rem;">Status:</label>
                                <select style="width: 200px; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.4rem; background: #fff;">
                                    <option>In Progress</option>
                                    <option>At Risk</option>
                                </select>
                            </div>
                            <button type="button" class="btn-secondary" style="padding:0.3rem 0.75rem; font-size:0.85rem;" onclick="event.stopPropagation(); window.viewActionEdit();">Advanced</button>
                        </div>
                    </div>
                </div>
            </details>
            ` : ''}
        </div>
        `;
    }).join('');
};

window.addAgendaItem = function () {
    window._currentAgendaItems.push({ id: Date.now() + Math.random(), linkType: '', details: '' });
    window.renderAgendaItems();
};

window.removeAgendaItem = function (id) {
    window._currentAgendaItems = window._currentAgendaItems.filter(i => i.id !== id);
    window.renderAgendaItems();
};

window.updateAgendaItem = function (id, field, value) {
    const item = window._currentAgendaItems.find(i => i.id === id);
    if (item) {
        item[field] = value;
    }
};

window.toggleQuickActionEdit = function (id, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const el = document.getElementById(`quick-action-expand-${id}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};

window._currentAttendeeIds = [];

window.addInteractionAttendee = function (id, name) {
    if (!window._currentAttendeeIds.some(a => a.id === id)) {
        window._currentAttendeeIds.push({ id, name });
        window.renderInteractionAttendees();
    }
};

window.removeInteractionAttendee = function (id) {
    window._currentAttendeeIds = window._currentAttendeeIds.filter(a => a.id !== id);
    window.renderInteractionAttendees();
};

window.renderInteractionAttendees = function () {
    const list = document.getElementById('edit-int-attendees-list');
    if (!list) return;
    list.innerHTML = window._currentAttendeeIds.map(a => `
        <div style="background:var(--bg-app); border:1px solid var(--border-subtle); border-radius:4px; padding:0.2rem 0.5rem; font-size:0.85rem; display:flex; align-items:center; gap:0.4rem;">
            ${a.name}
            <span class="material-symbols-outlined" style="font-size:1rem; cursor:pointer; color:var(--text-tertiary);" onclick="window.removeInteractionAttendee('${a.id}')">close</span>
        </div>
    `).join('');
};

window.toggleInteractionEdit = function () {
    const viewMode = document.getElementById('int-view-mode');
    const editMode = document.getElementById('int-edit-mode');
    const editBtn = document.getElementById('int-edit-toggle-btn');
    const cancelBtn = document.getElementById('int-cancel-btn');
    const titleView = document.getElementById('detail-int-title');
    const subtitleView = document.getElementById('detail-int-subtitle-view');
    const subtitleEdit = document.getElementById('detail-int-subtitle-edit');

    if (!viewMode || !editMode) return;

    const isEditing = editMode.style.display !== 'none';

    if (isEditing) {
        if (window.saveInteraction) window.saveInteraction();
        return; // supabase.js interceptor will call cancelInteractionEdit on success
    } else {
        window._intOriginalSnapshot = null;
        const id = window.currentInteractionId;

        // Populate linking dropdowns
        const interactions = window.getData('interactions') || [];
        const interaction = id ? interactions.find(i => i.id == id) : null;

        const stas = window.getData('stakeholders') || [];
        const spine = window.getData('spine') || { objectives: [] };
        const acts = window.getData('actions') || [];

        const linkStId = interaction ? interaction.linkedStakeholderId : (window._prefillStakeholderId || '');
        const linkObId = interaction ? interaction.linkedObjectiveId : '';
        const linkAcId = interaction ? interaction.linkedActionId : (window._prefillActionId || '');

        const editSt = document.getElementById('edit-int-link-stakeholder');
        if (editSt) editSt.innerHTML = '<option value="">None</option>' + stas.map(s => `<option value="${s.id}" ${linkStId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

        const editOb = document.getElementById('edit-int-link-objective');
        if (editOb) editOb.innerHTML = '<option value="">None</option>' + (spine.objectives || []).map(o => `<option value="${o.id.replace('obj', '')}" ${String(linkObId) === String(o.id.replace('obj', '')) ? 'selected' : ''}>${o.text}</option>`).join('');

        const editAc = document.getElementById('edit-int-link-action');
        if (editAc) editAc.innerHTML = '<option value="">None</option>' + acts.map(a => `<option value="${a.id}" ${String(linkAcId) === String(a.id) ? 'selected' : ''}>${a.activity}</option>`).join('');

        if (id) {
            const interaction = interactions.find(i => i.id == id);
            if (interaction) {
                window._intOriginalSnapshot = JSON.parse(JSON.stringify(interaction));
                const purposeEl = document.getElementById('edit-int-purpose');
                const dateEl = document.getElementById('edit-int-date');
                const descEl = document.getElementById('edit-int-description');
                if (purposeEl) purposeEl.value = interaction.title || '';
                if (dateEl) dateEl.value = interaction.rawDate || '';
                if (descEl) descEl.value = interaction.agenda || interaction.discussed || '';

                // Populate type buttons
                if (document.getElementById('edit-int-type-group')) {
                    document.getElementById('edit-int-type-group').querySelectorAll('.update-type-btn').forEach(btn => btn.classList.remove('active'));
                    let intTypeForBtn = interaction.type;
                    if (intTypeForBtn === 'Upcoming' || intTypeForBtn === 'Recent') intTypeForBtn = 'Other';

                    if (intTypeForBtn) {
                        const savedTypes = intTypeForBtn.split(',').map(t => t.trim());
                        if (savedTypes.length > 0) {
                            const targetType = savedTypes[0].toLowerCase();
                            const btn = Array.from(document.getElementById('edit-int-type-group').querySelectorAll('.update-type-btn')).find(b => b.dataset.val.toLowerCase() === targetType);
                            if (btn) btn.classList.add('active');
                        }
                    } else {
                        const btn = Array.from(document.getElementById('edit-int-type-group').querySelectorAll('.update-type-btn')).find(b => b.dataset.val.toLowerCase() === 'other');
                        if (btn) btn.classList.add('active');
                    }
                }

                // Populate outcome and status
                const outcomeSlider = document.getElementById('edit-int-outcome-slider');
                const outcomeVal = document.getElementById('edit-int-outcome-val');
                const outcomeValBtn = document.getElementById('edit-int-outcome-val-btn');
                const outcomeBtn = document.getElementById('edit-int-outcome-btn');
                const outcomeNotes = document.getElementById('edit-int-outcome-notes');

                const completedCb = document.getElementById('edit-int-completed-cb');
                if (completedCb) {
                    completedCb.checked = (interaction.status === 'Completed');
                }

                if (window.updateInteractionStatus) {
                    window.updateInteractionStatus();
                }

                if (outcomeSlider) {
                    const score = interaction.outcomeScore;
                    if (score != null) {
                        window.updateIntOutcome(score, true);
                        outcomeSlider.value = score;
                    } else {
                        window.clearIntOutcome(true);
                        outcomeSlider.value = 5;
                    }
                }
                if (outcomeNotes) {
                    outcomeNotes.value = interaction.outcomeNotes || '';
                }
                if (outcomeNotes) outcomeNotes.value = interaction.outcomeNotes || '';

                // Populate agenda
                window._currentAgendaItems = interaction.agendaItems || [];
                window.renderAgendaItems();

                window._currentAttendeeIds = [];
                if (interaction.attendeeIds && interaction.attendees) {
                    window._currentAttendeeIds = interaction.attendeeIds.map((id, idx) => ({
                        id: id,
                        name: interaction.attendees[idx] || 'Unknown'
                    }));
                }
                window.renderInteractionAttendees();

                const followInput = document.getElementById('edit-int-followup');
                const followDate = document.getElementById('edit-int-followup-date');
                if (interaction.followUpDate) {
                    if (followInput) followInput.checked = true;
                    if (followDate) {
                        followDate.style.display = 'block';
                        followDate.value = interaction.followUpDate;
                    }
                } else {
                    if (followInput) followInput.checked = false;
                    if (followDate) followDate.style.display = 'none';
                }
            }
            const archiveBtn = document.getElementById('int-archive-btn');
            if (archiveBtn) archiveBtn.style.display = 'block';
        } else {
            // New interaction
            window._currentAgendaItems = [];
            window.renderAgendaItems();
            window._currentAttendeeIds = [];
            window.renderInteractionAttendees();
            const followInput = document.getElementById('edit-int-followup');
            const followDate = document.getElementById('edit-int-followup-date');
            if (followInput) followInput.checked = false;
            if (followDate) followDate.style.display = 'none';
            const archiveBtn = document.getElementById('int-archive-btn');
            if (archiveBtn) archiveBtn.style.display = 'none';
        }

        // Populate attendees dummy list for the popover
        const attendeesMockList = document.getElementById('edit-int-attendees-mock-list');
        if (attendeesMockList) {
            const contacts = window.getData('contacts') || [];
            if (contacts.length > 0) {
                attendeesMockList.innerHTML = contacts.slice(0, 5).map(c => `
                    <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="mock-contact-item" onmouseover="this.style.background='var(--bg-app)'" onmouseout="this.style.background='transparent'" onclick="window.addInteractionAttendee('${c.id}', '${c.name.replace(/'/g, "\\'")}'); document.getElementById('edit-int-attendees-popover').style.display='none';">
                        <div style="width:24px; height:24px; border-radius:50%; background:#3b82f6; color:white; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold;">${(c.name || 'U').substring(0, 2).toUpperCase()}</div>
                        <div style="font-size:0.85rem; color:var(--text-primary); font-weight:500;">${c.name}</div>
                    </div>
                `).join('');
            } else {
                attendeesMockList.innerHTML = '<div style="font-size:0.8rem; color:var(--text-tertiary);">No contacts found</div>';
            }
        }

        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (subtitleView) subtitleView.style.display = 'none';
        if (subtitleEdit) subtitleEdit.style.display = 'flex';
    }
};

window.cancelInteractionEdit = function () {
    const viewMode = document.getElementById('int-view-mode');
    const editMode = document.getElementById('int-edit-mode');
    const editBtn = document.getElementById('int-edit-toggle-btn');
    const cancelBtn = document.getElementById('int-cancel-btn');
    const subtitleView = document.getElementById('detail-int-subtitle-view');
    const subtitleEdit = document.getElementById('detail-int-subtitle-edit');

    if (window._intOriginalSnapshot && window.currentInteractionId) {
        const interactions = window.getData('interactions') || [];
        const idx = interactions.findIndex(i => i.id == window.currentInteractionId);
        if (idx !== -1) {
            interactions[idx] = window._intOriginalSnapshot;
            window.updateData('interactions', interactions);
        }
    }

    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    if (editBtn) editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (subtitleView) subtitleView.style.display = 'flex';
    if (subtitleEdit) subtitleEdit.style.display = 'none';

    if (typeof renderInteractionDetail === 'function') renderInteractionDetail();
};

window._intMediaRecorder = null;
window._intRecordingTimer = null;
window._intRecordingSeconds = 0;

window.toggleIntRecording = function () {
    const btn = document.getElementById('int-record-btn');
    const indicator = document.getElementById('int-recording-indicator');
    const timeEl = document.getElementById('int-recording-time');

    if (window._intMediaRecorder && window._intMediaRecorder.state === 'recording') {
        window._intMediaRecorder.stop();
        clearInterval(window._intRecordingTimer);
        if (btn) {
            btn.style.boxShadow = 'inset 0 0 0 3px #fff, inset 0 0 0 15px #ef4444';
            btn.querySelector('span').style.display = 'none';
        }
        if (indicator) indicator.style.display = 'none';
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            console.log('[Recording] Audio blob:', blob.size, 'bytes');
            stream.getTracks().forEach(t => t.stop());
        };
        recorder.start();
        window._intMediaRecorder = recorder;
        window._intRecordingSeconds = 0;
        if (btn) {
            btn.style.boxShadow = 'inset 0 0 0 3px #fff, inset 0 0 0 8px #ef4444';
            btn.querySelector('span').style.display = 'block';
            btn.querySelector('span').textContent = 'stop';
        }
        if (indicator) indicator.style.display = 'flex';
        window._intRecordingTimer = setInterval(() => {
            window._intRecordingSeconds++;
            const m = Math.floor(window._intRecordingSeconds / 60);
            const s = window._intRecordingSeconds % 60;
            if (timeEl) timeEl.textContent = m + ':' + String(s).padStart(2, '0');
        }, 1000);
    }).catch(err => {
        console.warn('[Recording] Microphone access denied:', err);
        alert('Microphone access is required for recording.');
    });
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
    window.setupMultiSelectFilters();
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

// ---- UNIFIED FILTER ENGINE ----
window.setupMultiSelectFilters = function () {
    // 1. Traditional single-dropdown pills
    document.querySelectorAll('.custom-filter-pill').forEach(pill => {
        if (pill.dataset.setupDone === 'true') return;
        pill.dataset.setupDone = 'true';

        const trigger = pill.querySelector('.filter-trigger');
        const dropdown = pill.querySelector('.filter-dropdown');
        if (!trigger || !dropdown) return;

        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        const labelBase = trigger.dataset.labelBase || 'Filter';
        const defaultLabel = trigger.dataset.defaultLabel || 'All';

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = dropdown.style.display === 'block';
            document.querySelectorAll('.filter-dropdown, .mega-menu-dropdown').forEach(d => {
                d.style.display = 'none';
                // Remove active class from mega menu triggers
                document.querySelectorAll('[id$="-mega-trigger"]').forEach(t => t.classList.remove('active'));
            });
            dropdown.style.display = wasOpen ? 'none' : 'block';
        });

        setupCheckboxGroupLogic(checkboxes, () => {
            const checkedCbs = Array.from(checkboxes).filter(c => c.checked);
            const finalChecked = checkedCbs.map(c => c.value);

            if (finalChecked.length === 0 || (finalChecked.length === 1 && finalChecked[0] === "")) {
                trigger.innerHTML = `${labelBase}: ${defaultLabel} <span class="material-symbols-outlined" style="font-size:1.1rem;">expand_more</span>`;
                trigger.style.background = 'var(--bg-surface)';
                trigger.style.color = 'var(--text-secondary)';
            } else if (finalChecked.length === 1) {
                const labelText = checkedCbs[0].parentNode.textContent.trim();
                trigger.innerHTML = `${labelBase}: <span style="font-weight:600;color:var(--text-primary);">${labelText}</span> <span class="material-symbols-outlined" style="font-size:1.1rem;">expand_more</span>`;
                trigger.style.background = 'var(--energy-algae)';
                trigger.style.color = '#000';
            } else {
                trigger.innerHTML = `${labelBase}: <span style="font-weight:600;color:var(--text-primary);">${finalChecked.length} selected</span> <span class="material-symbols-outlined" style="font-size:1.1rem;">expand_more</span>`;
                trigger.style.background = 'var(--energy-algae)';
                trigger.style.color = '#000';
            }

            const onChangeFn = pill.dataset.onChange;
            if (onChangeFn && window[onChangeFn]) window[onChangeFn]();
        });

        dropdown.addEventListener('click', (e) => e.stopPropagation());
    });

    // 2. Mega Menu Groups
    document.querySelectorAll('.mega-menu-group').forEach(group => {
        if (group.dataset.setupDone === 'true') return;
        group.dataset.setupDone = 'true';

        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        setupCheckboxGroupLogic(checkboxes, () => {
            updateMegaMenuTrigger(group);
            const onChangeFn = group.dataset.onChange;
            if (onChangeFn && window[onChangeFn]) window[onChangeFn]();
        });
    });

    document.querySelectorAll('.mega-menu-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.filter-dropdown, .mega-menu-dropdown').forEach(d => d.style.display = 'none');
        document.querySelectorAll('[id$="-mega-trigger"]').forEach(t => t.classList.remove('active'));
    });
};

function setupCheckboxGroupLogic(checkboxes, onUpdate) {
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.value === "" && cb.checked) {
                checkboxes.forEach(c => { if (c !== cb) c.checked = false; });
            } else if (cb.value !== "" && cb.checked) {
                const allCb = Array.from(checkboxes).find(c => c.value === "");
                if (allCb) allCb.checked = false;
            }
            onUpdate();
        });
    });
}

function updateMegaMenuTrigger(groupElement) {
    // Find the closest mega-menu
    const megaMenu = groupElement.closest('.mega-menu-dropdown');
    if (!megaMenu) return;

    // Find trigger
    const triggerId = megaMenu.id.replace('-menu', '-trigger');
    const trigger = document.getElementById(triggerId);
    if (!trigger) return;

    // Count total active filters (excluding 'All')
    const activeFilters = megaMenu.querySelectorAll('input[type="checkbox"]:checked:not([value=""])').length;
    const countBadge = trigger.querySelector('span[id$="-filter-count"]');

    if (activeFilters > 0) {
        if (countBadge) {
            countBadge.style.display = 'inline-block';
            countBadge.textContent = activeFilters;
        }
        trigger.style.background = 'var(--energy-algae)';
        trigger.style.color = '#000';
    } else {
        if (countBadge) countBadge.style.display = 'none';
        trigger.style.background = 'var(--bg-surface)';
        trigger.style.color = 'var(--text-secondary)';
    }
}

window.toggleMegaMenu = function (menuId) {
    const menu = document.getElementById(menuId);
    const trigger = document.getElementById(menuId.replace('-menu', '-trigger'));
    if (!menu || !trigger) return;

    event.stopPropagation();
    const wasOpen = menu.style.display === 'block';

    document.querySelectorAll('.filter-dropdown, .mega-menu-dropdown').forEach(d => d.style.display = 'none');
    document.querySelectorAll('[id$="-mega-trigger"]').forEach(t => t.classList.remove('active'));

    if (!wasOpen) {
        menu.style.display = 'block';
        trigger.classList.add('active');
    }
};

window.getMultiSelectValues = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .filter(v => v !== "");
};

window.toggleSortDirection = function (btnId, onChangeFn) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const isAsc = btn.dataset.dir === 'asc';
    btn.dataset.dir = isAsc ? 'desc' : 'asc';
    btn.innerHTML = isAsc ? 'arrow_downward' : 'arrow_upward';
    if (onChangeFn && window[onChangeFn]) window[onChangeFn]();
};

// Filter + re-render
window.filterActions = function () {
    const search = (document.getElementById('act-search')?.value || '').toLowerCase();
    const statusF = window.getMultiSelectValues('act-filter-status');
    const ownerF = window.getMultiSelectValues('act-filter-owner');
    const phaseF = window.getMultiSelectValues('act-filter-phase');
    const dueF = window.getMultiSelectValues('act-filter-due');
    const sortMode = document.getElementById('act-sort-select')?.value || 'due';
    const sortDir = document.getElementById('act-sort-dir')?.dataset.dir || 'asc';

    const rawData = window.getData('actions');
    if (!rawData) {
        const listC = document.getElementById('act-list-container');
        if (listC) listC.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-tertiary);"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:1rem;display:block;">hourglass_empty</span>Loading actions...</div>`;
        const kanbanC = document.getElementById('act-kanban-container');
        if (kanbanC) kanbanC.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-tertiary);grid-column: 1 / -1;"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:1rem;display:block;">hourglass_empty</span>Loading actions...</div>`;
        const ganttC = document.getElementById('act-gantt-container');
        if (ganttC) ganttC.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-tertiary);"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:1rem;display:block;">hourglass_empty</span>Loading actions...</div>`;
        return;
    }
    let actions = rawData;

    // Filter out invalid statuses created by AI agent previously
    const validStatuses = ['Planned', 'Pending', 'In Progress', 'Completed'];
    actions = actions.filter(a => validStatuses.includes(a.status));

    // Dynamic owner populate (once)
    const ownerPill = document.getElementById('act-filter-owner');
    if (ownerPill) {
        const dropdown = ownerPill.querySelector('.filter-dropdown');
        if (dropdown && dropdown.children.length <= 1) { // 1 is the "All" label
            const owners = [...new Set(actions.map(a => a.owner).filter(Boolean))].sort();
            owners.forEach(o => {
                const label = document.createElement('label');
                label.style.cssText = 'display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.5rem; font-size:0.82rem; cursor:pointer; color:var(--text-secondary);';
                label.innerHTML = `<input type="checkbox" value="${o}"> ${o}`;
                dropdown.appendChild(label);
            });
            if (ownerPill.dataset.setupDone === 'true') {
                ownerPill.dataset.setupDone = 'false';
                window.setupMultiSelectFilters();
            }
        }
    }

    if (search) actions = actions.filter(a => (a.activity || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search));
    if (statusF.length > 0) actions = actions.filter(a => statusF.includes(a.status));
    if (ownerF.length > 0) actions = actions.filter(a => ownerF.includes(a.owner));
    if (phaseF.length > 0) actions = actions.filter(a => phaseF.includes(a.phase));

    // Due date filter
    if (dueF.length > 0) {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        actions = actions.filter(a => {
            if (!a.timing?.dueDate) {
                return dueF.includes('none');
            }
            const d = new Date(a.timing.dueDate + 'T00:00:00');
            if (dueF.includes('overdue') && d < now && a.status !== 'Completed') return true;
            if (dueF.includes('7') && d >= now && d <= new Date(now.getTime() + 7 * 86400000)) return true;
            if (dueF.includes('14') && d >= now && d <= new Date(now.getTime() + 14 * 86400000)) return true;
            if (dueF.includes('30') && d >= now && d <= new Date(now.getTime() + 30 * 86400000)) return true;
            return false;
        });
    }

    // Hide completed unless "Show completed" is checked
    const showCompleted = document.getElementById('act-show-completed')?.checked;
    if (!showCompleted) {
        actions = actions.filter(a => !/^complete[d]?$/i.test(a.status || ''));
    }

    // Sort
    if (sortMode === 'due') {
        actions.sort((a, b) => {
            if (!a.timing?.dueDate) return 1;
            if (!b.timing?.dueDate) return -1;
            return new Date(a.timing.dueDate) - new Date(b.timing.dueDate);
        });
    } else if (sortMode === 'status') {
        const order = ['Pending', 'Planned', 'In Progress', 'Completed'];
        actions.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    } else if (sortMode === 'name') {
        actions.sort((a, b) => (a.activity || '').localeCompare(b.activity || ''));
    }

    if (sortDir === 'desc') actions.reverse();

    window._lastFilteredActions = actions;
    _actRenderList(actions);
    _actRenderKanban(actions);
    _actRenderGantt(actions);
};

window.setSortMode = function (mode) {
    _actSortMode = mode;
    window.filterActions();
};

// Legacy alias
window.cycleActionsSort = function () {
    const modes = ['due', 'status', 'owner'];
    _actSortMode = modes[(modes.indexOf(_actSortMode) + 1) % modes.length];
    const sel = document.getElementById('act-sort-select');
    if (sel) sel.value = _actSortMode;
    window.filterActions();
};

window.toggleActionsFilter = function () {
    _actFilterOpen = !_actFilterOpen;
    const panel = document.getElementById('act-filter-panel');
    if (panel) panel.style.display = _actFilterOpen ? 'block' : 'none';
};

window.clearActionsFilters = function () {
    ['act-filter-status', 'act-filter-owner', 'act-filter-phase', 'act-filter-due'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const allCb = el.querySelector('input[type="checkbox"][value=""]');
            if (allCb) {
                allCb.checked = true;
                // Dispatch change event to trigger UI update
                allCb.dispatchEvent(new Event('change'));
            }
        }
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
        const cb = btn.querySelector('.kanban-cb');
        if (cb) cb.textContent = 'check_box';
    } else {
        _kanbanHiddenCols.push(col);
        btn.classList.remove('active');
        btn.style.opacity = '0.4';
        const cb = btn.querySelector('.kanban-cb');
        if (cb) cb.textContent = 'check_box_outline_blank';
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
        const isCompleted = a.status === 'Completed';
        const rel = relativeDate(a.timing?.dueDate, isCompleted);
        const isOverdue = rel.isOverdue && a.status !== 'Completed';
        const objText = _actGetObjectiveText(a.commsObjectiveId);
        const dueStr = formatDate(a.timing?.dueDate);
        const advStatus = a.advancedStatus ? `<span style="font-size:0.75rem; color:${isOverdue ? '#ef4444' : 'var(--energy-algae)'};">⚠ ${a.advancedStatus}</span>` : '';
        const tags = (a.tags || []).map(t => `<span style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:100px; background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.2);">${t}</span>`).join('');

        return `<div class="act-card${isOverdue ? ' overdue' : ''}" onclick="window.viewAction('${a.id}')" style="cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                        ${rel.text ? `<span style="color:${rel.color}; font-weight:${isOverdue ? '600' : '500'}; font-size:0.8rem;">${rel.text}</span>` : ''}
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
            const isCompleted = a.status === 'Completed';
            const rel = relativeDate(a.timing?.dueDate, isCompleted);
            const isOverdue = rel.isOverdue && col !== 'Completed';
            const dueStr = formatDate(a.timing?.dueDate);
            const objText = _actGetObjectiveText(a.commsObjectiveId);
            return `<div class="act-kanban-card${isOverdue ? ' overdue' : ''}" draggable="true" data-action-id="${a.id}"
                ondragstart="event.dataTransfer.setData('text/plain','${a.id}');event.dataTransfer.effectAllowed='move';this.style.opacity='0.4'"
                ondragend="this.style.opacity='1'"
                onclick="window.viewAction('${a.id}')"
                style="cursor:grab;${col === 'Completed' ? 'border-left:3px solid #34d399;' : ''}${isOverdue ? 'border-left:3px solid #ef4444;border-color:#ef4444;background:rgba(239,68,68,0.03);' : ''}">
                <div style="font-size:0.72rem; color:${rel.color}; font-weight:${isOverdue ? '600' : '400'}; margin-bottom:0.3rem;">${rel.text}</div>
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

        return `<div class="act-kanban-col" data-status="${col}"
            ondragover="event.preventDefault();this.classList.add('kanban-drag-over')"
            ondragleave="this.classList.remove('kanban-drag-over')"
            ondrop="event.preventDefault();this.classList.remove('kanban-drag-over');window._kanbanDrop(event.dataTransfer.getData('text/plain'),'${col}')">
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

// Kanban drop handler — update action status
window._kanbanDrop = async function (actionId, newStatus) {
    const actions = window.getData('actions') || [];
    const action = actions.find(a => a.id === actionId);
    if (!action || action.status === newStatus) return;
    console.log('[Kanban] Moving', action.activity, 'from', action.status, 'to', newStatus);
    action.status = newStatus;
    window.updateData('actions', actions);

    if (window._sb) {
        try {
            await window._sb.from('tbl_action').update({ act_status: newStatus }).eq('act_id', actionId);
            console.log('[Kanban] Saved new status to DB');
        } catch (e) {
            console.error('[Kanban] Failed to save status to DB:', e);
        }
    }

    // Re-render kanban
    const filtered = window._lastFilteredActions || actions;
    _actRenderKanban(filtered);
};

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
                    <div style="position:absolute; top:0; left:${todayPct.toFixed(1)}%; width:2px; height:100%; background:#ef4444; opacity:0.3; pointer-events:none; z-index:1;"></div>
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
                <!-- Continuous "Now" red line spanning full height -->
                <div style="position:absolute; top:0; bottom:0; left:calc(${LABEL_W}px + (100% - ${LABEL_W}px) * ${todayPct / 100}); width:2px; background:#ef4444; opacity:0.25; pointer-events:none; z-index:1;"></div>
                ${headerHtml}
                ${bodyHtml || '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);font-style:italic;">No actions to display.</div>'}
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

    const oList = document.getElementById('act-f-owner-list');
    if (oList) {
        const contacts = window.getData('contacts') || [];
        oList.innerHTML = contacts.map(c => `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="window.actAddOwnerChip('${c.id}', '${c.name.replace(/'/g, "\\'")}')"><div class="avatar" style="width:24px;height:24px;font-size:0.7rem;">${c.name.charAt(0)}</div><div style="font-size:0.8rem;">${c.name}</div></div>`).join('');
    }
    const aList = document.getElementById('act-f-audience-list');
    if (aList) {
        const stakeholders = window.getData('stakeholders') || [];
        aList.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="document.getElementById(\'act-f-audience-chips\').innerHTML=\'\'; document.getElementById(\'act-f-audience-popover\').style.display=\'none\';"><div style="font-size:0.8rem; font-style:italic;">None / - Select -</div></div>' +
            stakeholders.map(c => `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="window.actAddAudienceChip('${c.id}', '${c.name.replace(/'/g, "\\'")}')"><div style="font-size:0.8rem;">${c.name}</div></div>`).join('');
    }

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

window.actAddCustomTag = function () {
    const inp = document.getElementById('act-f-custom-tag');
    const wrap = document.getElementById('act-f-tag-chips');
    if (!inp || !wrap || !inp.value.trim()) return;
    const tag = inp.value.trim();
    wrap.insertAdjacentHTML('beforeend', _adetMakeEditChip(tag, 'tag-' + Date.now()));
    inp.value = '';
};

window.actAddOwnerChip = function (id, name) {
    const wrap = document.getElementById('act-f-owner-chips');
    if (!wrap || wrap.querySelector(`[data-id="${id}"]`)) return;
    wrap.insertAdjacentHTML('beforeend', `<span class="adet-edit-chip" data-id="${id}" data-name="${name.replace(/"/g, '&quot;')}">${name} <span class="remove" onclick="this.parentElement.remove()">×</span></span>`);
    document.getElementById('act-f-owner-popover').style.display = 'none';
};

window.actAddAudienceChip = function (id, name) {
    const wrap = document.getElementById('act-f-audience-chips');
    if (!wrap || wrap.querySelector(`[data-id="${id}"]`)) return;
    wrap.insertAdjacentHTML('beforeend', `<span class="adet-edit-chip" data-id="${id}" data-name="${name.replace(/"/g, '&quot;')}">${name} <span class="remove" onclick="this.parentElement.remove()">×</span></span>`);
    document.getElementById('act-f-audience-popover').style.display = 'none';
};

window.actGranularityChange = function () {
    const val = document.getElementById('act-f-date-granularity')?.value || 'date';
    const d = document.getElementById('act-f-due-date');
    const w = document.getElementById('act-f-due-week');
    const m = document.getElementById('act-f-due-month');

    if (d) d.style.display = val === 'date' ? 'block' : 'none';
    if (w) w.style.display = val === 'week' ? 'block' : 'none';
    if (m) m.style.display = val === 'month' ? 'block' : 'none';
};

window.actOutcomeTypeChanged = function () {
    const val = document.querySelector('input[name="act-outcome-type"]:checked')?.value || 'text';
    const textEl = document.getElementById('act-outcome-text-wrap');
    const pfEl = document.getElementById('act-outcome-posture-wrap');
    const afEl = document.getElementById('act-outcome-asset-wrap');

    if (textEl) textEl.style.display = val === 'text' ? 'block' : 'none';
    if (pfEl) pfEl.style.display = val === 'posture' ? 'block' : 'none';
    if (afEl) afEl.style.display = val === 'asset' ? 'block' : 'none';

    if (val === 'posture') {
        const shSel = document.getElementById('act-f-outcome-stakeholder');
        if (shSel && shSel.options.length <= 1) {
            const stakeholders = window.getData('stakeholders') || [];
            shSel.innerHTML = '<option value="">- Select Stakeholder -</option>' + stakeholders.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (window._actPrefillOutcomeStakeholderId) {
                shSel.value = window._actPrefillOutcomeStakeholderId;
            }
        }
    }
    if (val === 'asset') {
        const datalist = document.getElementById('act-asset-datalist');
        if (datalist && datalist.options.length === 0) {
            const loadAssets = async () => {
                if (!window._sb) return;
                const { data, error } = await window._sb.from('tbl_asset').select('*');
                if (!error && data) {
                    datalist.innerHTML = data.map(ast => `<option value="${ast.ass_title || ast.ass_id}"></option>`).join('');
                }
            };
            loadAssets();
        }
    }
};

function _actClearModal() {
    const fields = ['act-f-title', 'act-f-description', 'act-f-desired-outcome', 'act-f-outcome-posture', 'act-f-outcome-asset', 'act-f-kpi', 'act-f-due-date', 'act-f-due-week', 'act-f-due-month', 'act-f-due-time', 'act-f-due-text', 'act-f-start-date', 'act-f-predicted-length', 'act-f-resource', 'act-f-vc-progress', 'act-f-vc-blockers', 'act-f-other'];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const sel = document.getElementById('act-f-status');
    if (sel) sel.value = 'Pending';
    const obj = document.getElementById('act-f-objective');
    if (obj) obj.value = '';
    const gran = document.getElementById('act-f-date-granularity');
    if (gran) { gran.value = 'date'; if (window.actGranularityChange) window.actGranularityChange(); }
    const outType = document.querySelector('input[name="act-outcome-type"][value="text"]');
    if (outType) { outType.checked = true; if (window.actOutcomeTypeChanged) window.actOutcomeTypeChanged(); }
    document.getElementById('act-f-todos').innerHTML = '';
    document.getElementById('act-f-prereqs').innerHTML = '';
    document.getElementById('act-f-audience-chips').innerHTML = '';
    document.getElementById('act-f-owner-chips').innerHTML = '';
    document.querySelectorAll('input[name="act-privacy"]').forEach(r => { r.checked = r.value === 'Public/Official'; });
    document.querySelectorAll('.act-tag-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('act-f-tag-chips').innerHTML = '';
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
    set('act-f-outcome-posture', a.desiredPosture);
    set('act-f-outcome-asset', a.desiredOutcomeAsset);
    set('act-f-kpi', a.kpiTarget);

    // Timing handling
    const gran = a.timing?.granularity || 'date';
    const granEl = document.getElementById('act-f-date-granularity');
    if (granEl) { granEl.value = gran; if (window.actGranularityChange) window.actGranularityChange(); }

    if (a.timing?.dueDate) {
        try {
            const d = new Date(a.timing.dueDate);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');

                if (gran === 'month') set('act-f-due-month', `${yyyy}-${mm}`);
                else if (gran === 'week') {
                    // Approximate week number for filling
                    const firstDay = new Date(d.getFullYear(), 0, 1);
                    const pastDays = (d - firstDay) / 86400000;
                    const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
                    set('act-f-due-week', `${yyyy}-W${String(weekNum).padStart(2, '0')}`);
                } else set('act-f-due-date', `${yyyy}-${mm}-${dd}`);

                if (hh !== '00' || min !== '00') set('act-f-due-time', `${hh}:${min}`);
            }
        } catch (e) { }
    }
    set('act-f-due-text', a.timing?.dueDateDisplay || '');
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

    const outType = a.desiredOutcomeType || 'text';
    const outRadio = document.querySelector(`input[name="act-outcome-type"][value="${outType}"]`);
    if (outRadio) { outRadio.checked = true; if (window.actOutcomeTypeChanged) window.actOutcomeTypeChanged(); }

    // We must wait for stakeholder select to populate before setting it, or set it directly if possible
    window._actPrefillOutcomeStakeholderId = a.desiredOutcomeStakeholderId;

    // Privacy
    document.querySelectorAll('input[name="act-privacy"]').forEach(r => { r.checked = r.value === a.privacy; });

    // Tags
    document.querySelectorAll('.act-tag-btn').forEach(btn => {
        const tag = btn.textContent.trim().replace(/^[^\s]+\s/, '');
        btn.classList.toggle('active', (a.tags || []).includes(tag.trim()));
    });

    const tagChips = document.getElementById('act-f-tag-chips');
    if (tagChips) {
        const presetNames = ['Financial', 'Comms', 'Legal', 'Strategy'];
        const custom = (a.tags || []).filter(t => !presetNames.includes(t));
        tagChips.innerHTML = custom.map(t => _adetMakeEditChip(t, 'tag-' + Date.now() + Math.random())).join('');
    }

    // Audience chips
    const audContainer = document.getElementById('act-f-audience-chips');
    if (audContainer) {
        audContainer.innerHTML = (a.audienceIds || []).map((id, i) => {
            const name = (a.audience && a.audience[i]) ? a.audience[i] : id;
            return `<span class="adet-edit-chip" data-id="${id}" data-name="${name.replace(/"/g, '&quot;')}">${name} <span class="remove" onclick="this.parentElement.remove()">×</span></span>`;
        }).join('');
    }

    // Owner chips
    const ownContainer = document.getElementById('act-f-owner-chips');
    if (ownContainer) {
        ownContainer.innerHTML = (a.ownerIds || []).map((id, i) => {
            const names = a.owner ? a.owner.split('+').map(o => o.trim()) : [];
            const name = names[i] || id;
            return `<span class="adet-edit-chip" data-id="${id}" data-name="${name.replace(/"/g, '&quot;')}">${name} <span class="remove" onclick="this.parentElement.remove()">×</span></span>`;
        }).join('');
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

    const getTags = () => {
        const presets = Array.from(document.querySelectorAll('.act-tag-btn.active')).map(b => b.textContent.trim().replace(/^[^\s]*\s/, ''));
        const custom = Array.from(document.querySelectorAll('#act-f-tag-chips .adet-edit-chip')).map(c => c.textContent.replace('×', '').trim());
        return [...new Set([...presets, ...custom])];
    };
    const getOwnerIds = () => Array.from(document.querySelectorAll('#act-f-owner-chips .adet-edit-chip')).map(c => c.dataset.id.replace('c', ''));
    const getOwner = () => Array.from(document.querySelectorAll('#act-f-owner-chips .adet-edit-chip')).map(c => c.dataset.name).join(' + ');

    const getAudienceIds = () => Array.from(document.querySelectorAll('#act-f-audience-chips .adet-edit-chip')).map(c => c.dataset.id);
    const getAudience = () => Array.from(document.querySelectorAll('#act-f-audience-chips .adet-edit-chip')).map(c => c.dataset.name);

    const getTodos = () => Array.from(document.querySelectorAll('#act-f-todos > div')).map((row, i) => ({
        id: row.id.replace('todo-row-', '') || ('t' + i),
        completed: row.querySelector('input[type=checkbox]')?.checked || false,
        detail: row.querySelector('input[type=text]')?.value || ''
    }));
    const getPrivacy = () => document.querySelector('input[name="act-privacy"]:checked')?.value || 'Public/Official';

    // Granularity & Due Date Extraction
    const gran = document.getElementById('act-f-date-granularity')?.value || 'date';
    let finalDueDate = '';

    let activeInputId = 'act-f-due-date';
    if (gran === 'week') activeInputId = 'act-f-due-week';
    if (gran === 'month') activeInputId = 'act-f-due-month';

    const dateInp = document.getElementById(activeInputId);
    const timeInp = document.getElementById('act-f-due-time');

    if (dateInp && dateInp.value) {
        let val = dateInp.value;
        let timeStr = (timeInp && timeInp.value) ? timeInp.value : '00:00';
        try {
            if (gran === 'month') {
                const d = new Date(`${val}-01T${timeStr}:00`);
                if (!isNaN(d.getTime())) finalDueDate = d.toISOString();
            } else if (gran === 'week') {
                const [y, w] = val.split('-W');
                if (y && w) {
                    const simpleD = new Date(parseInt(y), 0, 1 + (parseInt(w) - 1) * 7);
                    simpleD.setHours(parseInt(timeStr.split(':')[0] || 0), parseInt(timeStr.split(':')[1] || 0));
                    finalDueDate = simpleD.toISOString();
                }
            } else {
                const d = new Date(`${val}T${timeStr}:00`);
                if (!isNaN(d.getTime())) finalDueDate = d.toISOString();
            }
        } catch (e) { }
    }
    const finalDueDisplay = document.getElementById('act-f-due-text')?.value || '';

    const updates = {
        activity: document.getElementById('act-f-title')?.value || 'Untitled',
        description: document.getElementById('act-f-description')?.value || '',
        ownerIds: getOwnerIds(),
        owner: getOwner() || document.getElementById('act-f-title')?.value,
        audienceIds: getAudienceIds(),
        audience: getAudience(),
        status: document.getElementById('act-f-status')?.value || 'Pending',
        tags: getTags(),
        priority: document.getElementById('act-f-priority')?.value || 'Medium',
        complexity: document.getElementById('act-f-complexity')?.value || '3',
        commsObjectiveId: document.getElementById('act-f-objective')?.value || '',
        desiredOutcome: document.getElementById('act-f-desired-outcome')?.value || '',
        desiredOutcomeType: document.querySelector('input[name="act-outcome-type"]:checked')?.value || 'text',
        desiredOutcomeStakeholderId: document.getElementById('act-f-outcome-stakeholder')?.value || '',
        desiredPosture: document.getElementById('act-f-outcome-posture')?.value || '',
        desiredOutcomeAsset: document.getElementById('act-f-outcome-asset')?.value || '',
        kpiTarget: document.getElementById('act-f-kpi')?.value || '',
        timing: {
            granularity: gran,
            dueDate: finalDueDate,
            dueDateDisplay: finalDueDisplay,
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
    let actions = window.getData('actions') || [];
    let a = actions.find(x => x.id === id);

    if (window.isAddingAction) {
        a = {
            id: 'new-' + Date.now(),
            activity: 'New Action',
            status: 'Pending',
            description: '',
            audience: [],
            owner: '',
            tags: [],
            timing: {},
            versionControl: {},
            commsObjectiveId: null,
            _isNew: true
        };
        actions.push(a); // Temporarily store in memory so openActionDetailEdit can find it
        window.currentActionId = a.id;
    } else if (!a) {
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
    const ownerCircle = document.getElementById('adet-owner-circle');
    const owners = a.owner ? a.owner.split('+').map(o => o.trim()).filter(Boolean) : [];

    // Populate owner name badge
    const ownerBadge = document.getElementById('adet-owner-badge');
    const ownerNameEl = document.getElementById('adet-owner-name');
    if (ownerBadge && ownerNameEl) {
        const primaryOwner = owners[0] || 'Unassigned';
        const ownerColor = _adetOwnerColors[primaryOwner] || 'var(--energy-algae)';
        ownerBadge.style.background = ownerColor;
        ownerNameEl.textContent = primaryOwner;
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
    const granPill = document.getElementById('adet-granularity-pill');
    if (granPill) granPill.style.display = 'none';

    let dueDisplay = '—';
    if (a.timing?.dueDate) {
        const d = new Date(a.timing.dueDate);
        if (!isNaN(d.getTime())) {
            dueDisplay = d.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' at');
        }
    }
    txt('adet-due-display', dueDisplay);

    // Show relative date below
    const dueDetailEl = document.getElementById('adet-due-detail');
    if (dueDetailEl) {
        const isCompleted = a.status === 'Completed';
        // Note: relativeDate is a helper, but we might just use the vague text if provided
        const vagueText = a.timing?.dueDateDisplay;
        const rel = window.relativeDate ? window.relativeDate(a.timing?.dueDate, isCompleted) : { text: '', color: '' };

        if (vagueText) {
            dueDetailEl.textContent = vagueText;
            dueDetailEl.style.color = 'var(--text-secondary)';
        } else if (a.timing?.dueDate && rel.text) {
            dueDetailEl.textContent = rel.text;
            dueDetailEl.style.color = rel.color;
        } else {
            dueDetailEl.textContent = '';
        }
        dueDetailEl.style.display = (vagueText || a.timing?.dueDate) ? '' : 'none';
    }

    // ── Populate inline metadata row ──
    const audInline = document.getElementById('adet-audience-inline');
    if (audInline) {
        audInline.textContent = a.audience && a.audience.length > 0 ? a.audience.join(', ') : '—';
    }
    const objInline = document.getElementById('adet-objective-inline');
    if (objInline) {
        const spine = window.getData('spine') || {};
        const obj = (spine.objectives || []).find(o => o.id === a.commsObjectiveId);
        objInline.textContent = obj ? obj.text : '—';
        objInline.title = obj ? obj.text : '';
    }
    const dueInline = document.getElementById('adet-due-inline');
    if (dueInline) dueInline.textContent = dueDisplay;
    const dueRelInline = document.getElementById('adet-due-relative-inline');
    if (dueRelInline && a.timing?.dueDate) {
        const isCompleted = a.status === 'Completed';
        const rel = relativeDate(a.timing.dueDate, isCompleted);
        dueRelInline.textContent = rel.text;
        dueRelInline.style.color = rel.color;
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
    // Handlers and renderer defined below

    // New Todo Handlers
    window._renderInlineTodos = function () {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action) return;
        const tds = action.todos || [];

        const done = tds.filter(t => t.completed).length;
        const pct = tds.length > 0 ? Math.round((done / tds.length) * 100) : 0;
        const progText = document.getElementById('adet-todo-progress-text');
        if (progText) progText.textContent = tds.length > 0 ? `${done}/${tds.length} complete — ${pct}%` : 'No items';
        const progFill = document.getElementById('adet-todo-progress-fill');
        if (progFill) progFill.style.width = pct + '%';

        const todosEl = document.getElementById('adet-todos');
        if (todosEl) {
            todosEl.innerHTML = tds.length > 0
                ? tds.map((t, i) => `<div class="adet-todo-item${t.completed ? ' done' : ''}" style="display:flex;align-items:center;gap:0.4rem;">
                    <span class="material-symbols-outlined adet-todo-check" style="color:${t.completed ? 'var(--energy-algae)' : 'var(--text-tertiary)'};cursor:pointer;"
                        onclick="window._toggleTodo(${i})">
                        ${t.completed ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <input type="text" value="${(t.detail || '').replace(/"/g, '&quot;')}" onchange="window._editTodo(${i}, this.value)" style="flex:1; border:none; background:transparent; font-family:inherit; font-size:inherit; color:inherit; text-decoration:${t.completed ? 'line-through' : 'none'}; outline:none; padding:0.2rem;" placeholder="To-do item...">
                    <div style="display:flex; flex-direction:column; gap:0;">
                        <span class="material-symbols-outlined" style="font-size:0.9rem; cursor:pointer; color:var(--text-tertiary); line-height:0.8;" onclick="window._moveTodo(${i}, -1)">keyboard_arrow_up</span>
                        <span class="material-symbols-outlined" style="font-size:0.9rem; cursor:pointer; color:var(--text-tertiary); line-height:0.8;" onclick="window._moveTodo(${i}, 1)">keyboard_arrow_down</span>
                    </div>
                  </div>`).join('')
                : '<span class="adet-chip-empty" style="padding:0.5rem 0;">No to-do items added.</span>';
        }
    };

    window._showInlineSave = function () {
        const btn = document.getElementById('adet-todo-save-btn');
        if (btn) btn.style.display = 'inline-flex';
    };

    window._toggleTodo = function (index) {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action || !action.todos || !action.todos[index]) return;
        action.todos[index].completed = !action.todos[index].completed;
        window.updateData('actions', actions); // Save to local cache
        window._showInlineSave();
        window._renderInlineTodos();
    };

    window._editTodo = function (index, val) {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action || !action.todos || !action.todos[index]) return;
        action.todos[index].detail = val;
        window.updateData('actions', actions);
        window._showInlineSave();
    };

    window._moveTodo = function (index, dir) {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action || !action.todos) return;
        if (index + dir < 0 || index + dir >= action.todos.length) return;

        const temp = action.todos[index];
        action.todos[index] = action.todos[index + dir];
        action.todos[index + dir] = temp;

        window.updateData('actions', actions);
        window._showInlineSave();
        window._renderInlineTodos();
    };

    window._addInlineTodo = function () {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action) return;
        if (!action.todos) action.todos = [];
        action.todos.push({ id: 't' + Date.now(), detail: '', completed: false });
        window.updateData('actions', actions);
        window._showInlineSave();
        window._renderInlineTodos();
    };

    window._saveInlineTodos = async function () {
        const actions = window.getData('actions') || [];
        const action = actions.find(x => x.id === window.currentActionId);
        if (!action) return;

        const btn = document.getElementById('adet-todo-save-btn');
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:0.9rem;">autorenew</span> Saving...';

        if (window._sb && action.originalId) {
            const { error } = await window._sb.from('tbl_action')
                .update({ ac_todos: action.todos })
                .eq('ac_original_id', action.originalId)
                .eq('ac_active', true);
            if (error) {
                console.error('Todo save error:', error);
                alert('Failed to save to-dos: ' + error.message);
                if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.9rem;">error</span> Error';
                return;
            }
        } else {
            console.warn('No Supabase connection or originalId missing');
        }
        if (btn) {
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.9rem;">check</span> Saved!';
            setTimeout(() => { if (btn) { btn.style.display = 'none'; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.9rem;">save</span> Save'; } }, 1500);
        }
    };

    // Initial render call
    window._renderInlineTodos();


    // Show/hide todo section
    // To-Do section always visible (even when empty)

    // Progress form handlers
    window.adetShowUpdateLogForm = function () {
        window.currentInteractionId = null;
        window._prefillStakeholderId = '';
        window._prefillActionId = window.currentActionId;

        loadView('interaction_detail');
        setTimeout(() => {
            if (typeof window.toggleInteractionEdit === 'function') {
                window.toggleInteractionEdit();
            }
        }, 100);
    };

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

    if (window.isAddingAction) {
        window.openActionDetailEdit();
    } else {
        const vMode = document.getElementById('adet-view-mode');
        const eMode = document.getElementById('adet-edit-mode');
        if (vMode) vMode.style.display = '';
        if (eMode) eMode.style.display = 'none';

        const btnEdit = document.getElementById('adet-header-edit-btn');
        if (btnEdit) {
            btnEdit.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            btnEdit.setAttribute('onclick', 'window.openActionDetailEdit()');
        }

        const btnCancel = document.getElementById('adet-header-cancel-btn');
        if (btnCancel) btnCancel.remove();
    }
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
    return `<div style="display:flex;align-items:center;gap:0.5rem;" id="adet-todo-e-${id}" class="adet-todo-row">
        <div style="display:flex;flex-direction:column;gap:0;color:var(--text-tertiary);cursor:pointer;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size:1.2rem;line-height:0.6;font-weight:600;" onclick="window.adetMoveTodoUp('${id}')">keyboard_arrow_up</span>
            <span class="material-symbols-outlined" style="font-size:1.2rem;line-height:0.6;font-weight:600;" onclick="window.adetMoveTodoDown('${id}')">keyboard_arrow_down</span>
        </div>
        <input type="checkbox" ${completed ? 'checked' : ''} style="flex-shrink:0;cursor:pointer;width:16px;height:16px;">
        <input type="text" value="${(detail || '').replace(/"/g, '&quot;')}" placeholder="To-do item…"
            style="flex:1;padding:0.3rem 0.55rem;border:1px solid var(--border-subtle);background:var(--bg-app);color:var(--text-primary);border-radius:5px;font-size:0.82rem;font-family:inherit;">
        <button type="button" onclick="document.getElementById('adet-todo-e-${id}').remove()"
            style="background:#ef4444;border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">−</button>
    </div>`;
}

window.adetMoveTodoUp = function (id) {
    const row = document.getElementById('adet-todo-e-' + id);
    if (row && row.previousElementSibling && row.previousElementSibling.classList.contains('adet-todo-row')) {
        row.parentNode.insertBefore(row, row.previousElementSibling);
    }
};

window.adetMoveTodoDown = function (id) {
    const row = document.getElementById('adet-todo-e-' + id);
    if (row && row.nextElementSibling && row.nextElementSibling.classList.contains('adet-todo-row')) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
    }
};

// ── window.openActionDetailEdit ──────────────────────────────────────

window._adetAddOwnerChip = function (id, name) {
    const chips = document.getElementById('adet-e-owner-chips');
    if (!chips) return;
    if (chips.querySelector(`[data-id="${id}"]`)) return; // already added
    const div = document.createElement('div');
    div.dataset.id = id;
    div.dataset.name = name;
    div.className = 'adet-edit-chip';
    div.innerHTML = `👤 ${name} <span class="adet-edit-chip-x" onclick="this.closest('.adet-edit-chip').remove()">×</span>`;
    chips.appendChild(div);
    document.getElementById('adet-e-owner-popover').style.display = 'none';
};

window._adetAddAudienceChip = function (id, name) {
    const chips = document.getElementById('adet-e-audience-chips');
    if (!chips) return;
    if (chips.querySelector(`[data-id="${id}"]`)) return; // already added
    const div = document.createElement('div');
    div.dataset.id = id;
    div.dataset.name = name;
    div.className = 'adet-edit-chip';
    div.innerHTML = `🏛 ${name} <span class="adet-edit-chip-x" onclick="this.closest('.adet-edit-chip').remove()">×</span>`;
    chips.appendChild(div);
    document.getElementById('adet-e-audience-popover').style.display = 'none';
};

window.openActionDetailEdit = function () {
    try {
        const id = window.currentActionId;
        if (!id) return;
        const actions = window.getData('actions') || [];
        const a = actions.find(x => x.id === id);
        if (!a) return;
        window._adetOriginal = JSON.parse(JSON.stringify(a));

        // Populate popovers
        const oList = document.getElementById('adet-e-owner-list');
        if (oList) {
            const contacts = window.getData('contacts') || [];
            oList.innerHTML = contacts.map(c => `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="window._adetAddOwnerChip('${c.id}', '${c.name.replace(/'/g, "\\'")}')"><div class="avatar" style="width:24px;height:24px;font-size:0.7rem;">${c.name.charAt(0)}</div><div style="font-size:0.8rem;">${c.name}</div></div>`).join('');
        }
        const aList = document.getElementById('adet-e-audience-list');
        if (aList) {
            const stakeholders = window.getData('stakeholders') || [];
            aList.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="document.getElementById(\'adet-e-audience-chips\').innerHTML=\'\'; document.getElementById(\'adet-e-audience-popover\').style.display=\'none\';"><div style="font-size:0.8rem; font-style:italic;">None / - Select -</div></div>' +
                stakeholders.map(c => `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:4px; cursor:pointer;" class="sdet-hover-bg" onclick="window._adetAddAudienceChip('${c.id}', '${c.name.replace(/'/g, "\\'")}')"><div style="font-size:0.8rem;">${c.name}</div></div>`).join('');
        }

        _adetPopulateStakeholderSelect();


        // Update header button to Done + add Cancel
        const editBtn = document.getElementById('adet-header-edit-btn');
        if (editBtn) {
            editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done';
            editBtn.setAttribute('onclick', 'window.adetSave()');
            // Add Cancel button if not already present
            if (!document.getElementById('adet-header-cancel-btn')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'adet-header-cancel-btn';
                cancelBtn.className = 'btn-secondary';
                cancelBtn.style.cssText = 'display:inline-flex;align-items:center;gap:0.4rem;';
                cancelBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">close</span> Cancel';
                cancelBtn.onclick = function () { window.adetCancelEdit(); };
                editBtn.parentNode.insertBefore(cancelBtn, editBtn);
            }
        }

        _adetPopulateObjectiveSelect();
        _adetPopulateStakeholderSelect();

        const set = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };

        // Modal title
        const mt = document.getElementById('adet-modal-title-display');
        if (mt) mt.textContent = a.activity;

        // Definition
        set('adet-e-title', a.activity);
        set('adet-e-description', a.description);

        const ownerChips = document.getElementById('adet-e-owner-chips');
        if (ownerChips) {
            ownerChips.innerHTML = '';
            const contacts = window.getData('contacts') || [];
            const oIds = a.ownerIds || [];
            oIds.forEach(id => {
                const c = contacts.find(x => x.id == id) || { id, name: 'Unknown' };
                window._adetAddOwnerChip(c.id, c.name);
            });
        }

        // Populate Audience
        const audChips = document.getElementById('adet-e-audience-chips');
        if (audChips) {
            audChips.innerHTML = '';
            const stakeholders = window.getData('stakeholders') || [];
            const aIds = a.audienceIds || [];
            aIds.forEach(id => {
                const s = stakeholders.find(x => x.id == id) || { id, name: 'Unknown' };
                window._adetAddAudienceChip(s.id, s.name);
            });
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
        const arrTags = Array.isArray(a.tags) ? a.tags : (typeof a.tags === 'string' ? a.tags.split(',').map(x => x.trim()) : []);
        document.querySelectorAll('.adet-tag-preset-btn').forEach(btn => {
            const tag = btn.textContent.trim().replace(/^[^\s]+\s/, '').trim();
            btn.classList.toggle('active', arrTags.some(t => t.trim() === tag));
        });
        // Custom tags (non-preset)
        const presets = ['Comms', 'Financial', 'Legal', 'Strategy'];
        const customTags = arrTags.filter(t => !presets.includes(t.trim()));
        const tagChipsEl = document.getElementById('adet-e-tag-chips');
        if (tagChipsEl) tagChipsEl.innerHTML = customTags.map((t, i) => _adetMakeEditChip(t, 'ctag-' + i)).join('');

        // Desired Outcome type
        const typeVal = a.desiredOutcomeType || 'text';
        const typeSel = document.getElementById('adet-outcome-type-select');
        if (typeSel) typeSel.value = typeVal;
        window.adetOutcomeTypeChanged();
        set('adet-e-outcome', a.desiredOutcome);
        const sh = document.getElementById('adet-e-outcome-stakeholder');
        if (sh) sh.value = a.desiredOutcomeStakeholderId || '';
        set('adet-e-outcome-posture', a.desiredPosture);
        set('adet-e-outcome-asset', a.desiredOutcomeAsset);
        set('adet-e-kpi', a.successCriteria || a.kpiTarget);

        // Due date Granularity & Time
        const gran = a.timing?.granularity || 'date';
        if (window.adetSetGranularity) {
            window.adetSetGranularity(['date', 'week', 'month'].includes(gran) ? gran : 'date');
        } else {
            const granInp = document.getElementById('adet-e-date-granularity');
            if (granInp) granInp.value = gran;
            if (window.adetGranularityChange) window.adetGranularityChange();
        }

        if (a.timing?.dueDate) {
            let datePart = a.timing.dueDate;
            let timePart = '';
            if (a.timing.dueDate.includes('T')) {
                const parts = a.timing.dueDate.split('T');
                datePart = parts[0];
                timePart = parts[1].substring(0, 5); // HH:mm
                // If the time is explicitly exactly "00:00", we assume it was cleared.
                if (timePart === '00:00') timePart = '';
            } else if (a.timing.dueDate.includes(' ')) {
                const parts = a.timing.dueDate.split(' ');
                datePart = parts[0];
                timePart = parts[1].substring(0, 5);
                if (timePart === '00:00') timePart = '';
            }

            if (gran === 'month') {
                set('adet-e-due-month', datePart.substring(0, 7)); // YYYY-MM
            } else if (gran === 'week') {
                set('adet-e-due-date', datePart); // YYYY-MM-DD
                try {
                    const d = new Date(datePart);
                    const tempD = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                    tempD.setUTCDate(tempD.getUTCDate() + 4 - (tempD.getUTCDay() || 7));
                    const yearStart = new Date(Date.UTC(tempD.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((tempD - yearStart) / 86400000) + 1) / 7);
                    set('adet-e-due-week', `${tempD.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`);
                } catch (e) { }
            } else {
                set('adet-e-due-date', datePart); // YYYY-MM-DD
            }
            set('adet-e-due-time', timePart); // HH:mm
        } else {
            set('adet-e-due-date', '');
            set('adet-e-due-week', '');
            set('adet-e-due-month', '');
            set('adet-e-due-time', '');
        }
        set('adet-e-due-text', a.timing?.dueDateDisplay || '');

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

        const viewMode = document.getElementById('adet-view-mode');
        const editMode = document.getElementById('adet-edit-mode');
        if (viewMode) viewMode.style.display = 'none';
        if (editMode) editMode.style.display = 'block';

        const saveBar = document.getElementById('adet-floating-save-bar');
        if (saveBar) saveBar.style.display = 'flex';

    } catch (e) {
        console.error('Error opening edit mode:', e);
        alert('Error opening edit mode: ' + e.message);
    }
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
    const inp = document.getElementById('adet-e-custom-tag');
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
    const sel = document.getElementById('adet-outcome-type-select');
    const val = sel ? sel.value : 'text';
    const textEl = document.getElementById('adet-e-outcome-text-wrap');
    const pfEl = document.getElementById('adet-e-outcome-posture-wrap');
    const afEl = document.getElementById('adet-e-outcome-asset-wrap');

    if (textEl) textEl.style.display = val === 'text' ? 'block' : 'none';
    if (pfEl) pfEl.style.display = val === 'posture' ? 'block' : 'none';
    if (afEl) afEl.style.display = val === 'asset' ? 'block' : 'none';

    // If posture is chosen and no stakeholders loaded yet, populate it:
    if (val === 'posture') {
        const shSel = document.getElementById('adet-e-outcome-stakeholder');
        if (shSel && shSel.options.length <= 1) {
            const stakeholders = window.getData('stakeholders') || [];
            shSel.innerHTML = '<option value="">- Select Stakeholder -</option>' + stakeholders.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (window._adetOriginal?.desiredOutcomeStakeholderId) shSel.value = window._adetOriginal.desiredOutcomeStakeholderId;
        }
    }
    // If asset is chosen and select is empty, populate it:
    if (val === 'asset') {
        const assetSel = document.getElementById('adet-e-outcome-asset');
        if (assetSel && assetSel.options.length <= 1) {
            const loadAssets = async () => {
                if (!window._sb) return;
                const { data, error } = await window._sb.from('tbl_asset').select('*');
                if (!error && data) {
                    assetSel.innerHTML = '<option value="">- Select Asset -</option>' + data.map(ast => `<option value="${ast.as_id}">${ast.as_description}</option>`).join('');
                    if (window._adetOriginal?.desiredOutcomeAsset) assetSel.value = window._adetOriginal.desiredOutcomeAsset;
                }
            };
            loadAssets();
        }
    }
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

window.adetAddTodo = function () {
    const el = document.getElementById('adet-e-todos');
    if (el) el.insertAdjacentHTML('beforeend', _adetMakeEditTodoRow('new-' + Date.now(), false, ''));
};

window.adetSetGranularity = function (gran) {
    document.getElementById('adet-e-date-granularity').value = gran;
    document.querySelectorAll('#adet-e-gran-seg .adet-seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gran === gran);
    });
    window.adetGranularityChange();
};

window.adetGranularityChange = function () {
    const gran = document.getElementById('adet-e-date-granularity').value;
    const d = document.getElementById('adet-e-due-date');
    const w = document.getElementById('adet-e-due-week');
    const m = document.getElementById('adet-e-due-month');
    if (d) d.style.display = (gran === 'date') ? 'block' : 'none';
    if (w) w.style.display = (gran === 'week') ? 'block' : 'none';
    if (m) m.style.display = (gran === 'month') ? 'block' : 'none';
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
    const viewMode = document.getElementById('adet-view-mode');
    const editMode = document.getElementById('adet-edit-mode');
    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    // Restore header button to Edit mode
    const editBtn = document.getElementById('adet-header-edit-btn');
    if (editBtn) {
        editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
        editBtn.setAttribute('onclick', 'window.openActionDetailEdit()');
    }
    // Remove Cancel button
    const cancelBtn = document.getElementById('adet-header-cancel-btn');
    if (cancelBtn) cancelBtn.remove();

    // Hide floating save bar
    const saveBar = document.getElementById('adet-floating-save-bar');
    if (saveBar) saveBar.style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adetRevert = function () {
    if (window._adetOriginal) window.openActionDetailEdit();
};

window.adetCancelEdit = function () {
    if (window.isAddingAction) {
        window.isAddingAction = false;
        let actions = window.getData('actions') || [];
        actions = actions.filter(x => x.id !== window.currentActionId);
        window.updateData('actions', actions);
        loadView('actions');
        history.pushState(null, '', '#actions');
        return;
    }

    // Revert the action data to the snapshot taken when Edit was clicked
    if (window._adetOriginal) {
        const actions = window.getData('actions') || [];
        const idx = actions.findIndex(x => x.id === window.currentActionId);
        if (idx !== -1) {
            actions[idx] = window._adetOriginal;
            window.updateData('actions', actions);
        }
    }
    window.closeActionDetailEdit();
    renderActionDetail();
};

window.adetSave = async function () {
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

    // Collect IDs from Chips
    const ownerIds = Array.from(document.querySelectorAll('#adet-e-owner-chips .adet-edit-chip')).map(c => c.dataset.id);
    const owner = Array.from(document.querySelectorAll('#adet-e-owner-chips .adet-edit-chip')).map(c => c.dataset.name).join(' + ');

    const audienceIds = Array.from(document.querySelectorAll('#adet-e-audience-chips .adet-edit-chip')).map(c => c.dataset.id);
    const audience = Array.from(document.querySelectorAll('#adet-e-audience-chips .adet-edit-chip')).map(c => c.dataset.name);

    // Granularity & Due Date Extraction
    const gran = document.getElementById('adet-e-date-granularity')?.value || 'date';
    let finalDueDate = '';

    let activeInputId = 'adet-e-due-date';
    if (gran === 'week') activeInputId = 'adet-e-due-week';
    if (gran === 'month') activeInputId = 'adet-e-due-month';

    const dateInp = document.getElementById(activeInputId);
    const timeInp = document.getElementById('adet-e-due-time');

    if (dateInp && dateInp.value) {
        let val = dateInp.value; // YYYY-MM-DD or YYYY-MM or YYYY-Www
        let timeStr = (timeInp && timeInp.value) ? timeInp.value : '00:00';

        try {
            if (gran === 'month') {
                finalDueDate = `${val}-01T${timeStr}:00`;
            } else if (gran === 'week') {
                // simple week to date parser (fallback to today if invalid)
                const [y, w] = val.split('-W');
                if (y && w) {
                    const simpleD = new Date(parseInt(y), 0, 1 + (parseInt(w) - 1) * 7);
                    const m = String(simpleD.getMonth() + 1).padStart(2, '0');
                    const d = String(simpleD.getDate()).padStart(2, '0');
                    finalDueDate = `${simpleD.getFullYear()}-${m}-${d}T${timeStr}:00`;
                }
            } else {
                finalDueDate = `${val}T${timeStr}:00`;
            }
        } catch (e) { }
    }

    const textInp = document.getElementById('adet-e-due-text');
    const finalDueDisplay = textInp ? textInp.value : '';

    // Collect todos
    const getTodos = () => Array.from(document.querySelectorAll('[id^="adet-todo-e-"]')).map((row, i) => ({
        id: row.id.replace('adet-todo-e-', '') || 't' + i,
        completed: row.querySelector('input[type=checkbox]')?.checked || false,
        detail: row.querySelector('input[type=text]')?.value || ''
    }));

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
        ownerIds: ownerIds,
        audienceIds: audienceIds,
        owner: owner,
        audience: audience,
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
        successCriteria: orig.successCriteria || '',
        kpiTarget: document.getElementById('adet-e-kpi')?.value || '',
        timing: {
            granularity: gran,
            dueDate: finalDueDate,
            dueDateDisplay: finalDueDisplay,
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

    const saveBtns = document.querySelectorAll('[onclick="window.adetSave()"]');
    const originalTexts = [];
    saveBtns.forEach((btn, i) => {
        originalTexts[i] = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:0.9rem;">autorenew</span> Saving...';
    });

    window.updateData('actions', actions);

    // Insert DB call
    if (window.updateActionDB) {
        await window.updateActionDB(actions[idx], window.isAddingAction);
        if (typeof fetchActions === 'function' && window._sb) {
            const fresh = await fetchActions();
            if (fresh) {
                _sbCache.actions = fresh;
                window.updateData('actions', fresh);
            }
        }
    }

    if (saveBtns.length > 0) {
        saveBtns.forEach(btn => {
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Saved!';
            btn.style.background = 'var(--energy-algae)';
        });
        setTimeout(() => {
            saveBtns.forEach((btn, i) => {
                btn.innerHTML = originalTexts[i];
                btn.style.background = '';
                btn.disabled = false;
            });
            window.isAddingAction = false;
            window.closeActionDetailEdit();
            renderActionDetail();
        }, 800);
    } else {
        window.isAddingAction = false;
        window.closeActionDetailEdit();
        renderActionDetail();
    }
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

// Archive: soft-delete via _active=false
window.adetArchive = function () {
    const id = window.currentActionId;
    if (!id) return;
    if (!confirm('Archive this action? It will be hidden from active views.')) return;
    let actions = window.getData('actions') || [];
    const action = actions.find(x => x.id === id);
    if (action) {
        action._active = false;
        window.updateData('actions', actions);
    }
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

    // Render pending actions in User Prompts tab
    if (tab === 'user') {
        window._renderPendingActions();
    }
};

window._renderPendingActions = function () {
    const userView = document.getElementById('appr-view-user');
    if (!userView) return;
    const actions = (window.getData('actions') || []).filter(a => a.status === 'Pending');

    if (actions.length === 0) {
        userView.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 2rem; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:14px;">
            <span class="material-symbols-outlined" style="font-size:3rem; color:var(--text-tertiary); margin-bottom:1rem; opacity:0.5;">task_alt</span>
            <p style="font-size:1.1rem; font-weight:600; color:var(--text-primary); margin:0 0 0.5rem 0;">You're all caught up</p>
            <p style="font-size:0.9rem; color:var(--text-tertiary); margin:0;">No pending actions to review.</p>
        </div>`;
        return;
    }

    userView.innerHTML = `<div style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-tertiary);">${actions.length} pending action${actions.length > 1 ? 's' : ''} awaiting approval</div>` +
        actions.map(a => {
            const dueStr = a.timing?.dueDate ? formatDate(a.timing.dueDate) : '—';
            return `<div class="approval-card" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;" data-action-id="${a.id}">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.95rem; color:var(--text-primary); margin-bottom:0.25rem;">${a.activity}</div>
                    <div style="font-size:0.8rem; color:var(--text-tertiary);">Due: ${dueStr} · Owner: ${a.owner || '—'}</div>
                    ${a.description ? `<div style="font-size:0.82rem; color:var(--text-secondary); margin-top:0.25rem; max-width:500px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${a.description}</div>` : ''}
                </div>
                <button onclick="window._approvePendingAction('${a.id}')" style="display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; background:var(--energy-algae); color:#fff; border:none; border-radius:8px; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.15s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">check</span> Approve
                </button>
            </div>`;
        }).join('');
};

window._approvePendingAction = async function (actionId) {
    const actions = window.getData('actions') || [];
    const action = actions.find(a => a.id === actionId);
    if (!action) return;
    action.status = 'Planned';
    window.updateData('actions', actions);

    if (window._sb) {
        try {
            await window._sb.from('tbl_action').update({ act_status: 'Planned' }).eq('act_id', actionId);
            console.log('[Approvals] Saved approval to DB');
        } catch (e) {
            console.error('[Approvals] Failed to save approval to DB:', e);
        }
    }

    console.log('[Approvals] Approved action', action.activity, '→ Planned');
    window._renderPendingActions();
};

function _renderSingleContentCardHtml(c, allCards, dataKey, containerId, contextData) {
    // Cascaded dropdown logic
    const t = c.cc_card_type || 'card';
    let entity = t;
    let format = '';
    if (t.startsWith('action_')) { entity = 'action'; format = t.split('_')[1]; }
    else if (t.startsWith('interaction_')) { entity = 'interaction'; format = t.split('_')[1]; }
    else if (t.startsWith('stakeholder_')) { entity = 'stakeholder'; format = t.split('_')[1]; }

    const entityOptions = [
        { value: 'card', icon: '📝', label: 'Text Card' },
        { value: 'objectives_link', icon: '🎯', label: 'Objectives' },
        { value: 'audience_message', icon: '📢', label: 'Audience Message' },
        { value: 'action', icon: '⚡', label: 'Action' },
        { value: 'interaction', icon: '💬', label: 'Update Log' },
        { value: 'stakeholder', icon: '🏛', label: 'Stakeholder' }
    ];
    const entityOptsHtml = entityOptions.map(o => `<option value="${o.value}"${entity === o.value ? ' selected' : ''}>${o.icon} ${o.label}</option>`).join('');

    let formatSelectHtml = '';
    if (['action', 'interaction', 'stakeholder'].includes(entity)) {
        const formatOptions = [
            { value: 'view', label: 'List (Top 3)' },
            { value: 'summary', label: 'Summary Stats' },
            { value: 'single', label: 'Single Item' }
        ];
        if (!format) format = 'view';
        const formatOptsHtml = formatOptions.map(o => `<option value="${o.value}"${format === o.value ? ' selected' : ''}>${o.label}</option>`).join('');
        formatSelectHtml = `<select class="ce-format-select" data-card-id="${c.cc_id}" style="font-size:0.72rem;padding:0.15rem 0.3rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);max-width:110px;" onchange="window.ceChangeCardFormat(${c.cc_id}, this.value, '${entity}', '${dataKey}')">
            ${formatOptsHtml}
        </select>`;
    }

    const editCtrl = `<div class="ce-edit-ctrl" style="display:none;position:absolute;right:0.5rem;top:0.5rem;gap:0.25rem;align-items:center;z-index:2;">
        <select class="ce-entity-select" data-card-id="${c.cc_id}" style="font-size:0.72rem;padding:0.15rem 0.3rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);max-width:140px;" onchange="window.ceChangeCardEntity(${c.cc_id}, this.value, '${dataKey}')">
            ${entityOptsHtml}
        </select>
        ${formatSelectHtml}
        <button onclick="event.stopPropagation();window.ceMoveCard(${c.cc_id},-1,'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
        <button onclick="event.stopPropagation();window.ceMoveCard(${c.cc_id},1,'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
        <button onclick="event.stopPropagation();window.ceDeleteCard(${c.cc_id},'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);padding:2px;"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
    </div>`;
    const grip = `<span class="ce-drag-grip" data-grip-id="${c.cc_id}" title="Drag to reorder" style="display:${isAppEditMode ? 'flex' : 'none'};position:absolute;left:0.4rem;top:50%;transform:translateY(-50%);">⠿</span>`;

    // Render this card's primary content
    const cardContent = window._renderCardTypeContent(c, contextData);

    // Render nested children recursively
    const children = allCards.filter(child => child.cc_parent_card_id === c.cc_id);
    let childrenHtml = '';
    if (children.length > 0) {
        childrenHtml = `<div class="ce-child-cards" style="margin-top:1.5rem;padding-left:1.5rem;border-left:2px solid var(--border-subtle);display:flex;flex-direction:column;gap:1rem;">
            ${children.map(child => _renderSingleContentCardHtml(child, allCards, dataKey, containerId, contextData)).join('')}
        </div>`;
    }

    return `<div class="card" style="position:relative;padding:1.5rem;" data-card-id="${c.cc_id}" draggable="false">${grip}${editCtrl}${cardContent}${childrenHtml}</div>`;
}

// ---- STRATEGY SPINE (inline card-driven editing) ----

let isAppEditMode = false;
let _spineCards = null;
let _cePendingReorders = [];

async function renderStrategySpine() {
    isAppEditMode = false;
    _spineCards = await window.fetchContentCards(1);
    renderContentCards('spine', 'strategy-cards-container');
    setupContentEditToggle('spine', 'strategy-cards-container', 'ce-edit-toggle');
}

// ---- UNIFIED CARD TYPE RENDERER ----
// Shared renderer for all entity-linked card types (used by spine, messaging, dashboard)
window._renderCardTypeContent = function (card, spine) {
    const type = card.cc_card_type || 'card';
    let filter = {};
    try { if (card.cc_content && card.cc_content.startsWith('{')) filter = JSON.parse(card.cc_content); } catch (e) { }

    switch (type) {
        case 'objectives_link': {
            if (spine && spine.objectives) return renderSpineObjectives(spine.objectives, false);
            return '<p style="color:var(--text-tertiary);font-style:italic;">No objectives loaded.</p>';
        }

        case 'stakeholder_view':
        case 'stakeholder_single': {
            const stakeholders = window.getData('stakeholders') || [];
            let filtered = [...stakeholders];
            if (filter.status) filtered = filtered.filter(s => s.status === filter.status);
            if (filter.id) filtered = filtered.filter(s => s.id === filter.id);
            const limit = type === 'stakeholder_single' ? 1 : (filter.limit || 3);
            const items = filtered.slice(0, limit);
            if (items.length === 0) return '<p style="color:var(--text-tertiary);font-style:italic;margin:0;">No stakeholders match filter.</p>';
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Stakeholders'}</h4>` +
                items.map(s => {
                    const col = s.status === 'Needs Attention' ? '#ef4444' : s.status === 'Active' ? 'var(--energy-algae)' : s.status === 'Monitor' ? 'var(--energy-mid)' : 'var(--text-secondary)';
                    return `<div style="padding:0.6rem;border:1px solid var(--border-subtle);border-radius:6px;margin-bottom:0.4rem;cursor:pointer;" onclick="window.currentStakeholderId='${s.id}';loadView('stakeholder_detail');history.pushState(null,'','#stakeholder_detail')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
                        <div style="font-weight:600;font-size:0.88rem;margin-bottom:0.2rem;">${s.name}</div>
                        <div style="font-size:0.78rem;color:var(--text-tertiary);">
                            <span style="color:${col};font-weight:600;">${s.status}</span> · ${s.role || '—'}
                        </div>
                    </div>`;
                }).join('');
        }

        case 'stakeholder_summary': {
            const stakeholders = window.getData('stakeholders') || [];
            const total = stakeholders.length;
            const healthy = stakeholders.filter(s => ['Active', 'Stable', 'Operational'].includes(s.status)).length;
            const neutral = stakeholders.filter(s => ['Monitor', 'Dormant'].includes(s.status)).length;
            const atRisk = stakeholders.filter(s => ['Needs Attention', 'Critical/At Risk', 'Strained', 'Friction Points'].includes(s.status)).length;
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Stakeholders'}</h4>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-size:2.5rem;font-weight:700;">${total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div>
                    <div style="font-size:0.8rem;line-height:1.6;"><div><span style="color:var(--energy-algae);">●</span> ${healthy} Healthy</div><div><span style="color:var(--energy-solar);">●</span> ${neutral} Neutral</div><div><span style="color:var(--energy-alert);">●</span> ${atRisk} At Risk</div></div>
                </div>`;
        }

        case 'action_view':
        case 'action_single': {
            const actions = window.getData('actions') || [];
            let filtered = [...actions];
            const isDone = a => /^complete[d]?$/i.test(a.status || '');
            if (filter.status) filtered = filtered.filter(a => a.status === filter.status);
            if (filter.filter === 'overdue') { const now = new Date(); filtered = filtered.filter(a => a.timing?.dueDate && new Date(a.timing.dueDate + 'T00:00:00') < now && !isDone(a)); }
            if (filter.filter === 'upcoming') { const now = new Date(); filtered = filtered.filter(a => a.timing?.dueDate && new Date(a.timing.dueDate + 'T00:00:00') >= now && !isDone(a)); }
            if (filter.id) filtered = filtered.filter(a => a.id === filter.id);
            const limit = type === 'action_single' ? 1 : (filter.limit || 3);
            filtered.sort((a, b) => (a.timing?.dueDate || '9999').localeCompare(b.timing?.dueDate || '9999'));
            const items = filtered.slice(0, limit);
            if (items.length === 0) return '<p style="color:var(--text-tertiary);font-style:italic;margin:0;">No actions match filter.</p>';
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Actions'}</h4>` +
                items.map(a => {
                    const isCompleted = a.status === 'Completed';
                    const rel = typeof relativeDate === 'function' ? relativeDate(a.timing?.dueDate, isCompleted) : { text: '', color: 'inherit' };
                    return `<div style="padding:0.6rem;border:1px solid var(--border-subtle);border-radius:6px;margin-bottom:0.4rem;cursor:pointer;" onclick="window.viewAction('${a.id}')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
                            <span class="status-badge" style="font-size:0.7rem;padding:0.1rem 0.5rem;">${a.status}</span>
                            <span style="font-size:0.72rem;color:${rel.color};">${rel.text}</span>
                        </div>
                        <div style="font-weight:600;font-size:0.88rem;">${a.activity}</div>
                        <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.15rem;">Owner: ${a.owner || '—'}</div>
                    </div>`;
                }).join('');
        }

        case 'action_summary': {
            const actions = window.getData('actions') || [];
            const total = actions.length;
            const active = actions.filter(a => ['In Progress', 'Planned'].includes(a.status)).length;
            const overdue = actions.filter(a => { if (/^complete[d]?$/i.test(a.status)) return false; if (!a.timing?.dueDate) return false; return new Date(a.timing.dueDate + 'T00:00:00') < new Date(); }).length;
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Actions'}</h4>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-size:2.5rem;font-weight:700;">${total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div>
                    <div style="text-align:right;"><div style="font-size:2rem;font-weight:700;">${active}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Active</div></div>
                    ${overdue > 0 ? `<div style="text-align:right;"><div style="font-size:2rem;font-weight:700;color:#ef4444;">${overdue}</div><div style="font-size:0.75rem;color:#ef4444;">Overdue</div></div>` : ''}
                </div>`;
        }

        case 'interaction_view':
        case 'interaction_single': {
            const interactions = window.getData('interactions') || [];
            let filtered = [...interactions];
            if (filter.type) filtered = filtered.filter(i => i.type === filter.type);
            if (filter.id) filtered = filtered.filter(i => i.id === filter.id);
            const limit = type === 'interaction_single' ? 1 : (filter.limit || 3);
            const items = filtered.slice(0, limit);
            if (items.length === 0) return '<p style="color:var(--text-tertiary);font-style:italic;margin:0;">No updates match filter.</p>';
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Updates'}</h4>` +
                items.map(i => {
                    return `<div style="padding:0.6rem;border:1px solid var(--border-subtle);border-radius:6px;margin-bottom:0.4rem;cursor:pointer;" onclick="window.currentInteractionId='${i.id}';loadView('interaction_detail');history.pushState(null,'','#interaction_detail')" onmouseover="if(!document.querySelector('.ce-dragging')) this.style.borderColor='var(--energy-algae)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
                        <div style="font-size:0.72rem;color:${i.type === 'Upcoming' ? 'var(--energy-alert)' : 'var(--text-tertiary)'};font-weight:600;margin-bottom:0.2rem;">${i.rawDate || ''} — ${i.type || ''}</div>
                        <div style="font-weight:600;font-size:0.88rem;">${i.title}</div>
                    </div>`;
                }).join('');
        }

        case 'interaction_summary': {
            const interactions = window.getData('interactions') || [];
            const total = interactions.length;
            const upcoming = interactions.filter(i => i.type === 'Upcoming').length;
            return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">${card.cc_title || 'Updates'}</h4>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-size:2.5rem;font-weight:700;">${upcoming}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Upcoming</div></div>
                    <div style="text-align:right;"><div style="font-size:2.5rem;font-weight:700;">${total}</div><div style="font-size:0.75rem;color:var(--text-tertiary);">Total</div></div>
                </div>`;
        }

        case 'audience_message': {
            const stakeholders = window.getData('stakeholders') || [];
            const linkedId = filter.stakeholderId || card.cc_linked_entity_id;
            const s = linkedId ? stakeholders.find(x => x.id === linkedId) : null;
            if (!s) return `<h4 style="margin:0 0 0.75rem 0;color:var(--text-tertiary);">Audience Message</h4><p style="color:var(--text-tertiary);font-style:italic;">No stakeholder linked.</p>`;
            return `<h4 style="margin:0 0 0.5rem 0;color:var(--text-tertiary);">Audience Message — ${s.name}</h4>
                <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${s.audienceMessage || card.cc_content || 'No message set.'}</div>`;
        }

        default: {
            // Generic card
            if (card.cc_is_collapsible) {
                return `<details class="ce-card-collapsible" data-card-id="${card.cc_id}">
                    <summary class="ce-card-title" data-card-id="${card.cc_id}" style="margin:0; font-weight:600; cursor:pointer; color:var(--text-primary);">${card.cc_title || ''}</summary>
                    <div class="ce-card-content" data-card-id="${card.cc_id}" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap; margin-top:0.75rem;">${card.cc_content || ''}</div>
                </details>`;
            } else {
                return `<h4 class="ce-card-title" data-card-id="${card.cc_id}" style="margin:0 0 0.75rem 0;">${card.cc_title || ''}</h4>
                    <div class="ce-card-content" data-card-id="${card.cc_id}" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${card.cc_content || ''}</div>`;
            }
        }
    }
};

function renderContentCards(dataKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const contextData = window.getData(dataKey) || {}; // For objectives or other metadata
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    const cards = (cardsArray || []).filter(c => c.cc_active !== false).sort((a, b) => a.cc_order - b.cc_order);
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
            html += `<div class="ce-section-row" data-card-id="${sc.cc_id}" draggable="false" style="display:flex;justify-content:space-between;align-items:center;margin:2rem 0 1rem;">
                <div style="display:flex;align-items:center;gap:0.25rem;flex:1;">
                    <span class="ce-drag-grip" data-grip-id="${sc.cc_id}" title="Drag to reorder" style="display:${isAppEditMode ? 'inline-block' : 'none'};">⠿</span>
                    <h3 class="ce-section-title" data-card-id="${sc.cc_id}" style="color:var(--text-tertiary);margin:0;">${sc.cc_title || ''}</h3>
                </div>
                <div class="ce-edit-ctrl" style="display:none;gap:0.5rem;align-items:center;">
                    <select class="ce-width-select" data-card-id="${sc.cc_id}" style="display:none;font-size:0.75rem;padding:0.15rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);">
                        <option value="full"${sc.cc_width === 'full' ? ' selected' : ''}>Full</option>
                        <option value="half"${sc.cc_width === 'half' ? ' selected' : ''}>Half</option>
                        <option value="third"${sc.cc_width === 'third' ? ' selected' : ''}>Third</option>
                        <option value="quarter"${sc.cc_width === 'quarter' ? ' selected' : ''}>Quarter</option>
                    </select>
                    <button onclick="window.ceMoveCard(${sc.cc_id},-1,'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move up"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_upward</span></button>
                    <button onclick="window.ceMoveCard(${sc.cc_id},1,'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:2px;" title="Move down"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_downward</span></button>
                    <button onclick="window.ceDeleteCard(${sc.cc_id},'${dataKey}','${containerId}')" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);padding:2px;" title="Remove"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
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
                html += _renderSingleContentCardHtml(c, cards, dataKey, containerId, contextData);
            });
            html += '</div>';
        }
    });

    // Add card/section buttons (visible in edit mode)
    html += `<div class="ce-edit-ctrl" style="display:none;gap:0.5rem;margin-top:1rem;">
        <button class="btn-secondary" onclick="window.ceAddSection('${dataKey}','${containerId}')" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Section</button>
        <button class="btn-secondary" onclick="window.ceAddCard('${dataKey}','${containerId}')" style="font-size:0.8rem;padding:0.3rem 0.8rem;">+ Add Card</button>
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
            <div class="ce-edit-ctrl" style="display:none;gap:0.25rem;align-items:center;">
                <button onclick="window.spineMoveObj('${o.id}',-1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);opacity:${idx === 0 ? '0.2' : '1'};" ${idx === 0 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_upward</span></button>
                <button onclick="window.spineMoveObj('${o.id}',1)" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);opacity:${idx === objectives.length - 1 ? '0.2' : '1'};" ${idx === objectives.length - 1 ? 'disabled' : ''}><span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_downward</span></button>
                <button onclick="window.spineDeleteObj('${o.id}')" style="background:none;border:none;cursor:pointer;color:var(--energy-alert);"><span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span></button>
            </div>
        </li>`;
    });
    html += '</ul>';
    html += '<button class="btn-secondary ce-edit-ctrl" onclick="window.spineAddObj()" style="display:none;font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.5rem;">+ Add Objective</button>';
    if (wrapInCard) html += '</div>';
    return html;
}

function setupContentEditToggle(dataKey, containerId, btnId) {
    const old = document.getElementById(btnId);
    if (!old) return;

    // Ensure button is reset to default visually if we're not in edit mode
    if (!isAppEditMode) {
        old.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
        old.disabled = false;
        old.style.background = '';
        old.style.color = '';
    }

    const editToggle = old.cloneNode(true);
    old.parentNode.replaceChild(editToggle, old);

    // Wire cancel button
    const cancelBtn = document.getElementById(btnId.replace('edit-toggle', 'cancel-btn'));
    if (cancelBtn) {
        const freshCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
        freshCancel.addEventListener('click', async () => {
            isAppEditMode = false;
            _cePendingReorders = [];
            const container = document.getElementById(containerId);
            if (container) container.classList.remove('ce-edit-active');
            editToggle.style.background = ''; editToggle.style.color = '';
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            freshCancel.style.display = 'none';
            // Re-fetch and re-render (discard local changes)
            if (dataKey === 'messaging') _msgCards = await window.fetchContentCards(2);
            else _spineCards = await window.fetchContentCards(1);
            renderContentCards(dataKey, containerId);
            setupContentEditToggle(dataKey, containerId, btnId);
        });
    }

    editToggle.addEventListener('click', async () => {
        isAppEditMode = !isAppEditMode;
        editToggle.style.background = isAppEditMode ? 'var(--energy-algae)' : '';
        editToggle.style.color = isAppEditMode ? '#000' : '';
        editToggle.innerHTML = isAppEditMode
            ? '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> Done'
            : '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';

        // Show/hide cancel button
        const cb = document.getElementById(btnId.replace('edit-toggle', 'cancel-btn'));
        if (cb) cb.style.display = isAppEditMode ? 'flex' : 'none';

        if (isAppEditMode) {
            // Add edit-active class for CSS-driven grip visibility
            const container = document.getElementById(containerId);
            if (container) container.classList.add('ce-edit-active');
            // Show edit controls
            document.querySelectorAll('.ce-edit-ctrl').forEach(el => { el.style.display = 'flex'; });
            document.querySelectorAll('.ce-width-select').forEach(el => { el.style.display = 'inline-block'; });

            // Section titles → inputs
            document.querySelectorAll('.ce-section-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'ce-edit-sec-title'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:1.17rem;font-weight:600;color:var(--text-tertiary);background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.25rem 0.5rem;';
                el.replaceWith(input);
            });

            // Card titles → inputs
            document.querySelectorAll('.ce-card-title').forEach(el => {
                const input = document.createElement('input');
                input.type = 'text'; input.value = el.textContent;
                input.className = 'ce-edit-card-title'; input.dataset.cardId = el.dataset.cardId;
                input.style.cssText = 'font-size:1.1rem;font-weight:600;color:var(--text-primary);background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;padding:0.3rem 0.5rem;width:100%;margin-bottom:0.5rem;';
                el.replaceWith(input);
            });

            // Card content → textareas
            document.querySelectorAll('.ce-card-content').forEach(el => {
                const ta = document.createElement('textarea');
                ta.value = el.textContent; ta.className = 'ce-edit-card-content'; ta.dataset.cardId = el.dataset.cardId;
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

            // Initialize drag-and-drop on grip handles
            window._initSpineDragDrop(dataKey, containerId);
        } else {
            // Remove edit-active class
            const container = document.getElementById(containerId);
            if (container) container.classList.remove('ce-edit-active');
            // "Done" — show loading, persist everything
            editToggle.disabled = true;
            editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;animation:spin 1s linear infinite;">autorenew</span> Saving...';
            try {
                await persistContentEdits(dataKey, containerId, btnId);
            } finally {
                editToggle.disabled = false;
                editToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit';
            }
        }
    });
}

async function persistContentEdits(dataKey, containerId, btnId) {
    const spine = window.getData('spine');
    const updates = [];

    // Collect section title & width changes
    document.querySelectorAll('.ce-edit-sec-title').forEach(input => {
        const id = parseInt(input.dataset.cardId);
        if (id) updates.push({ ccId: id, fields: { cc_title: input.value } });
    });
    document.querySelectorAll('.ce-width-select').forEach(sel => {
        const id = parseInt(sel.dataset.cardId);
        if (id) {
            const existing = updates.find(u => u.ccId === id);
            if (existing) existing.fields.cc_width = sel.value;
            else updates.push({ ccId: id, fields: { cc_width: sel.value } });
        }
    });

    // Collect cascaded card type changes
    document.querySelectorAll('.ce-entity-select').forEach(sel => {
        const id = parseInt(sel.dataset.cardId);
        if (id) {
            let entity = sel.value;
            let finalType = entity;
            if (['action', 'interaction', 'stakeholder'].includes(entity)) {
                const formatSel = sel.parentElement.querySelector('.ce-format-select');
                const format = formatSel ? formatSel.value : 'view';
                finalType = `${entity}_${format}`;
            }
            const existing = updates.find(u => u.ccId === id);
            if (existing) existing.fields.cc_card_type = finalType;
            else updates.push({ ccId: id, fields: { cc_card_type: finalType } });
        }
    });

    // Collect card title + content changes
    document.querySelectorAll('.ce-edit-card-title').forEach(input => {
        const id = parseInt(input.dataset.cardId);
        if (id) updates.push({ ccId: id, fields: { cc_title: input.value } });
    });
    document.querySelectorAll('.ce-edit-card-content').forEach(ta => {
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

    // Persist any pending reorder/nest changes from drag-and-drop
    if (_cePendingReorders.length > 0) {
        const reorders = _cePendingReorders.filter(r => r.newOrder !== undefined);
        const nests = _cePendingReorders.filter(r => r.fields);

        if (window.reorderContentCards && reorders.length > 0) {
            await window.reorderContentCards(reorders);
            console.log('[Strategy] Persisted', reorders.length, 'reorder updates');
        }
        if (window.updateContentCard && nests.length > 0) {
            for (const n of nests) {
                await window.updateContentCard(n.ccId, n.fields);
            }
            console.log('[Strategy] Persisted', nests.length, 'nest updates');
        }
        _cePendingReorders = [];
    }

    // Refresh spine cache and re-render
    if (dataKey === 'messaging') _msgCards = await window.fetchContentCards(2);
    else _spineCards = await window.fetchContentCards(1);

    // Also refresh spine data for objectives
    if (dataKey === 'spine') await window.getData('spine');
    renderContentCards(dataKey, containerId);
}

// ---- STRATEGY CARD OPERATIONS ----

window.ceChangeCardEntity = function (ccId, entity, dataKey) {
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    if (!cardsArray) return;
    const card = cardsArray.find(c => c.cc_id === ccId);
    if (card) {
        let finalType = entity;
        const needsFormat = ['action', 'interaction', 'stakeholder'].includes(entity);
        if (needsFormat) finalType = `${entity}_view`;
        card.cc_card_type = finalType;

        // Update DOM for format dropdown
        const sel = document.querySelector(`.ce-entity-select[data-card-id="${ccId}"]`);
        if (sel) {
            let formatSel = sel.parentElement.querySelector('.ce-format-select');
            if (needsFormat) {
                if (!formatSel) {
                    formatSel = document.createElement('select');
                    formatSel.className = 'ce-format-select';
                    formatSel.dataset.cardId = ccId;
                    formatSel.style.cssText = "font-size:0.72rem;padding:0.15rem 0.3rem;border-radius:4px;background:var(--bg-app);border:1px solid var(--border-subtle);color:var(--text-primary);max-width:110px;";
                    formatSel.onchange = function () { window.ceChangeCardFormat(ccId, this.value, entity, dataKey); };

                    const formatOptions = [
                        { value: 'view', label: 'List (Top 3)' },
                        { value: 'summary', label: 'Summary Stats' },
                        { value: 'single', label: 'Single Item' }
                    ];
                    formatSel.innerHTML = formatOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
                    sel.after(formatSel);
                }
            } else {
                if (formatSel) formatSel.remove();
            }
        }
    }
};

window.ceChangeCardFormat = function (ccId, format, entity, dataKey) {
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    if (!cardsArray) return;
    const card = cardsArray.find(c => c.cc_id === ccId);
    if (card) {
        card.cc_card_type = `${entity}_${format}`;
    }
};

window.ceMoveCard = function (ccId, direction, dataKey, containerId) {
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    if (!cardsArray) return;
    const topCards = cardsArray.filter(c => !c.cc_parent_card_id && c.cc_active !== false).sort((a, b) => a.cc_order - b.cc_order);
    const idx = topCards.findIndex(c => c.cc_id === ccId);
    if (idx === -1) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= topCards.length) return;
    const tmpOrder = topCards[idx].cc_order;
    topCards[idx].cc_order = topCards[swapIdx].cc_order;
    topCards[swapIdx].cc_order = tmpOrder;
    // Track pending reorders (will be persisted on Done)
    _cePendingReorders.push(
        { ccId: topCards[idx].cc_id, newOrder: topCards[idx].cc_order },
        { ccId: topCards[swapIdx].cc_id, newOrder: topCards[swapIdx].cc_order }
    );
    renderContentCards(dataKey, containerId);
    setupContentEditToggle(dataKey, containerId, containerId.replace('cards-container', 'edit-toggle'));
    if (isAppEditMode) { isAppEditMode = false; document.getElementById(containerId.replace('cards-container', 'edit-toggle'))?.click(); }
};

window.ceDeleteCard = async function (ccId, dataKey, containerId) {
    if (!confirm('Remove this card?')) return;
    if (window.softDeleteContentCard) await window.softDeleteContentCard(ccId);

    if (dataKey === 'messaging') _msgCards = (_msgCards || []).filter(c => c.cc_id !== ccId);
    else _spineCards = (_spineCards || []).filter(c => c.cc_id !== ccId);

    // Also update spine cache for pillars
    const spine = window.getData('spine');
    if (spine && dataKey === 'spine') { spine.pillars = spine.pillars.filter(p => p.id !== 'p' + ccId); window.updateData('spine', spine); }

    renderContentCards(dataKey, containerId);
    setupContentEditToggle(dataKey, containerId, containerId.replace('cards-container', 'edit-toggle'));
    if (isAppEditMode) { isAppEditMode = false; document.getElementById(containerId.replace('cards-container', 'edit-toggle'))?.click(); }
};

window.ceAddSection = async function (dataKey, containerId) {
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    const maxOrder = (cardsArray || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const pageId = dataKey === 'messaging' ? 2 : 1;
        const card = await window.insertContentCard({ cc_page_id: pageId, cc_card_type: 'section', cc_title: 'New Section', cc_width: 'full', cc_order: maxOrder + 1 });
        if (card) {
            if (dataKey === 'messaging') _msgCards.push(card); else _spineCards.push(card);
            renderContentCards(dataKey, containerId);
            setupContentEditToggle(dataKey, containerId, containerId.replace('cards-container', 'edit-toggle'));
            if (isAppEditMode) { isAppEditMode = false; document.getElementById(containerId.replace('cards-container', 'edit-toggle'))?.click(); }
        }
    }
};

window.ceAddCard = async function (dataKey, containerId) {
    const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
    const maxOrder = (cardsArray || []).reduce((m, c) => Math.max(m, c.cc_order || 0), 0);
    if (window.insertContentCard) {
        const pageId = dataKey === 'messaging' ? 2 : 1;
        const card = await window.insertContentCard({ cc_page_id: pageId, cc_card_type: 'card', cc_title: 'New Card', cc_content: '', cc_width: 'full', cc_order: maxOrder + 1 });
        if (card) {
            if (dataKey === 'messaging') _msgCards.push(card); else _spineCards.push(card);
            renderContentCards(dataKey, containerId);
            setupContentEditToggle(dataKey, containerId, containerId.replace('cards-container', 'edit-toggle'));
            if (isAppEditMode) { isAppEditMode = false; document.getElementById(containerId.replace('cards-container', 'edit-toggle'))?.click(); }
        }
    }
};

window.spineMoveObj = function (id, dir) {
    const spine = window.getData('spine');
    if (!spine) return;
    const idx = spine.objectives.findIndex(o => o.id === id);
    if (idx === -1) return;
    if (dir === -1 && idx > 0) { [spine.objectives[idx], spine.objectives[idx - 1]] = [spine.objectives[idx - 1], spine.objectives[idx]]; }
    else if (dir === 1 && idx < spine.objectives.length - 1) { [spine.objectives[idx], spine.objectives[idx + 1]] = [spine.objectives[idx + 1], spine.objectives[idx]]; }
    window.updateData('spine', spine);
    renderContentCards('spine', 'strategy-cards-container');
    setupContentEditToggle('spine', 'strategy-cards-container', 'ce-edit-toggle');
    if (isAppEditMode) { isAppEditMode = false; document.getElementById('ce-edit-toggle')?.click(); }
};

window.spineDeleteObj = async function (id) {
    if (!confirm('Remove this objective?')) return;
    const spine = window.getData('spine');
    if (!spine) return;
    spine.objectives = spine.objectives.filter(o => o.id !== id);
    const soId = parseInt(id.replace('obj', ''));
    if (soId && window.softDeleteStrategyObjective) await window.softDeleteStrategyObjective(soId);
    window.updateData('spine', spine);
    renderContentCards('spine', 'strategy-cards-container');
    setupContentEditToggle('spine', 'strategy-cards-container', 'ce-edit-toggle');
    if (isAppEditMode) { isAppEditMode = false; document.getElementById('ce-edit-toggle')?.click(); }
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
    renderContentCards('spine', 'strategy-cards-container');
    setupContentEditToggle('spine', 'strategy-cards-container', 'ce-edit-toggle');
    if (isAppEditMode) { isAppEditMode = false; document.getElementById('ce-edit-toggle')?.click(); }
};



// ---- DRAG-AND-DROP ENGINE FOR CONTENT CARDS ----

window._initSpineDragDrop = function (dataKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let dragCardId = null;
    let dragEl = null;
    let ghostEl = null;
    let startY = 0;

    // Clear any previous indicators
    function clearIndicators() {
        container.querySelectorAll('.spine-drop-above,.spine-drop-below,.spine-drop-left,.spine-drop-right,.spine-drop-nest').forEach(el => {
            el.classList.remove('spine-drop-above', 'spine-drop-below', 'spine-drop-left', 'spine-drop-right', 'spine-drop-nest');
        });
    }

    // Find the draggable card element from an event target
    function findCardEl(target) {
        return target.closest('[data-card-id]');
    }

    // Get all top-level card elements in DOM order
    function getAllCardEls() {
        return Array.from(container.querySelectorAll('[data-card-id]'));
    }

    // Check if an element is inside a multi-column grid
    function isInHorizontalGrid(el) {
        const parent = el.parentElement;
        if (!parent) return false;
        const style = window.getComputedStyle(parent);
        if (style.display !== 'grid') return false;
        const cols = style.gridTemplateColumns || '';
        // Multi-column if there are multiple column values (e.g. "1fr 1fr" or "repeat(2, 1fr)")
        return cols.split(/\s+/).filter(v => v && v !== '').length > 1;
    }

    // Mouse down on grip — start drag
    container.addEventListener('mousedown', function (e) {
        const grip = e.target.closest('.ce-drag-grip');
        if (!grip) return;
        e.preventDefault();

        dragCardId = parseInt(grip.dataset.gripId);
        dragEl = findCardEl(grip);
        if (!dragEl) { dragCardId = null; return; }

        startY = e.clientY;
        dragEl.classList.add('ce-dragging');

        // Create ghost overlay (looks exactly like the dragged card)
        ghostEl = dragEl.cloneNode(true);
        const rect = dragEl.getBoundingClientRect();
        ghostEl.style.cssText = `position:fixed;pointer-events:none;z-index:9999;opacity:0.65;width:${rect.width}px;height:${rect.height}px;box-shadow:0 12px 40px rgba(0,0,0,0.2);transform:scale(1.02);transition:none;margin:0;`;
        document.body.appendChild(ghostEl);
        ghostEl.style.left = (e.clientX + 12) + 'px';
        ghostEl.style.top = (e.clientY - 10) + 'px';

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
    });

    function onDragMove(e) {
        if (!dragEl) return;
        // Move ghost
        if (ghostEl) {
            ghostEl.style.left = (e.clientX + 12) + 'px';
            ghostEl.style.top = (e.clientY - 10) + 'px';
        }

        clearIndicators();

        // Find card under cursor or closest card edge (for gap hovering)
        const allEls = getAllCardEls();
        let hoverEl = null;
        let isInside = false;

        for (const el of allEls) {
            if (el === dragEl) continue;
            const rect = el.getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right) {
                hoverEl = el;
                isInside = true;
                break;
            }
        }

        if (!hoverEl) {
            // Gap hovering: find the closest element within a radius
            let minDist = Infinity;
            for (const el of allEls) {
                if (el === dragEl) continue;
                const rect = el.getBoundingClientRect();
                // Find closest point on the rect to the mouse
                const clampedX = Math.max(rect.left, Math.min(e.clientX, rect.right));
                const clampedY = Math.max(rect.top, Math.min(e.clientY, rect.bottom));
                const dist = Math.sqrt(Math.pow(e.clientX - clampedX, 2) + Math.pow(e.clientY - clampedY, 2));

                if (dist < minDist && dist < 60) { // 60px snap radius for gaps
                    minDist = dist;
                    hoverEl = el;
                }
            }
        }

        if (hoverEl) {
            const rect = hoverEl.getBoundingClientRect();
            const isSection = hoverEl.classList.contains('ce-section-row');
            const horizontal = isInHorizontalGrid(hoverEl);

            if (horizontal) {
                // Horizontal grid: use left/right/center zones
                const relX = (e.clientX - rect.left) / rect.width;
                if (relX < 0.3 || (!isInside && e.clientX < rect.left + rect.width / 2)) {
                    hoverEl.classList.add('spine-drop-left');
                } else if (relX > 0.7 || (!isInside && e.clientX >= rect.left + rect.width / 2)) {
                    hoverEl.classList.add('spine-drop-right');
                } else if (!isSection && isInside) {
                    hoverEl.classList.add('spine-drop-nest');
                } else {
                    hoverEl.classList.add('spine-drop-right');
                }
            } else {
                // Vertical layout: use top/bottom/center zones
                const relY = (e.clientY - rect.top) / rect.height;
                if (relY < 0.3 || (!isInside && e.clientY < rect.top + rect.height / 2)) {
                    hoverEl.classList.add('spine-drop-above');
                } else if (relY > 0.7 || (!isInside && e.clientY >= rect.top + rect.height / 2)) {
                    hoverEl.classList.add('spine-drop-below');
                } else if (!isSection && isInside) {
                    hoverEl.classList.add('spine-drop-nest');
                } else {
                    hoverEl.classList.add('spine-drop-below');
                }
            }
        }
    }

    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);

        if (!dragEl || !dragCardId) {
            cleanup();
            return;
        }

        // Find what we dropped on
        const allEls = getAllCardEls();
        let dropEl = null;
        for (const el of allEls) {
            if (el === dragEl) continue;
            if (el.classList.contains('spine-drop-above') || el.classList.contains('spine-drop-below') ||
                el.classList.contains('spine-drop-left') || el.classList.contains('spine-drop-right') ||
                el.classList.contains('spine-drop-nest')) {
                dropEl = el;
                break;
            }
        }

        if (dropEl) {
            const dropCardId = parseInt(dropEl.dataset.cardId);
            const isNest = dropEl.classList.contains('spine-drop-nest');
            const isAbove = dropEl.classList.contains('spine-drop-above') || dropEl.classList.contains('spine-drop-left');

            if (isNest) {
                // Nest: set cc_parent_card_id
                const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
                const card = (cardsArray || []).find(c => c.cc_id === dragCardId);
                if (card) {
                    card.cc_parent_card_id = dropCardId;
                    _cePendingReorders.push({ ccId: dragCardId, fields: { cc_parent_card_id: dropCardId } });
                    console.log('[DnD] Nested card', dragCardId, 'into', dropCardId);
                }
            } else {
                // Reorder: insert dragCard before or after dropCard
                const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
                const topCards = (cardsArray || []).filter(c => !c.cc_parent_card_id && c.cc_active !== false).sort((a, b) => a.cc_order - b.cc_order);
                const dragIdx = topCards.findIndex(c => c.cc_id === dragCardId);
                const dropIdx = topCards.findIndex(c => c.cc_id === dropCardId);

                if (dragIdx !== -1 && dropIdx !== -1 && dragIdx !== dropIdx) {
                    // Remove drag card from array
                    const [moved] = topCards.splice(dragIdx, 1);
                    // Insert at new position
                    let insertAt = topCards.findIndex(c => c.cc_id === dropCardId);
                    if (!isAbove) insertAt += 1;
                    topCards.splice(insertAt, 0, moved);

                    // Reassign cc_order values
                    topCards.forEach((c, i) => {
                        c.cc_order = i + 1;
                        _cePendingReorders.push({ ccId: c.cc_id, newOrder: c.cc_order });
                    });
                    console.log('[DnD] Reordered', topCards.length, 'cards');
                }
            }

            // Sync visible inputs to array before re-rendering
            if (isAppEditMode) {
                const cardsArray = dataKey === 'messaging' ? _msgCards : _spineCards;
                document.querySelectorAll('.ce-edit-sec-title, .ce-edit-card-title').forEach(input => {
                    const id = parseInt(input.dataset.cardId);
                    const c = (cardsArray || []).find(x => x.cc_id === id);
                    if (c) c.cc_title = input.value;
                });
                document.querySelectorAll('.ce-edit-card-content').forEach(ta => {
                    const id = parseInt(ta.dataset.cardId);
                    const c = (cardsArray || []).find(x => x.cc_id === id);
                    if (c) c.cc_content = ta.value;
                });
            }

            // Re-render with new order
            renderContentCards(dataKey, containerId);
            setupContentEditToggle(dataKey, containerId, containerId.replace('cards-container', 'edit-toggle'));
            if (isAppEditMode) { isAppEditMode = false; document.getElementById(containerId.replace('cards-container', 'edit-toggle'))?.click(); }
        }

        cleanup();
    }

    function cleanup() {
        clearIndicators();
        if (dragEl) dragEl.classList.remove('ce-dragging');
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        dragEl = null;
        dragCardId = null;
    }
};






// ---- MESSAGING & Q&As (Card-driven, replaces Knowledge Bank) ----

let _msgCards = null;
let _msgPendingReorders = [];

async function renderMessaging() {
    isAppEditMode = false;
    if (!_msgCards && window.fetchContentCards) {
        _msgCards = await window.fetchContentCards(2);
    }
    if (!_msgCards || _msgCards.length === 0) {
        renderMessagingFromMock();
        return;
    }
    renderContentCards('messaging', 'messaging-cards-container');
    setupContentEditToggle('messaging', 'messaging-cards-container', 'msg-edit-toggle');
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
    const stakeholders = window.getData('stakeholders') || [];
    fakeCards.push({ cc_id: 900 + order, cc_card_type: 'section', cc_title: 'Key Audience Specific Messages', cc_order: order++ });
    (kb.audienceMessages || []).forEach(a => {
        const sh = stakeholders.find(s => s.name === a.title);
        fakeCards.push({
            cc_id: 900 + order,
            cc_card_type: 'audience_message',
            cc_title: a.title,
            cc_content: a.text,
            cc_linked_entity_id: sh ? sh.id : null,
            cc_order: order++
        });
    });
    _msgCards = fakeCards;
    renderContentCards('messaging', 'messaging-cards-container');
    setupContentEditToggle('messaging', 'messaging-cards-container', 'msg-edit-toggle');
}

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

window._pendingApprovals = [];
window._approvalEditMode = false;
window.currentApprovalId = null;

window.renderApprovals = window._doRenderApprovals = async function () {
    const container = document.getElementById('approvals-list-container');
    if (!container) return;

    if (typeof window.fetchPendingApprovals !== 'function') {
        container.innerHTML = `<div style="padding:2rem; color:#ef4444;">Error: fetchPendingApprovals not found in supabase.js</div>`;
        return;
    }

    try {
        const approvals = await window.fetchPendingApprovals();
        window._pendingApprovals = approvals;
        window.renderApprovalsList();
    } catch (err) {
        console.error('Error rendering approvals:', err);
        container.innerHTML = `<div style="padding:2rem; color:#ef4444;">Error loading approvals. Check console.</div>`;
    }
};

window.renderApprovalsList = function () {
    const container = document.getElementById('approvals-list-container');
    if (!container) return;

    // Ensure detail container is hidden and list is shown
    let detailContainer = document.getElementById('approvals-detail-container');
    if (detailContainer) detailContainer.style.display = 'none';
    container.style.display = 'flex';

    if (!window._pendingApprovals || window._pendingApprovals.length === 0) {
        container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 2rem; color:var(--text-tertiary); text-align:center;">
            <span class="material-symbols-outlined" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">check_circle</span>
            <p>No pending approvals. Inbox zero!</p>
        </div>`;
        return;
    }

    let html = '';
    window._pendingApprovals.forEach(app => {
        html += `
        <div class="approval-card" onclick="window.viewApproval('${app.mpc_id}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.1rem; font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">
                    ${app.mpc_action}
                </div>
                <div style="font-size:0.8rem; color:var(--text-tertiary);">
                    Source: ${app.mpc_source} | Created: ${new Date(app.mpc_created).toLocaleString()}
                </div>
            </div>
            <div style="display:flex; align-items:center; gap: 1rem;">
                <span class="approval-badge">${app.mpc_target_table}</span>
                <span class="material-symbols-outlined" style="color:var(--text-tertiary);">chevron_right</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
};

window.viewApproval = function (mpcId) {
    window.currentApprovalId = mpcId;
    window._approvalEditMode = false;
    window.renderApprovalDetail();
};

window.renderApprovalDetail = function () {
    const app = window._pendingApprovals.find(a => a.mpc_id === window.currentApprovalId);
    if (!app) return;

    let detailContainer = document.getElementById('approvals-detail-container');
    if (!detailContainer) {
        detailContainer = document.createElement('div');
        detailContainer.id = 'approvals-detail-container';
        detailContainer.style.display = 'flex';
        detailContainer.style.flexDirection = 'column';
        detailContainer.style.gap = '1rem';
        const parent = document.getElementById('appr-view-ai');
        if (parent) parent.appendChild(detailContainer);
        else return;
    }

    const listContainer = document.getElementById('approvals-list-container');
    if (listContainer) listContainer.style.display = 'none';
    detailContainer.style.display = 'flex';

    const isEdit = window._approvalEditMode;

    const renderProposedDataForm = (app, readOnly = false) => {
        let data = {};
        try {
            data = typeof app.mpc_proposed_data === 'string' ? JSON.parse(app.mpc_proposed_data || '{}') : (app.mpc_proposed_data || {});
        } catch (e) { }
        const table = app.mpc_target_table;

        const field = (key, label, type = 'text') => {
            const val = data[key] || '';
            const baseStyle = "width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-primary); font-family: inherit;";

            if (readOnly) {
                return `<div style="margin-bottom: 0.75rem;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.25rem; color:var(--text-tertiary);">${label}</label>
                    <div style="padding: 0.5rem 0; color: var(--text-primary); font-size: 0.95rem;">${val || '<span style="color:var(--text-tertiary);font-style:italic;">—</span>'}</div>
                </div>`;
            }

            if (type === 'textarea') {
                return `<div style="margin-bottom: 0.75rem;"><label style="display:block; font-size:0.8rem; margin-bottom:0.25rem; color:var(--text-tertiary);">${label}</label><textarea data-key="${key}" rows="2" style="${baseStyle} resize: vertical;">${val}</textarea></div>`;
            }
            return `<div style="margin-bottom: 0.75rem;"><label style="display:block; font-size:0.8rem; margin-bottom:0.25rem; color:var(--text-tertiary);">${label}</label><input type="${type}" data-key="${key}" value="${val}" style="${baseStyle}"></div>`;
        };

        const section = (title, content) => `
            <div style="margin-top: 1rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; background: rgba(0,0,0,0.15);">
                <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-tertiary); margin-top: 0; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">${title}</h4>
                ${content}
            </div>
        `;

        const row = (content) => `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">${content}</div>`;

        if (table === 'tbl_action') {
            return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">
                ${section('Definition', field('description', 'Description', 'textarea'))}
                ${section('Impact',
                row(field('status', 'Status') + field('priority', 'Priority')) +
                row(field('desired_outcome', 'Desired Outcome') + field('success_criteria', 'Success Criteria'))
            )}
                ${section('Logistics', row(field('start_date', 'Start Date', 'date') + field('due_date', 'Due Date', 'date')))}
                ${section('Version Control', row(field('recent_progress', 'Recent Progress', 'textarea') + field('current_blockers', 'Current Blockers', 'textarea')))}
                ${section('Other', field('note', 'Note', 'textarea'))}
            </div>`;
        } else if (table === 'tbl_stakeholder') {
            return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">
                ${section('Definition', row(field('name', 'Name') + field('role', 'Role')))}
                ${section('Posture',
                row(field('posture_current', 'Current Posture') + field('posture_desired', 'Desired Posture')) +
                row(field('posture_next_step', 'Next Step') + field('posture_target_date', 'Target Date', 'date'))
            )}
            </div>`;
        } else if (table === 'tbl_contact') {
            return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">
                ${section('Profile', row(field('first_name', 'First Name') + field('last_name', 'Last Name')))}
                ${section('Contact Info',
                row(field('email', 'Email', 'email') + field('phone', 'Phone', 'tel')) +
                field('organisation', 'Organisation')
            )}
                ${section('Other', field('notes', 'Notes', 'textarea'))}
            </div>`;
        } else if (table === 'tbl_risk') {
            return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">
                ${section('Risk Details', field('type', 'Type / Description', 'textarea') + row(field('severity', 'Severity (1-5)', 'number') + field('resolved_date', 'Resolved Date', 'date')))}
            </div>`;
        } else if (table === 'tbl_interaction') {
            return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">
                ${section('Interaction Details', row(field('purpose', 'Purpose') + field('date', 'Date', 'date')))}
                ${section('Outcome', field('outcome_notes', 'Outcome Notes', 'textarea') + row(field('outcome_score', 'Outcome Score (1-5)', 'number') + field('follow_up_date', 'Follow Up Date', 'date')))}
            </div>`;
        }

        let genericFields = '';
        for (const k in data) {
            genericFields += field(k, k.replace(/_/g, ' '), typeof data[k] === 'string' && data[k].length > 40 ? 'textarea' : 'text');
        }
        return `<div id="${readOnly ? '' : 'app-form-' + app.mpc_id}">${section('Properties', genericFields || '<p style="color:var(--text-tertiary); font-size:0.9rem;">No fields extracted.</p>')}</div>`;
    };

    detailContainer.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <button class="btn-secondary" onclick="window.renderApprovalsList()" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                ← Back to List
            </button>
        </div>
        
        <div class="approval-card" style="cursor:default;" id="approval-card-${app.mpc_id}">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; align-items:flex-start;">
                <div>
                    <div style="font-size:1.2rem; font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">
                        ${app.mpc_action}
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-tertiary);">
                        Source: ${app.mpc_source} | Target: ${app.mpc_target_table}
                    </div>
                </div>
                ${!isEdit ?
            `<button class="btn-primary" onclick="window._approvalEditMode = true; window.renderApprovalDetail();" style="display:flex; align-items:center; gap:0.4rem; padding: 0.5rem 1rem;">
                        <span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit / Merge
                    </button>` :
            `<button class="btn-secondary" onclick="window._approvalEditMode = false; window.renderApprovalDetail();" style="display:flex; align-items:center; gap:0.4rem; padding: 0.5rem 1rem;">
                        Cancel Edit
                    </button>`
        }
            </div>
            
            <div class="approval-field">
                <label style="margin-top: 1rem;">Proposed Data (AI Extraction)</label>
                ${renderProposedDataForm(app, !isEdit)}
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
                <button class="btn-secondary" onclick="window.rejectApproval('${app.mpc_id}')" style="color:#ef4444; border-color:#ef4444;">
                    Reject
                </button>
                <button class="btn-primary" onclick="window.saveAndApproveApproval('${app.mpc_id}')">
                    ${isEdit ? 'Save & Approve' : 'Approve (As Is)'}
                </button>
            </div>
        </div>
    `;
};

window.rejectApproval = async function (mpcId) {
    if (!confirm('Are you sure you want to reject this extraction?')) return;
    const card = document.getElementById(`approval-card-${mpcId}`);
    if (card) card.style.opacity = '0.5';

    const success = await window.approvePendingChange(mpcId, null, 'rejected');
    if (success) {
        window._pendingApprovals = window._pendingApprovals.filter(a => a.mpc_id !== mpcId);
        window.renderApprovalsList();
    } else {
        alert('Failed to reject. Check console for errors.');
        if (card) card.style.opacity = '1';
    }
};

window.saveAndApproveApproval = async function (mpcId) {
    let finalData = {};
    const app = (window._pendingApprovals || []).find(a => a.mpc_id === mpcId);
    if (!app) return;

    const formContainer = document.getElementById(`app-form-${mpcId}`);
    if (formContainer && window._approvalEditMode) {
        const inputs = formContainer.querySelectorAll('[data-key]');
        inputs.forEach(input => {
            const key = input.getAttribute('data-key');
            let val = input.value;
            if (input.type === 'number' && val) val = parseFloat(val);
            finalData[key] = val;
        });
    } else {
        finalData = typeof app.mpc_proposed_data === 'string' ? JSON.parse(app.mpc_proposed_data || '{}') : (app.mpc_proposed_data || {});
    }

    const card = document.getElementById(`approval-card-${mpcId}`);
    if (card) card.style.opacity = '0.5';

    const success = await window.approvePendingChange(mpcId, finalData, window._approvalEditMode ? 'edited_then_approved' : 'approved');
    if (success) {
        window._pendingApprovals = window._pendingApprovals.filter(a => a.mpc_id !== mpcId);
        window.renderApprovalsList();
    } else {
        alert('Failed to approve. Check console for errors.');
        if (card) card.style.opacity = '1';
    }
};

// Global click listener for closing popovers
document.addEventListener('click', function (e) {
    const attPopover = document.getElementById('edit-int-attendees-popover');
    if (attPopover && attPopover.style.display === 'block' && !e.target.closest('#edit-int-attendees-wrapper')) {
        attPopover.style.display = 'none';
    }
    const outPopover = document.getElementById('edit-int-outcome-popover');
    if (outPopover && outPopover.style.display === 'block' && !e.target.closest('#edit-int-outcome-wrapper')) {
        outPopover.style.display = 'none';
    }
});

window.showToast = function (message) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.style.cssText = 'position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:#10b981; color:#fff; padding:0.75rem 1.5rem; border-radius:8px; font-weight:500; font-family:"Inter", sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; opacity:0; transition:all 0.3s ease; pointer-events:none;';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, -20px)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
    }, 2500);
};

// ══════════════════════════════════════════════════════════════════════
//  CONTACTS
// ══════════════════════════════════════════════════════════════════════

function renderContacts() {
    window.filterContacts();
}

window.toggleContactSort = function() {
    window._contactSortAZ = !window._contactSortAZ;
    const btn = document.getElementById('contact-sort-btn');
    if (btn) {
        btn.innerHTML = window._contactSortAZ 
            ? `<span class="material-symbols-outlined" style="font-size:1.1rem;">sort_by_alpha</span> Sort Z-A` 
            : `<span class="material-symbols-outlined" style="font-size:1.1rem;">sort_by_alpha</span> Sort A-Z`;
    }
    window.filterContacts();
};

window.filterContacts = function () {
    const listEl = document.getElementById('contact-list');
    if (!listEl) return;

    let query = '';
    const searchInp = document.getElementById('contact-search');
    if (searchInp) query = searchInp.value.toLowerCase();

    const contacts = window.getData('contacts') || [];

    let filtered = contacts.filter(c => {
        if (query && !c.name.toLowerCase().includes(query) &&
            !(c.organisation || '').toLowerCase().includes(query) &&
            !(c.email || '').toLowerCase().includes(query)) return false;
        return true;
    });

    if (window._contactSortAZ === true) {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (window._contactSortAZ === false) {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    listEl.innerHTML = filtered.map(c => {
        const parts = c.name.split(' ').filter(p => p);
        let initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ? parts[0].substring(0, 2) : '?');
        initials = initials.toUpperCase();
        const hue = (c.name.length * (c.name.charCodeAt(0) || 1) * 17) % 360;
        const color = `hsl(${hue}, 65%, 45%)`;
        
        // Contacts are filtered by eq('co_active', true) in supabase, so they are always active if they made it here, 
        // but we'll check c.active !== false just in case.
        const isActive = c.active !== false;

        return `
        <div class="adet-card" style="padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s, box-shadow 0.2s; cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.05)';">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div style="width:48px; height:48px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:600; flex-shrink:0;">
                        ${initials}
                    </div>
                    <span style="display:inline-flex; align-items:center; padding:0.2rem 0.6rem; border-radius:100px; font-size:0.75rem; font-weight:600; background:${isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color:${isActive ? 'var(--energy-algae)' : 'var(--energy-alert)'};">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem; margin-bottom:0.25rem;">${c.name}</div>
                <div style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
                    <span class="material-symbols-outlined" style="font-size:1rem; color:var(--text-tertiary);">domain</span>
                    ${c.organisation || 'No Organisation'}
                </div>
            </div>
            <div style="padding-top:1rem; border-top:1px solid var(--border-subtle); color:var(--text-secondary); font-size:0.85rem; display:flex; align-items:center; gap:0.4rem;">
                <span class="material-symbols-outlined" style="font-size:1rem; color:var(--text-tertiary);">mail</span>
                ${c.email || 'No Email'}
            </div>
        </div>
        `;
    }).join('');

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-tertiary); background:var(--bg-app); border:1px dashed var(--border-subtle); border-radius:12px;">No contacts found</div>`;
    }
};
