#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Strategy Control Room..."
echo "Press Ctrl+C to stop."
open "http://localhost:8000"
python3 -m http.server 8000
