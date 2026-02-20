const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
};

http.createServer((req, res) => {
    // Decode the URL to handle spaces and special characters
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(req.url);
    } catch (e) {
        decodedPath = req.url;
    }

    // Determine the base path and adjust for the root index.html
    let urlPath = decodedPath === '/' ? '/index.html' : decodedPath;

    // Resolve the full file path
    let filePath = path.join(__dirname, urlPath);

    // Safety check to prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Access denied');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log('--- AET Unified Server ---');
    console.log(`Main Portal: http://localhost:${PORT}/`);
    console.log(`Financial Model: http://localhost:${PORT}/Financial%20Model/finance_model.html`);
    console.log('---------------------------');
    console.log('Press Ctrl+C to stop.');
});
