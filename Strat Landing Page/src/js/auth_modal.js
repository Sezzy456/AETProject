/* Auth Modal & Toast System */

export function initAuthModal() {
  const modalOverlay = document.getElementById('authModalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');
  const loginBtns = document.querySelectorAll('[data-auth-trigger="login"]');
  const signupBtns = document.querySelectorAll('[data-auth-trigger="signup"]');
  const authTabBtns = document.querySelectorAll('.auth-tab-btn');
  const authForm = document.getElementById('authForm');
  const passwordInput = document.getElementById('authPassword');
  const passwordToggleBtn = document.getElementById('passwordToggle');
  const submitBtn = document.getElementById('authSubmitBtn');

  let currentMode = 'login'; // 'login' or 'signup'

  function openModal(mode = 'login') {
    currentMode = mode;
    updateModalUI();
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function updateModalUI() {
    authTabBtns.forEach(btn => {
      if (btn.dataset.tab === currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const nameGroup = document.getElementById('nameGroup');
    if (nameGroup) {
      nameGroup.style.display = currentMode === 'signup' ? 'flex' : 'none';
    }

    if (submitBtn) {
      submitBtn.textContent = currentMode === 'signup' ? 'Create Free Account' : 'Sign In to StratOS';
    }
  }

  // Event Listeners
  loginBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('login');
  }));

  signupBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('signup');
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  authTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.tab;
      updateModalUI();
    });
  });

  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      passwordToggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      closeModal();
      showToast(currentMode === 'signup' 
        ? `🎉 Account created! Welcome aboard, ${email}` 
        : `🚀 Welcome back! Directing to workspace...`);
    });
  }
}

export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
