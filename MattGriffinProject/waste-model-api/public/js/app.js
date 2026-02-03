document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLayout(); // Ensure global layout handler is called

    // Check which page we are on
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // Highlight active nav link
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === page) {
            link.classList.add('active');
        }
    });

    // Populate Data based on page
    if (page === 'index.html' || page === '') {
        renderDashboard();
    } else if (page === 'stakeholders.html') {
        renderStakeholders();
    } else if (page === 'stakeholder_detail.html') {
        renderStakeholderDetail();
    } else if (page === 'activity_log.html') {
        renderActivityLog();
    } else if (page === 'actions.html') {
        renderActions();
    }

    // Handle Login Mock
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Mock login success
            window.location.href = 'index.html';
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
    const kbGrid = document.getElementById('knowledge-bank');
    if (kbGrid && spine.qa_library) {
        kbGrid.innerHTML = spine.qa_library.map(qa => `
            <div class="card" style="padding: 1rem;">
                <span class="status-badge" style="margin-bottom: 0.5rem;">${qa.category}</span>
                <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-primary);">Q. ${qa.question}</p>
                <p style="font-size: 0.9rem;">${qa.answer}</p>
            </div>
        `).join('');
    }

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


