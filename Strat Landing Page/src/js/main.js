/* Main Entry Point */
import { initAuthModal } from './auth_modal.js';
import { initLiveDemo } from './live_demo.js';
import { initRoiCalculator } from './roi_calculator.js';
import { initPricing } from './pricing.js';
import { initFaq } from './faq.js';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initLiveDemo();
  initRoiCalculator();
  initPricing();
  initFaq();
  initAnimations();
});
