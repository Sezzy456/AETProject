// Remove old duplicate setupMsgEditToggle code from app.js
// Lines 2871-2958 contain old code that was superseded
const fs = require('fs');
const path = 'c:/Users/sevan.SARAHS_DESKTOP/Documents/Matt_Griffin_Project/AETProject/js/app.js';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Find and remove old duplicate block (lines 2870-2958, 0-indexed 2870-2957)
// After the new setupMsgEditToggle closing brace (line 2869), there's orphaned old code
let removeStart = -1;
let removeEnd = -1;
for (let i = 2869; i < lines.length; i++) {
    if (lines[i].trim() === 'if (isMsgEditMode) {' && removeStart === -1) {
        removeStart = i;
    }
    if (removeStart > 0 && lines[i].trim() === '// ---- MESSAGING CARD OPERATIONS ----') {
        removeEnd = i;
        break;
    }
}

if (removeStart > 0 && removeEnd > removeStart) {
    // Also remove the closing brace of the old function on the line before removeEnd
    // Find the '}' that closes the old setupMsgEditToggle
    let closeBrace = removeEnd - 1;
    while (closeBrace > removeStart && lines[closeBrace].trim() === '') closeBrace--;

    const newLines = [...lines.slice(0, removeStart), ...lines.slice(removeEnd)];
    fs.writeFileSync(path, newLines.join('\r\n'), 'utf8');
    console.log(`Removed lines ${removeStart + 1} to ${removeEnd} (${removeEnd - removeStart} lines)`);
} else {
    console.log('Could not find boundaries. removeStart:', removeStart, 'removeEnd:', removeEnd);
}
