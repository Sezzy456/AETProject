import { LogEntry } from './src/domain/models/Log.js';

console.log("Testing LogEntry Model...");

// Test 1: Instantiation with 'implications' (DB style)
const dbData = { id: '1', implications: ['risk', 'urgent'], summary: 'Test DB' };
const log1 = new LogEntry(dbData);
if (log1.tags.includes('risk') && log1.tags.includes('urgent')) {
    console.log("PASS: LogEntry mapped 'implications' to 'tags'");
} else {
    console.error("FAIL: LogEntry failed to map 'implications' to 'tags'");
}

// Test 2: Instantiation with 'tags' (UI style)
const uiData = { id: '2', tags: ['opportunity'], summary: 'Test UI' };
const log2 = new LogEntry(uiData);
if (log2.implications.includes('opportunity')) {
    console.log("PASS: LogEntry mapped 'tags' to 'implications'");
} else {
    console.error("FAIL: LogEntry failed to map 'tags' to 'implications'");
}

// Test 3: Instantiation with 'impact' (Decision DB style)
const decisionData = { id: '3', type: 'Decision', impact: ['approved'], summary: 'Test Decision' };
const log3 = new LogEntry(decisionData);
if (log3.tags.includes('approved')) {
    console.log("PASS: LogEntry mapped 'impact' to 'tags'");
} else {
    console.error("FAIL: LogEntry failed to map 'impact' to 'tags'");
}
