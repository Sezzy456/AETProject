/* Interactive Hero Showcase & StratRoom Objective Sandbox */

const SAMPLE_TASKS = {
  engineering: {
    todo: [
      { tag: 'strategy', tagClass: 'tag-ai', title: 'Publish Q4 Company Strategy Memo', assignee: 'Sarah T. (CEO)', date: 'Oct 12' },
      { tag: 'okr goal', tagClass: 'tag-feature', title: 'Align Product Pillars with Revenue Targets', assignee: 'Marcus W. (VP Product)', date: 'Oct 14' }
    ],
    inProgress: [
      { tag: 'alignment', tagClass: 'tag-bug', title: 'Cross-Department Alignment Check-in', assignee: 'Devon M.', date: 'Oct 09' },
      { tag: 'memo', tagClass: 'tag-feature', title: 'Broadcast Q4 Engineering Objectives Memo', assignee: 'Kenji S.', date: 'Oct 10' }
    ],
    done: [
      { tag: 'achieved', tagClass: 'tag-design', title: 'Annual Strategic Planning Alignment Session', assignee: 'Elena P.', date: 'Oct 05' },
      { tag: 'okr goal', tagClass: 'tag-ai', title: 'Finalize Executive KPI Dashboard', assignee: 'Alex R.', date: 'Oct 07' }
    ]
  },
  marketing: {
    todo: [
      { tag: 'strategy', tagClass: 'tag-feature', title: 'Q4 Product Launch Positioning Brief', assignee: 'Jessica M.', date: 'Oct 15' },
      { tag: 'memo', tagClass: 'tag-design', title: 'Brand Message Cohesion Deck', assignee: 'Marcus W.', date: 'Oct 18' }
    ],
    inProgress: [
      { tag: 'alignment', tagClass: 'tag-ai', title: 'Cross-Functional Launch Alignment Pulse', assignee: 'Jessica M.', date: 'Oct 10' }
    ],
    done: [
      { tag: 'achieved', tagClass: 'tag-feature', title: 'Product Hunt Launch Alignment', assignee: 'Marcus W.', date: 'Oct 01' }
    ]
  },
  product: {
    todo: [
      { tag: 'okr goal', tagClass: 'tag-design', title: 'User Experience Quality Objective Alignment', assignee: 'Chloe B.', date: 'Oct 16' }
    ],
    inProgress: [
      { tag: 'strategy', tagClass: 'tag-ai', title: 'Strategic Roadmap Prioritization Matrix', assignee: 'David L.', date: 'Oct 11' },
      { tag: 'memo', tagClass: 'tag-feature', title: 'Publish Product Strategy V3 Memo', assignee: 'Chloe B.', date: 'Oct 12' }
    ],
    done: [
      { tag: 'achieved', tagClass: 'tag-feature', title: 'Synchronize Design Systems with Web App', assignee: 'David L.', date: 'Oct 04' }
    ]
  }
};

export function initLiveDemo() {
  // Hero Tab Switcher for Showcase Preview Image
  const showcaseTabs = document.querySelectorAll('.browser-tabs .tab-btn');
  const showcaseImg = document.getElementById('showcaseMainImg');

  const TAB_IMAGES = {
    kanban: '/assets/images/hero_dashboard.png',
    gantt: '/assets/images/analytics.png',
    ai: '/assets/images/ai_workflow.png',
    collaboration: '/assets/images/team_collaboration.png'
  };

  showcaseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      showcaseTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const view = tab.dataset.view;
      if (showcaseImg && TAB_IMAGES[view]) {
        showcaseImg.style.opacity = '0.3';
        setTimeout(() => {
          showcaseImg.src = TAB_IMAGES[view];
          showcaseImg.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Interactive Workspace Builder Chips
  const teamChips = document.querySelectorAll('.team-chip');
  teamChips.forEach(chip => {
    chip.addEventListener('click', () => {
      teamChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderKanbanBoard(chip.dataset.team);
    });
  });

  // Initial render of Kanban board
  renderKanbanBoard('engineering');
}

function renderKanbanBoard(teamKey) {
  const data = SAMPLE_TASKS[teamKey] || SAMPLE_TASKS.engineering;

  ['todo', 'inProgress', 'done'].forEach(colKey => {
    const colContainer = document.getElementById(`kanbanCol-${colKey}`);
    if (!colContainer) return;

    const tasks = data[colKey] || [];
    colContainer.innerHTML = tasks.map(task => `
      <div class="task-card">
        <span class="task-tag ${task.tagClass}">${task.tag}</span>
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          <span>👤 ${task.assignee}</span>
          <span>📅 ${task.date}</span>
        </div>
      </div>
    `).join('');
  });
}
