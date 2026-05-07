// This script removes the old dead Knowledge Bank code from app.js
// Run with: node scripts/cleanup_old_kb.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// Find the new scroll forwarding (line containing "// ---- SCROLL FORWARDING ----" after the new code)
// We want to keep everything up to and including ", { passive: true });" after that comment

// Find all scroll forwarding occurrences
const scrollIndices = [];
lines.forEach((line, i) => {
    if (line.includes('// ---- SCROLL FORWARDING ----')) scrollIndices.push(i);
});

console.log('Found SCROLL FORWARDING at lines:', scrollIndices.map(i => i + 1));

if (scrollIndices.length >= 1) {
    // Find the }, { passive: true }); line after the FIRST scroll forwarding
    let endIdx = scrollIndices[0];
    for (let i = scrollIndices[0]; i < lines.length; i++) {
        if (lines[i].includes('{ passive: true }')) {
            endIdx = i;
            break;
        }
    }
    
    // Keep lines 0 through endIdx (inclusive), plus a trailing newline
    const kept = lines.slice(0, endIdx + 1);
    kept.push(''); // trailing newline
    
    fs.writeFileSync(filePath, kept.join('\r\n'));
    console.log(`Kept ${kept.length} lines (was ${lines.length})`);
    console.log('Done! Old KB code removed.');
} else {
    console.log('Could not find SCROLL FORWARDING comment. Aborting.');
}
