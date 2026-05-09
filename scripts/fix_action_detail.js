// Removes orphaned old layout from action_detail.html
// Lines 155-291 (1-indexed) = 154-290 (0-indexed) are the old Target/Description/Todo/Progress sections
// that were replaced by the new layout inserted at lines 23-152
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'pages', 'action_detail.html');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
console.log('Before:', lines.length, 'lines');
// Keep lines 1-154 (0-indexed 0-153) and lines 292+ (0-indexed 291+)
const out = [...lines.slice(0, 154), ...lines.slice(291)];
fs.writeFileSync(file, out.join('\r\n'), 'utf8');
console.log('After:', out.length, 'lines');
console.log('Removed', lines.length - out.length, 'orphaned lines (old Target/Description/Todo/Progress sections)');
