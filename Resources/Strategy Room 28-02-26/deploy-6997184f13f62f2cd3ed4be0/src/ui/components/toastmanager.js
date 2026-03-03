/**
 * Toast Notification Manager
 * Provides professional, non-blocking feedback.
 */
export class ToastManager {
    constructor() {
        this.container = null;
    }

    _initContainer() {
        if (this.container) return;
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            if (document.body) {
                document.body.appendChild(this.container);
            } else {
                console.error("ToastManager: document.body not ready");
            }
        }
    }

    show(message, type = 'info') {
        this._initContainer();
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Icon based on type
        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Initialize Icons
        if (window.lucide) window.lucide.createIcons();

        // Auto Dismiss
        setTimeout(() => {
            this.dismiss(toast);
        }, 1500);
    }

    dismiss(toast) {
        toast.classList.remove('show');

        // Timeout fallback in case transition event doesn't fire (hidden tab)
        const removeTimeout = setTimeout(() => {
            if (toast && toast.parentNode) toast.remove();
        }, 500);

        toast.addEventListener('transitionend', () => {
            clearTimeout(removeTimeout);
            if (toast && toast.parentNode) toast.remove();
        });
    }
}
