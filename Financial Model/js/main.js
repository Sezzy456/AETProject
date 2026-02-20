/**
 * Main entrance.
 */
import { setupEventListeners } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Investor Dashboard: Financial Model Initialized');
    try {
        setupEventListeners();
        console.log('Event listeners initialized.');
    } catch (err) {
        console.error('Setup failed:', err);
    }
});
