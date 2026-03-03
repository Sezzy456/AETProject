

import { StrategyRepository } from './infrastructure/storage/repository.js';
import { SupabaseAdapter } from './infrastructure/storage/supabaseadapter.js';
import { LogService } from './services/LogService.js';
import { ToastManager } from './ui/components/ToastManager.js';

// CONFIGURATION (AUTO-GENERATED)
const SUPABASE_URL = "https://bhfuframpeysqncouxax.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnVmcmFtcGV5c3FuY291eGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjIyMTQsImV4cCI6MjA4NDUzODIxNH0.VGOGLN6Fjr1Yv6Psy0TiW8yHhTaz6AQvtHbvKN6xbwA";

// Initialize Services
export const toastService = new ToastManager();

// Initialize Data Layer
// TOGGLE HERE: 'local' vs 'supabase'
const DATA_MODE = 'supabase';

let adapter;
// We use dynamic import for LocalStorage to avoid unused import warnings if we switch, 
// but for simplicity we'll keep static imports or just conditioned logic.
// Simpler approach for this file:

if (DATA_MODE === 'supabase') {
    adapter = new SupabaseAdapter(SUPABASE_URL, SUPABASE_KEY, toastService);
} else {
    // Fallback to Local
    const { LocalStorageAdapter } = await import('./infrastructure/storage/localstorageadapter.js');
    adapter = new LocalStorageAdapter('aet_strategy_v1', toastService);
}

const repo = new StrategyRepository(adapter);

// Debug / Admin
window.resetApp = () => adapter.resetDatabase();

// Initialize Services
export const logService = new LogService(repo);
import { ExportService } from './domain/services/ExportService.js';
export const exportService = new ExportService();
export const strategyRepo = repo;
