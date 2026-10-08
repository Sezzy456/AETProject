/* Scroll Animations, Mobile Drawer, and Micro Interactions */
import { showToast } from './auth_modal.js';

export function initAnimations() {
  // Sticky Navbar Blur state
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Bottom CTA Newsletter Email Submit
  const ctaForm = document.getElementById('ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = ctaForm.querySelector('.cta-input');
      const email = emailInput?.value || 'your team';
      emailInput.value = '';
      showToast(`⚡ VIP early access link sent to ${email}!`);
    });
  }
}
