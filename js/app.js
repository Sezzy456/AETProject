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
    if (!container) return;
    container.innerHTML = '';

    stakeholders.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.position = 'relative';
        card.style.cursor = 'pointer';
        card.style.border = '1px solid var(--border-subtle)';
        card.style.borderRadius = '12px';
        card.style.padding = '1.5rem';
        card.style.background = 'var(--bg-surface)';
        card.style.transition = 'all 0.2s';

        card.onclick = () => {
            if (document.getElementById('view-container')) {
                window.currentStakeholderId = s.id;
                loadView('stakeholder_detail');
            } else {
                location.href = `stakeholder_detail.html?id=${s.id}`;
            }
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

        let statusColor = 'var(--text-secondary)';
        let statusBg = 'rgba(0,0,0,0.05)';
        if (s.status === 'Needs Attention') {
            statusColor = 'var(--energy-alert)';
            statusBg = 'rgba(239, 68, 68, 0.2)';
        } else if (s.status === 'Monitor') {
            statusColor = 'var(--energy-mid)';
            statusBg = 'rgba(245, 158, 11, 0.2)';
        } else if (s.status === 'Active') {
            statusBg = 'rgba(0,0,0,0.1)';
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                <h3 style="margin:0; font-size:1.2rem; color:var(--text-primary);">${s.name}</h3>
                <div style="font-size:0.85rem; color:var(--text-secondary);">
                    ${ownersHtml}
                </div>
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

    // Status Badge and Seg Bar Highlighting
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

        // Highlight horizontal segment
        const currentStatusEl = document.getElementById('view-current-status-text');
        if (currentStatusEl) {
            currentStatusEl.textContent = s.status;
        }

        const segments = document.querySelectorAll('#view-status-selector .seg-block');
        segments.forEach(el => {
            if (el.getAttribute('data-status') === s.status) el.classList.add('active');
            else el.classList.remove('active');
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

    // Power Dynamics Matrix Verb
    if (s.powerDynamics) {
        setTxt('view-influence-label', s.powerDynamics.influence);
        setTxt('view-interest-label', s.powerDynamics.interest);

        const inf = (s.powerDynamics.influence || '').toLowerCase();
        const int = (s.powerDynamics.interest || '').toLowerCase();
        let verbStr = 'MONITOR';
        if (inf === 'high' && int === 'high') verbStr = 'ENGAGE';
        else if (inf === 'high' && int === 'low') verbStr = 'SATISFY';
        else if (inf === 'low' && int === 'high') verbStr = 'INFORM';

        const vBadge = document.getElementById('view-matrix-verb');
        if (vBadge) vBadge.textContent = verbStr;

        const infBar = document.getElementById('view-influence-bar');
        const intBar = document.getElementById('view-interest-bar');
        const getPct = (str) => { return str.toLowerCase() === 'high' ? '100%' : str.toLowerCase() === 'medium' ? '50%' : '15%'; };
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

    // Status Journey Timeline (Horizontal History)
    const hl = document.getElementById('view-status-history-lines');
    if (hl && s.statusHistory && s.statusHistory.length > 0) {
        hl.innerHTML = '';

        // Define percentages correlating to vertical bands
        const statusY = {
            'Operational': '8%',
            'Stable': '25%',
            'Dormant': '41%',
            'Friction Points': '58%',
            'Strained': '75%',
            'Critical/At Risk': '91%'
        };

        const len = s.statusHistory.length;
        let svgLines = '';
        let dotsHtml = '';

        s.statusHistory.forEach((sh, i) => {
            const y = statusY[sh.status] || '50%';
            const x = len === 1 ? 50 : 10 + (70 / (len - 1)) * i;

            if (i > 0) {
                const prevY = statusY[s.statusHistory[i - 1].status] || '50%';
                const prevX = 10 + (70 / (len - 1)) * (i - 1);
                svgLines += `<line x1="${prevX}%" y1="${prevY}" x2="${x}%" y2="${y}" stroke="#60a5fa" stroke-width="3" />`;
            }

            const isLast = i === len - 1;
            const dotSize = isLast ? 20 : 16;
            const color = isLast ? '#3b82f6' : '#1e3a8a';
            const hoverLabel = isLast ? 'Current' : sh.date;

            dotsHtml += `
                <div style="position:absolute; left:${x}%; bottom:-25px; transform:translateX(-50%); font-size:0.7rem; color:var(--text-secondary); font-weight:600; white-space:nowrap;">
                    ${sh.date}
                </div>
            `;

            if (isLast) {
                dotsHtml += `
                    <div style="position:absolute; left:${x}%; top:0; height:100%; width:16px; transform:translateX(-50%); display:flex; flex-direction:column; border-radius:100px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.2); border:2px solid #fff; z-index:4; background:#e5e7eb;">
                        <div style="flex:1; cursor:pointer; position:relative; background:#22c55e;" onclick="updateDetailStatus('Operational')" title="Operational">
                            ${sh.status === 'Operational' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#a3e635;" onclick="updateDetailStatus('Stable')" title="Stable">
                            ${sh.status === 'Stable' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#f9fafb;" onclick="updateDetailStatus('Dormant')" title="Dormant">
                            ${sh.status === 'Dormant' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#eab308;" onclick="updateDetailStatus('Friction Points')" title="Friction Points">
                            ${sh.status === 'Friction Points' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#f97316;" onclick="updateDetailStatus('Strained')" title="Strained">
                            ${sh.status === 'Strained' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                        <div style="flex:1; cursor:pointer; position:relative; background:#ef4444;" onclick="updateDetailStatus('Critical/At Risk')" title="Critical/At Risk">
                            ${sh.status === 'Critical/At Risk' ? '<div style="position:absolute; top:50%; left:50%; width:8px; height:8px; background:#000; border-radius:50%; transform:translate(-50%,-50%); border:2px solid #fff;"></div>' : ''}
                        </div>
                    </div>
                    <div style="position:absolute; left:${x}%; top:${y}; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; border:2px solid #22c55e; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite; z-index:3; pointer-events:none;"></div><style>@keyframes ping{75%,100%{transform:scale(1.5);opacity:0;}}</style>
                 `;
            } else {
                dotsHtml += `
                    <div class="custom-tooltip" style="position:absolute; left:${x}%; top:${y}; transform:translate(-50%, -50%);">
                       <div style="width:${dotSize}px; height:${dotSize}px; border-radius:50%; background:${color}; border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,0.3); z-index:2;"></div>
                       
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
            <div style="position:absolute; left:92%; top:8%; transform:translate(-50%, -50%); background:#22c55e; color:#fff; padding:2px 10px; border-radius:100px; font-size:0.7rem; font-weight:bold; z-index:2; box-shadow:0 2px 4px rgba(34,197,94,0.3);">
                Desired
            </div>
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

    // Conduct
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

    // Audience Message
    const kb = window.getData('knowledgeBank');
    if (kb && kb.audienceMessages) {
        const audMsg = kb.audienceMessages.find(a => a.title === s.name);
        if (audMsg) {
            setTxt('view-kb-audience-title', audMsg.title);
            setTxt('view-kb-audience-text', audMsg.text);
        } else {
            setTxt('view-kb-audience-title', "Specific Audience Messages");
            setTxt('view-kb-audience-text', '(No tailored message in Knowledge Bank mapping to this stakeholder.)');
        }
    }

    // Dynamic Actions & Interactions List Embedded
    const actContainer = document.getElementById('stakeholder-actions-container');
    if (actContainer) {
        const allActions = window.getData('actions') || [];
        const shActions = allActions.filter(a => a.linkType === 'Stakeholder' && a.linkId === s.id);
        if (shActions.length === 0) {
            actContainer.innerHTML = '<span style="color:var(--text-tertiary); font-style:italic; font-size:0.9rem;">No linked actions.</span>';
        } else {
            actContainer.innerHTML = shActions.map(a => `<div class="card" style="padding:1rem; border:1px solid var(--border-subtle); border-radius:8px; background:var(--bg-app); display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                 <div>
                     <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">${a.activity}</div>
                     <span style="font-size:0.8rem; color:var(--text-secondary);">Owner: ${a.owner || '-'} | Due: ${a.dueDate || '-'}</span>
                 </div>
                 <div><span class="status-badge" style="border-color:#3b82f6; color:#3b82f6; padding:0.1rem 0.5rem; font-size:0.75rem;">${a.status}</span></div>
             </div>`).join('');
        }
    }

    const intContainer = document.getElementById('stakeholder-interactions-container');
    if (intContainer) {
        const allLogs = window.getData('activityLog') || [];
        const shLogs = allLogs.filter(l => (l.attendees && l.attendees.includes(s.name)) || l.title.includes(s.name) || (l.attendees && l.attendees.includes("Linda Vo")));
        if (shLogs.length === 0) {
            intContainer.innerHTML = '<span style="color:var(--text-tertiary); font-style:italic; font-size:0.9rem;">No recent interactions.</span>';
        } else {
            intContainer.innerHTML = shLogs.map(l => `<div class="card" style="padding:1rem; border:1px solid var(--border-subtle); border-radius:8px; background:var(--bg-app); cursor:pointer;">
                 <div style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:0.25rem;">${l.date}</div>
                 <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">${l.title}</div>
                 <div style="font-size:0.85rem; color:var(--text-secondary);">${l.notes}</div>
             </div>`).join('');
        }
    }
}

// Tracking function for the horizontal segment
window.updateDetailStatus = function (newStatus) {
    const id = window.currentStakeholderId;
    if (!id) return;

    // Add logic to save the new status natively + mock history record
    const stakeholders = window.getData('stakeholders');
    const s = stakeholders.find(item => item.id == id);
    if (!s) return;

    // Simulate appending to history
    const history = s.statusHistory || [];
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');

    history.push({
        date: dateStr,
        status: newStatus,
        notes: "Status manually updated in portal."
    });

    window.updateStakeholder(id, {
        status: newStatus,
        statusHistory: history
    });

    renderStakeholderDetail(); // Re-render instantly without full reload to demonstrate reactivity
};

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
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h2>Stakeholders</h2>
            </div>
            <button class="btn-primary" style="background:#a3a3a3; border:none; color:white;">+ Add Stakeholder</button>
        </header>

        <!-- Search and Filters Bar -->
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <div style="position:relative; flex:1; max-width:300px;">
                <input type="text" placeholder="Search" style="width:100%; padding:0.5rem 0.5rem 0.5rem 2.5rem; border-radius:100px; border:1px solid var(--border-subtle); background:var(--bg-surface); color:var(--text-primary);">
                <span class="material-symbols-outlined" style="position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); font-size:1.2rem; color:var(--text-tertiary);">search</span>
            </div>
            <button class="btn-secondary" style="border-radius:100px; padding:0.5rem 1rem; border:none; background:var(--bg-surface); box-shadow:0 2px 4px rgba(0,0,0,0.05);"><span class="material-symbols-outlined" style="font-size:1.2rem; vertical-align:middle; margin-right:0.25rem;">filter_list</span> Filters</button>
            <button style="border:none; background:none; color:var(--text-primary); display:flex; align-items:center; cursor:pointer;"><span class="material-symbols-outlined" style="margin-right:0.25rem;">sort</span> Sorting</button>
        </div>
        
        <!-- Quick Filters -->
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:2rem; flex-wrap:wrap; font-size:0.8rem;">
            <span style="font-weight:600; color:var(--text-secondary);">Quick Filters:</span>
            <span style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">🔍 Needs Attention</span>
            <span style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">🔍 Primary Partner</span>
            <span style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">🔍 High Interest</span>
            <span style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">🔍 Supply Chain</span>
            <span style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer;">🔍 Current Posture != Desired Posture</span>
        </div>

        <div id="stakeholder-list" style="display:flex; flex-direction:column; gap:1.5rem;">
            <!-- Populated by JS -->
        </div>
    `;
}

function getStakeholderDetailTemplate() {
    return `
        <style>
        .custom-tooltip {
            position: relative;
            display: inline-block;
        }
        .custom-tooltip .custom-tooltip-content {
            visibility: hidden;
            opacity: 0;
            width: 380px;
            background-color: var(--bg-surface);
            color: var(--text-primary);
            text-align: left;
            border-radius: 6px;
            padding: 1rem;
            position: absolute;
            z-index: 100;
            top: 150%;
            right: 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid var(--border-subtle);
            transition: opacity 0.2s;
            font-size: 0.85rem;
            line-height:1.4;
        }
        .custom-tooltip:hover .custom-tooltip-content {
            visibility: visible;
            opacity: 1;
        }
        .status-dot {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            margin-right: 8px;
            border: 1px solid rgba(0,0,0,0.2);
            flex-shrink:0;
            margin-top:2px;
        }
        .status-def { display:flex; margin-bottom:0.75rem; align-items:flex-start; }
        .status-def strong { margin-right:4px; }
        
        /* 2x2 Matrix CSS */
        .matrix-container {
            width: 100%;
            aspect-ratio: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 4px;
            padding: 24px 10px 10px 34px; 
            position: relative;
            background: #fff;
            border-radius: 8px;
        }
        .matrix-container::before {
            content: ''; position: absolute; left: 24px; top: 10px; bottom: 24px; width: 1px; background: #000;
        }
        .matrix-container::after {
            content: ''; position: absolute; left: 24px; bottom: 24px; right: 10px; height: 1px; background: #000;
        }
        .matrix-y-axis { position: absolute; left: -10px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: 0.75rem; font-weight: 600; color: #000; }
        .matrix-x-axis { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 600; color: #000; }
        .matrix-plus-top { position: absolute; top:0; left:18px; font-weight:bold; font-size:12px; }
        .matrix-minus-bot { position: absolute; bottom:20px; left:18px; font-weight:bold; font-size:12px; }
        .matrix-minus-left { position: absolute; bottom:28px; left:20px; font-weight:bold; font-size:12px; }
        .matrix-plus-right { position: absolute; bottom:28px; right:6px; font-weight:bold; font-size:12px; }
        
        .matrix-box { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-radius: 2px; }
        .matrix-box .title { font-weight: 800; margin-top:0.5rem; letter-spacing:0.5px; }
        .matrix-box .sub { font-size: 0.7rem; color: rgba(0,0,0,0.7); line-height:1.2; }
        
        .matrix-tl, .matrix-tr, .matrix-bl, .matrix-br { background: #fff; border: 1px solid #e5e7eb; }
        
        .matrix-verb-badge {
            background:#000; color:#fff; padding:0.1rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:bold; letter-spacing:0.5px;
        }

        .seg-bar {
            display: flex;
            height: 18px;
            border-radius: 100px;
            overflow: hidden;
            margin-top: 1.5rem;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
            background: #e5e7eb; 
            width: 100%;
            max-width: 250px;
        }
        .seg-block { flex: 1; cursor: pointer; transition: opacity 0.2s, transform 0.1s; position:relative; }
        .seg-block:hover { opacity: 0.8; }
        .seg-block.active::after {
            content:''; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);
            width:10px; height:10px; border-radius:50%; background:#000; border:2px solid rgba(255,255,255,0.8); z-index:2; box-shadow:0 1px 2px rgba(0,0,0,0.3);
        }
        
        /* vertical history var */
        .vert-seg-bar {
            display: flex;
            flex-direction: column;
            width: 16px;
            border-radius: 100px;
            overflow: hidden;
            background: #e5e7eb;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .vert-seg-block { flex: 1; }
        </style>

        <!-- Breadcrumbs -->
        <div style="font-size:0.85rem; margin-bottom:1rem; color:var(--text-secondary);">
            <span style="color:#3b82f6; cursor:pointer;" onclick="loadView('stakeholders')">Stakeholders</span> > <span id="view-breadcrumb-name">...</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:1.5rem;">
            <!-- Core Profile Card -->
            <div style="position:relative; background:var(--bg-surface); padding:2rem; border:1px solid var(--border-subtle); border-radius:12px; overflow:visible;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                    <div>
                        <h2 id="detail-name" style="margin:0 0 0.5rem 0; font-size:1.5rem;">Loading Profile...</h2>
                        <div style="font-size:0.9rem;">
                            <span style="color:var(--text-tertiary);">Role:</span> <span id="view-role" style="color:#3b82f6;">-</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:flex-end;">
                        <!-- The badge goes down below with Current Status inline! -->
                    </div>
                </div>
                <div style="margin-bottom:1.5rem; margin-top:1.5rem;">
                    <span style="color:var(--text-tertiary); font-size:0.85rem;">Narrative Hook:</span>
                    <div id="view-narrativeHook" style="font-style:italic; font-size:1.1rem; color:var(--text-primary); margin-top:0.25rem;">-</div>
                </div>

                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="color:var(--text-tertiary); font-size:0.85rem;">Values:</span>
                    <div id="view-values-container" style="display:flex; gap:0.5rem; flex-wrap:wrap;"></div>
                </div>

                <hr style="border:none; border-top:1px solid var(--border-subtle); margin:2rem 0;">

                <h3 style="display:flex; align-items:center; gap:0.5rem; font-size:1rem; margin-bottom:1rem; color:var(--text-secondary); text-transform:uppercase;">
                    <span>Power Dynamics</span>
                    <div style="margin-left:auto; display:flex; align-items:center; gap:0.5rem;">
                        <span id="view-matrix-verb" class="matrix-verb-badge"></span>
                        <div class="custom-tooltip">
                            <span class="material-symbols-outlined" style="display:block; font-size:1rem; cursor:help; vertical-align:middle;">info</span>
                            <div class="custom-tooltip-content" style="width:300px; top:120%; right:0; left:auto; transform:none; font-family:var(--font-body), sans-serif; font-weight:normal; text-transform:none;">
                                <div class="matrix-container">
                                    <div class="matrix-plus-top">+</div>
                                    <div class="matrix-y-axis">Influence</div>
                                    <div class="matrix-minus-bot">-</div>
                                    
                                    <div class="matrix-minus-left">-</div>
                                    <div class="matrix-x-axis">Interest</div>
                                    <div class="matrix-plus-right">+</div>
                                    
                                    <div class="matrix-box matrix-tl">
                                        <div class="sub">High influence<br>Low interest</div>
                                        <div class="title">SATISFY</div>
                                    </div>
                                    <div class="matrix-box matrix-tr">
                                        <div class="sub">High influence<br>High interest</div>
                                        <div class="title">ENGAGE</div>
                                    </div>
                                    <div class="matrix-box matrix-bl" style="color:#000;">
                                        <div class="sub" style="color:rgba(0,0,0,0.8);">Low influence<br>Low interest</div>
                                        <div class="title">MONITOR</div>
                                    </div>
                                    <div class="matrix-box matrix-br" style="color:#000;">
                                        <div class="sub" style="color:rgba(0,0,0,0.8);">Low influence<br>High interest</div>
                                        <div class="title">INFORM</div>
                                    </div>
                                </div>
                                <div style="margin-top:1rem; text-align:center; font-size:0.75rem; color:var(--text-secondary); text-transform:none;">Power grid model for stakeholder prioritisation</div>
                            </div>
                        </div>
                    </div>
                </h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:1.5rem;">
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem;">
                            <span>Influence:</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <span style="font-size:0.9rem; font-weight:600;" id="view-influence-label">-</span>
                            <div style="flex:1; height:6px; background:var(--border-subtle); border-radius:100px; position:relative;">
                                <div id="view-influence-bar" style="position:absolute; left:0; top:0; height:100%; width:0%; background:var(--text-secondary); border-radius:100px;"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Interest:</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <span style="font-size:0.9rem; font-weight:600;" id="view-interest-label">-</span>
                            <div style="flex:1; height:6px; background:var(--border-subtle); border-radius:100px; position:relative;">
                                <div id="view-interest-bar" style="position:absolute; left:0; top:0; height:100%; width:0%; background:var(--text-secondary); border-radius:100px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;" id="view-power-values-container"></div>
                <div style="font-size:0.85rem;">
                    <span style="color:var(--text-tertiary);">Decision-Making Authority:</span> <span id="view-authority" style="color:var(--text-primary);">-</span>
                </div>

                <hr style="border:none; border-top:1px solid var(--border-subtle); margin:2rem 0;">

                <h3 style="font-size:1rem; margin-bottom:1rem; color:var(--text-secondary);">Posture Journey:</h3>
                <div style="display:flex; align-items:center; gap:2rem; margin-bottom:2rem;">
                    <div style="flex:1; border:1px solid var(--border-subtle); padding:1rem; border-radius:8px; background:var(--bg-app);">
                        <div style="color:#3b82f6; font-size:0.8rem; font-weight:600; margin-bottom:0.5rem;">Current:</div>
                        <div id="view-posture-current" style="font-size:0.95rem;">-</div>
                    </div>
                    <span class="material-symbols-outlined" style="color:var(--text-tertiary);">arrow_forward</span>
                    <div style="flex:1; border:1px solid #3b82f6; padding:1rem; border-radius:8px; background:rgba(59,130,246,0.05);">
                        <div style="color:#3b82f6; font-size:0.8rem; font-weight:600; margin-bottom:0.5rem;">Desired:</div>
                        <div id="view-posture-desired" style="font-size:0.95rem;">-</div>
                        <div style="margin-top:1rem; font-size:0.85rem; border-top:1px solid rgba(59,130,246,0.2); padding-top:0.5rem; display:flex; justify-content:space-between;">
                            <span><span style="color:#ef4444; font-weight:bold;">Next Step:</span> <span id="view-posture-next">-</span></span>
                            <span><span style="color:#ef4444; font-weight:bold;">Goal/Target:</span> <span id="view-posture-target">-</span></span>
                        </div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:1.5rem; margin-bottom:1rem; padding:0.5rem 0;">
                    <div style="font-size:1rem; font-weight:600; color:var(--text-secondary); display:flex; align-items:center;">
                        Current Status: <span id="view-status-badge" style="background:rgba(245, 158, 11, 0.2); color:var(--energy-mid); padding:0.2rem 0.6rem; border-radius:4px; font-weight:600; font-size:0.8rem; margin-left:0.5rem;">-</span>
                        <span id="view-current-status-text" style="display:none;">-</span>
                        <div class="custom-tooltip" style="margin-left:0.5rem;">
                            <span class="material-symbols-outlined" style="color:var(--text-tertiary); font-size:1.1rem; cursor:help;">info</span>
                            <div class="custom-tooltip-content" style="left:0; right:auto; transform:none; text-transform:none;">
                                <div style="margin-bottom:0.5rem;">Status Levels:</div>
                                <div class="status-def"><span class="status-dot" style="background:#22c55e;"></span> <span><strong>Operational</strong> - Relationship is healthy; communication is fluid.</span></div>
                                <div class="status-def"><span class="status-dot" style="background:#a3e635;"></span> <span><strong>Stable</strong> - Positive momentum; relationship is secure and growing.</span></div>
                                <div class="status-def"><span class="status-dot" style="background:#eab308;"></span> <span><strong>Friction Points</strong> - Alignment exists, but issues cause drag.</span></div>
                                <div class="status-def"><span class="status-dot" style="background:#f97316;"></span> <span><strong>Strained</strong> - High risk of misalignment; requires intervention.</span></div>
                                <div class="status-def"><span class="status-dot" style="background:#ef4444;"></span> <span><strong>Critical/At Risk</strong> - The partnership is failing or blocked.</span></div>
                                <div class="status-def"><span class="status-dot" style="background:#e5e7eb;"></span> <span><strong>Dormant</strong> - No current engagement; relationship is neutral.</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="seg-bar" id="view-status-selector" style="margin:0;">
                        <div class="seg-block" style="background:#ef4444;" onclick="updateDetailStatus('Critical/At Risk')" title="Critical/At Risk" data-status="Critical/At Risk"></div>
                        <div class="seg-block" style="background:#f97316;" onclick="updateDetailStatus('Strained')" title="Strained" data-status="Strained"></div>
                        <div class="seg-block" style="background:#eab308;" onclick="updateDetailStatus('Friction Points')" title="Friction Points" data-status="Friction Points"></div>
                        <div class="seg-block" style="background:#f9fafb;" onclick="updateDetailStatus('Dormant')" title="Dormant" data-status="Dormant"></div>
                        <div class="seg-block" style="background:#a3e635;" onclick="updateDetailStatus('Stable')" title="Stable" data-status="Stable"></div>
                        <div class="seg-block" style="background:#22c55e;" onclick="updateDetailStatus('Operational')" title="Operational" data-status="Operational"></div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">Click to update</div>
                </div>

                <!-- Status Journey Map Accordion -->
                <div style="border:1px solid var(--border-subtle); border-radius:8px; margin-bottom:2rem;">
                    <div style="padding:1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:var(--bg-app); border-radius:8px;" onclick="const c=document.getElementById('status-map-content'); const i=document.getElementById('status-map-icon'); if(c.style.display==='none'){c.style.display='block';i.style.transform='rotate(90deg)';}else{c.style.display='none';i.style.transform='rotate(0deg)';}">
                        <div style="font-size:0.9rem; font-weight:500;">Status: Status Journey Map</div>
                        <span id="status-map-icon" class="material-symbols-outlined" style="transition:transform 0.2s;">arrow_right</span>
                    </div>
                    <div id="status-map-content" style="display:none; padding:1.5rem; border-top:1px solid var(--border-subtle);">
                    
                         <div style="font-size:0.85rem; font-weight:600; color:var(--text-secondary); margin-bottom:1rem;">Status History Map</div>
                         <div id="view-status-history-lines" style="position:relative; width:50%; min-width:400px; height:200px; background:linear-gradient(to bottom, #22c55e 0%, #22c55e 16.6%, #a3e635 16.6%, #a3e635 33.3%, #f9fafb 33.3%, #f9fafb 50%, #eab308 50%, #eab308 66.6%, #f97316 66.6%, #f97316 83.3%, #ef4444 83.3%, #ef4444 100%); border-radius:8px; border:none; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-bottom:1rem;">
                              <!-- Rendered via JS -->
                         </div>
                    </div>
                </div>

                <h3 style="font-size:1rem; margin-bottom:0.5rem; color:#3b82f6;">Strategic Approach (How to get there):</h3>
                <div style="font-size:0.9rem; margin-bottom:0.5rem;">
                    <span style="color:#3b82f6;">Barriers:</span> <span style="color:var(--text-tertiary);">(why? blockers)</span>
                </div>
                <div id="view-barriers" style="font-size:0.9rem; font-style:italic; margin-bottom:1rem;">-</div>

                <div style="font-size:0.9rem; margin-bottom:0.5rem;">
                    <span style="color:#3b82f6;">Engagement Approach (text):</span>
                </div>
                <div id="view-engagement-approach" style="font-size:0.9rem; margin-bottom:1rem; line-height:1.5;">-</div>

                <div style="font-size:0.9rem; margin-bottom:0.5rem; color:#3b82f6;">Engagement Tactics:</div>
                <div id="view-tactics" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.5rem;"></div>

                <div style="display:flex; justify-content:flex-end; margin-top:0.5rem;">
                    <button class="btn-primary" onclick="document.getElementById('edit-modal').showModal()"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit</button>
                </div>
            </div>

            <!-- Contact Conduct / Communication -->
            <div style="background:var(--bg-surface); padding:2rem; border:1px solid var(--border-subtle); border-radius:12px;">
                <h3 style="font-size:1.2rem; margin-bottom:1.5rem; color:var(--text-secondary);">Contact Conduct / Communication</h3>
                
                <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.9rem; margin-bottom:2rem;">
                    <div><span style="color:var(--text-tertiary);">Communication Preferences:</span> <span id="view-contact-pref">-</span></div>
                    <div><span style="color:var(--text-tertiary);">Email tone:</span> <span id="view-contact-tone">-</span></div>
                    <div><span style="color:var(--text-tertiary);">Elevator pitches:</span> <span id="view-contact-pitch">-</span></div>
                </div>

                <h4 style="font-size:1rem; margin-bottom:1rem; color:var(--text-secondary);">Key Contacts</h4>
                <div style="display:flex; gap:2rem; flex-wrap:wrap;">
                    <div id="view-contacts-list" style="flex:1; display:flex; flex-direction:column; gap:1rem; min-width:300px;"></div>
                    
                    <div style="width:300px; background:var(--bg-app); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px;">
                        <span style="font-size:0.8rem; font-weight:600; display:block; margin-bottom:0.5rem;">Quick Add:</span>
                        <input type="text" placeholder="Name" style="width:100%; padding:0.4rem; margin-bottom:0.5rem; border:1px solid var(--border-subtle); background:var(--bg-surface); border-radius:4px;">
                        <input type="text" placeholder="Role (e.g. CEO)" style="width:100%; padding:0.4rem; margin-bottom:0.5rem; border:1px solid var(--border-subtle); background:var(--bg-surface); border-radius:4px;">
                        <input type="text" placeholder="Email Address" style="width:100%; padding:0.4rem; margin-bottom:0.5rem; border:1px solid var(--border-subtle); background:var(--bg-surface); border-radius:4px;">
                        <input type="text" placeholder="Phone Number" style="width:100%; padding:0.4rem; margin-bottom:0.8rem; border:1px solid var(--border-subtle); background:var(--bg-surface); border-radius:4px;">
                        <div style="display:flex; justify-content:flex-end;">
                            <button class="btn-primary" style="background:#a3a3a3; border:none; color:white; padding:0.2rem 1rem;">Add</button>
                        </div>
                    </div>
                </div>
                <!-- Action bar -->
                <div style="display:flex; justify-content:center; margin-top:1rem;">
                     <button class="btn-secondary" style="font-size:0.75rem;"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span> Edit Contacts</button>
                </div>

                <hr style="border:none; border-top:1px solid var(--border-subtle); margin:2rem 0;">

                <h4 style="font-size:1rem; margin-bottom:1rem; color:var(--text-secondary);">Audience Specific Message View</h4>
                <div class="card" style="background:var(--bg-app); border:1px solid var(--border-subtle); padding:1.5rem; border-radius:8px; margin-bottom:2rem; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:0.5rem; color:#3b82f6; font-weight:600; margin-bottom:1rem;">
                        <span class="material-symbols-outlined">groups</span> <span id="view-kb-audience-title">-</span>
                    </div>
                    <p id="view-kb-audience-text" style="font-size:0.9rem; line-height:1.5; color:var(--text-primary); margin:0;">-</p>
                </div>

                <h4 style="font-size:1rem; margin-bottom:1rem; color:var(--text-secondary);">Relationships</h4>
                <div style="font-size:0.9rem; line-height:1.5; display:flex; flex-direction:column; gap:0.5rem;">
                    <div><span style="color:var(--text-tertiary);">Internal Link:</span> <span id="view-rel-internal">-</span></div>
                    <div><span style="color:var(--text-tertiary);">External Tension:</span> <span id="view-rel-external">-</span></div>
                    <div style="margin-top:0.5rem;"><span style="color:var(--text-tertiary); font-weight:600;">"Key Ties"</span></div>
                    <ul id="view-rel-ties" style="margin:0; padding-left:1.5rem; color:var(--text-primary);"></ul>
                    <div style="margin-top:0.5rem;"><span style="color:var(--text-tertiary); font-weight:600;">"Friction Points"</span></div>
                    <ul id="view-rel-friction" style="margin:0; padding-left:1.5rem; color:var(--text-primary);"></ul>
                </div>
            </div>

            <!-- Actions View -->
            <div style="background:var(--bg-surface); padding:2rem; border:1px solid var(--border-subtle); border-radius:12px;">
                <h3 style="font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-secondary);">Actions (upcoming and recently edited (including completed)) View</h3>
                <div id="stakeholder-actions-container" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem;">
                    <!-- Actions injected here -->
                </div>
                <div style="display:flex; justify-content:flex-end;">
                     <button class="btn-primary" style="background:#a3a3a3; border:none; color:white;">+ Quick Add</button>
                </div>
            </div>

            <!-- Interactions View -->
            <div style="background:var(--bg-surface); padding:2rem; border:1px solid var(--border-subtle); border-radius:12px;">
                <h3 style="font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-secondary);">Interactions (recent and upcoming) View</h3>
                <div id="stakeholder-interactions-container" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem;">
                    <!-- Interactions injected here -->
                </div>
                <div style="display:flex; justify-content:flex-end;">
                     <button class="btn-primary" style="background:#a3a3a3; border:none; color:white;">+ Add</button>
                </div>
            </div>
        </div>

        <dialog id="edit-modal" onmousedown="if(event.target===this)this.close()" style="border:1px solid var(--border-subtle); border-radius:8px; padding:1.5rem; width:500px; max-width:90vw; background:var(--bg-surface); color:var(--text-primary); box-shadow:0 10px 30px rgba(0,0,0,0.3); margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                 <h3>Edit basic profile (Mock)</h3>
                 <button onclick="document.getElementById('edit-modal').close()" style="background:none; border:none; cursor:pointer;"><span class="material-symbols-outlined">close</span></button>
            </div>
            <p style="font-size:0.9rem; color:var(--text-secondary);">Editing full schema via modal is omitted for layout focus.</p>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button class="btn-primary" onclick="document.getElementById('edit-modal').close()">Close</button>
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
        let offset = { x: 0, y: 0 };
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

window.openSpineModal = function (type, id = null) {
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
        const p = id ? spine.pillars.find(x => x.id === id) : { title: '', message: '', proofPoints: [] };
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

window.moveProofPointUp = function (btn) {
    const row = btn.closest('div');
    if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
};

window.moveProofPointDown = function (btn) {
    const row = btn.closest('div');
    if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
};

window.saveObjectiveInline = function (id, val) {
    if (!val.trim()) return; // prevent empty
    const spine = window.getData('spine');
    const obj = spine.objectives.find(o => o.id === id);
    if (obj) {
        obj.text = val;
        window.updateData('spine', spine);
    }
    refreshSpineUI(); // re-render to text view
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
    if (dir === -1 && idx > 0) {
        const temp = spine.objectives[idx];
        spine.objectives[idx] = spine.objectives[idx - 1];
        spine.objectives[idx - 1] = temp;
    } else if (dir === 1 && idx < spine.objectives.length - 1) {
        const temp = spine.objectives[idx];
        spine.objectives[idx] = spine.objectives[idx + 1];
        spine.objectives[idx + 1] = temp;
    }
    window.updateData('spine', spine);
    refreshSpineUI();
};

window.addObjectiveInline = function () {
    const spine = window.getData('spine');
    const newId = 'obj' + Date.now();
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
    if (modal && header) {
        let isDragging = false, startX, startY, initialX, initialY;
        header.addEventListener('mousedown', e => {
            if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const style = window.getComputedStyle(modal);
            const matrix = new DOMMatrixReadOnly(style.transform !== 'none' ? style.transform : 'matrix(1,0,0,1,0,0)');
            initialX = matrix.m41; initialY = matrix.m42;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        function onMouseMove(e) {
            if (!isDragging) return;
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

window.toggleKbAccordion = function (id) {
    if (isKbEditMode) return; // Disable expanding while in edit mode (usually click edits instead)
    const el = document.getElementById('kb-accordion-' + id);
    const content = document.getElementById('kb-content-' + id);
    const icon = document.getElementById('kb-icon-' + id);
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
        el.style.background = 'var(--bg-app)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        el.style.background = 'transparent';
    }
};

window.toggleKbFaq = function (id) {
    if (isKbEditMode) return;
    const el = document.getElementById('kb-faq-' + id);
    const content = document.getElementById('kb-faq-content-' + id);
    const icon = document.getElementById('kb-faq-icon-' + id);
    if (content.style.display === 'none') {
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

window.openKbModal = function (type, id) {
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

window.addKbListPoint = function () {
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

window.deleteKbItem = function (type, id) {
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
