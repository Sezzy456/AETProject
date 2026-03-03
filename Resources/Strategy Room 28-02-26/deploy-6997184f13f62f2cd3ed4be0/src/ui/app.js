

import { strategyRepo, logService, exportService } from '../container.js';
import { StrategySpineView } from './views/spineview.js';
import { StakeholderLedgerView } from './views/ledgerview.js';
import { LiveLogView } from './views/livelogview.js';
import { DecisionRegisterView } from './views/decisionview.js';
import { ActionAlignmentView } from './views/actionview.js';

// --- MAIN CONTROLLER ---
const mainContent = document.getElementById('main-content');
let currentTab = 'spine';
let isDarkMode = document.body.classList.contains('dark-mode');
let isWideView = document.getElementById('app-container')?.classList.contains('wide-view') || false;
let appState = null;

// Global Error Handler for Deployment Debugging
window.onerror = function (msg, url, line, col, error) {
    const main = document.getElementById('main-content');
    if (main) {
        main.innerHTML += `<div style="color:red; background:#fee; padding:10px; margin:10px; border:1px solid red;">
            <strong>Runtime Error:</strong> ${msg}<br>
            <small>${url}:${line}:${col}</small>
        </div>`;
    }
};

// Initialize
// Initialize
async function initApp() {
    // 0. Update state from DOM (Ensures sync with index.html fail-safe)
    isDarkMode = document.body.classList.contains('dark-mode');
    isWideView = document.getElementById('app-container')?.classList.contains('wide-view') || false;

    // Listen for Sync Events from index.html toggles
    window.addEventListener('aet-theme-sync', () => {
        isDarkMode = document.body.classList.contains('dark-mode');
        if (appState) render();
    });

    window.addEventListener('aet-layout-sync', () => {
        isWideView = document.getElementById('app-container')?.classList.contains('wide-view') || false;
        if (appState) render();
    });

    // 1. Show Loading State
    showLoading();

    try {
        // 1. Load Data from Repository
        appState = await strategyRepo.loadAll();

        if (!appState) {
            throw new Error("Failed to load application state.");
        }

        // AUTO-MIGRATION: Trigger Reset on first run of V2.1
        // This ensures the new Governance/Q&A data is seeded into Supabase
        const versionKey = 'AET_STRATEGY_V2_1_MIGRATED';
        if (!localStorage.getItem(versionKey)) {
            console.log("AUTO-MIGRATION: Upgrading Database to v2.1...");
            localStorage.setItem(versionKey, 'true');
            // We need to wait a moment for the repo's adapter to be ready, then trigger reset
            // Note: strategyRepo.adapter is where we access it
            if (strategyRepo.adapter.resetDatabase) {
                await strategyRepo.adapter.resetDatabase();
                return; // Stop here, reset will reload page
            }
        }

        // 2. Bind Global Nav
        bindNav();
        bindMobileMenu();

        // 3. Initial Render
        render();
    } catch (e) {
        showError(e.message);
    }
}

// Bootstrapper (Solves Race Condition)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // Already ready
    initApp();
}

function showLoading() {
    mainContent.innerHTML = `
        <div class="flex items-center justify-center h-full flex-col gap-4 text-slate-400">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin"></i>
            <span>Connecting to Strategy Room...</span>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function showError(msg) {
    mainContent.innerHTML = `
        <div class="flex items-center justify-center h-full flex-col gap-4 text-red-500">
            <i data-lucide="alert-triangle" class="w-10 h-10"></i>
            <h2 class="text-lg font-bold">System Error</h2>
            <p>${msg}</p>
            <button onclick="window.location.reload()" class="px-4 py-2 bg-slate-200 rounded text-slate-900 mt-4">Retry Connection</button>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            render();
        });
    });
}



function bindMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        });
    }
}

// Toggles are handled in index.html for immediate response.
// app.js listens for aet-sync events to trigger renders.

async function render() {
    // Refresh state on every render (in case of background updates)
    // Optimization: In a real app we might not fetch EVERY render, but for "Multiplayer sync" it's safer.
    // However, if we just edited locally, we want to see that.
    // For now, let's persist the 'Live' fetching.
    try {
        const fresherState = await strategyRepo.loadAll();
        if (fresherState) appState = fresherState;
    } catch (e) {
        console.warn("Background sync failed", e);
    }

    mainContent.innerHTML = '';

    // Header
    const header = document.createElement('header');
    header.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; color:var(--text-tertiary); font-size:0.85rem;">
            <i data-lucide="shield-check" style="width:14px;"></i>
            <span>${isDarkMode ? 'Secure Bio-Link Active' : 'Standard Connection'}</span>
        </div>
        <div style="display:flex; align-items:center; gap:1rem;">
            <div style="display:flex; gap:0.5rem;">
                <button id="btn-export-json" class="btn-text" style="display:flex; align-items:center; gap:0.5rem; color:var(--text-muted); font-size:0.85rem; padding: 0.25rem 0.5rem; border-radius:4px; border:1px solid transparent; hover:bg-slate-100;">
                    <i data-lucide="save" style="width:14px;"></i> Backup
                </button>
                <button id="btn-export-csv" class="btn-text" style="display:flex; align-items:center; gap:0.5rem; color:var(--text-muted); font-size:0.85rem; padding: 0.25rem 0.5rem; border-radius:4px; border:1px solid transparent; hover:bg-slate-100;">
                    <i data-lucide="file-spreadsheet" style="width:14px;"></i> CSV
                </button>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); border-left:1px solid var(--border); padding-left:1rem;">
                Last Sync: ${new Date().toLocaleTimeString()}
            </div>
        </div>
    `;
    mainContent.appendChild(header);

    // View Container
    const content = document.createElement('div');
    content.className = 'view-container';
    mainContent.appendChild(content);

    // Route to View
    let view = null;
    switch (currentTab) {
        case 'spine':
            view = new StrategySpineView(
                appState,
                async (newSpine) => {
                    // ON SAVE
                    showLoading(); // Optimistic UI
                    await strategyRepo.saveSpine(newSpine);
                    render(); // Re-fetch and re-render
                }
            );
            content.innerHTML = view.render();
            if (view.bindEvents) view.bindEvents(content);
            break;

        case 'ledger':
            view = new StakeholderLedgerView(
                appState.stakeholders,
                appState.activityLog, // Pass Logs for History
                appState.initialActions, // Pass Actions for History
                async (newStakeholder) => {
                    // ON ADD
                    showLoading();
                    await strategyRepo.saveItem('stakeholders', newStakeholder);
                    render();
                },
                async (updatedStakeholder) => {
                    // ON UPDATE
                    await strategyRepo.updateStakeholder(updatedStakeholder);
                },
                async (deletedId) => {
                    // ON DELETE
                    await strategyRepo.deleteStakeholder(deletedId);
                }
            );
            content.innerHTML = view.render();
            if (view.bindEvents) view.bindEvents(content);
            break;

        case 'log':
            view = new LiveLogView(
                appState.activityLog,
                appState.stakeholders,
                // ON ADD
                async (newEntryData) => {
                    await strategyRepo.saveLog(newEntryData);
                    render();
                },
                // ON UPDATE
                async (updatedEntry) => {
                    await strategyRepo.updateLog(updatedEntry);
                    // No need to render() here if View handles optimistic UI, 
                    // BUT app.js render function re-fetches state. 
                    // So calling render() ensures we see persisted state.
                    render();
                },
                // ON DELETE
                async (deletedId) => {
                    await strategyRepo.deleteLog(deletedId);
                    render();
                }
            );
            content.innerHTML = view.render();
            view.bindEvents(content);
            break;

        case 'decisions':
            view = new DecisionRegisterView(
                appState.decisionRegister,
                async (newDecision) => {
                    // ON ADD
                    showLoading();
                    await strategyRepo.saveDecision(newDecision);
                    render();
                },
                async (updatedDecision) => {
                    // ON UPDATE
                    showLoading();
                    await strategyRepo.updateDecision(updatedDecision);
                    render();
                },
                async (deletedId) => {
                    // ON DELETE
                    await strategyRepo.deleteDecision(deletedId);
                    render();
                }
            );
            content.innerHTML = view.render();
            if (view.bindEvents) view.bindEvents(content);
            break;

        case 'alignment':
            view = new ActionAlignmentView(
                appState.initialActions,
                appState.stakeholders,
                appState.spine.objectives,
                async (newAction) => {
                    // ON ADD
                    showLoading();
                    // We simply pass the action as-is. Repository/Adapter handles consistency.
                    // Removed manual snake_case mapping which was causing bugs with LocalStorage.
                    await strategyRepo.saveAction(newAction);
                    render();
                },
                async (updatedAction) => {
                    // ON UPDATE
                    showLoading();
                    await strategyRepo.updateAction(updatedAction);
                    render();
                },
                async (deletedId) => {
                    // ON DELETE
                    await strategyRepo.deleteAction(deletedId);
                    render();
                }
            );
            content.innerHTML = view.render();
            if (view.bindEvents) view.bindEvents(content);
            break;
    }

    if (window.lucide) window.lucide.createIcons();

    // Re-bind exports (since header is replaced)
    const btnJson = document.getElementById('btn-export-json');
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnJson) btnJson.onclick = () => exportService.exportProjectJSON(appState);
    if (btnCsv) btnCsv.onclick = () => exportService.exportStakeholdersCSV(appState.stakeholders);
}
