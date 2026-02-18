/**
 * Main entrance.
 */
import { setupEventListeners } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Investor Dashboard: Financial Model Initialized');
    setupEventListeners();
});
