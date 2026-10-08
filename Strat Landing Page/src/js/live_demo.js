/* Interactive Hero Showcase & Kanban Workspace Builder */

const SAMPLE_TASKS = {
  engineering: {
    todo: [
      { tag: 'ai', tagClass: 'tag-ai', title: 'Implement AI Auto-Sprint Summarizer', assignee: 'Alex R.', date: 'Oct 12' },
      { tag: 'feature', tagClass: 'tag-feature', title: 'OAuth2 SSO Provider Integration', assignee: 'Devon M.', date: 'Oct 14' }
    ],
    inProgress: [
      { tag: 'bug', tagClass: 'tag-bug', title: 'Fix WebSocket Reconnection Delay', assignee: 'Sarah T.', date: 'Oct 09' },
      { tag: 'feature', tagClass: 'tag-feature', title: 'GraphQL API Subscriptions v3', assignee: 'Kenji S.', date: 'Oct 10' }
    ],
    done: [
      { tag: 'design', tagClass: 'tag-design', title: 'Dark Mode Glassmorphism Theme Refactor', assignee: 'Elena P.', date: 'Oct 05' },
      { tag: 'ai', tagClass: 'tag-ai', title: 'Train Blocker Detection Model v1.2', assignee: 'Alex R.', date: 'Oct 07' }
    ]
  },
  marketing: {
    todo: [
      { tag: 'feature', tagClass: 'tag-feature', title: 'Q4 Product Launch Press Release', assignee: 'Jessica M.', date: 'Oct 15' },
      { tag: 'design', tagClass: 'tag-design', title: 'Social Media Banner Kit', assignee: 'Marcus W.', date: 'Oct 18' }
    ],
    inProgress: [
      { tag: 'ai', tagClass: 'tag-ai', title: 'AI Copywriting Assistant for Email Campaigns', assignee: 'Jessica M.', date: 'Oct 10' }
    ],
    done: [
      { tag: 'feature', tagClass: 'tag-feature', title: 'Product Hunt Launch Page', assignee: 'Marcus W.', date: 'Oct 01' }
    ]
  },
  product: {
    todo: [
      { tag: 'design', tagClass: 'tag-design', title: 'User Journey Mapping Workshop', assignee: 'Chloe B.', date: 'Oct 16' }
    ],
    inProgress: [
      { tag: 'ai', tagClass: 'tag-ai', title: 'Feature Prioritization Matrix using AI Score', assignee: 'David L.', date: 'Oct 11' },
      { tag: 'feature', tagClass: 'tag-feature', title: 'Customer Feedback Sentiment Analysis', assignee: 'Chloe B.', date: 'Oct 12' }
    ],
    done: [
      { tag: 'feature', tagClass: 'tag-feature', title: '2026 Product Roadmap Alignment', assignee: 'David L.', date: 'Oct 04' }
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
