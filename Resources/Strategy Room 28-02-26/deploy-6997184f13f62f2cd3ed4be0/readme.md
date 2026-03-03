# AET Strategy Web App

A dynamic, single-page application serving as the shared source of truth for the AET Communications & Engagement Strategy.

## Overview

This application acts as a living "Strategy Spine", replacing the static Word document. It is designed to be:
- **Clean and Professional**: Optimized for Teams calls and screen sharing.
- **Dynamic**: Updates to activity logs and decision registers are persisted locally.
- **AI-Ready**: Structured data separation allowed for future AI integration.

## How to Run

Because this application uses modern JavaScript Modules, it requires a local web server to run (browsers block specific features when opening simple HTML files directly).

1. Open your terminal in this folder:
   ```bash
   cd "/Users/AET/Strategy Web App"
   ```

2. Start a simple local server:
   ```bash
   python3 -m http.server 8000
   ```
   (Or use `serve`, `http-server` if you have Node.js installed)

3. Open your browser to:
   [http://localhost:8000](http://localhost:8000)

## Features

- **Strategy Spine**: The core objectives, narrative, and pillars.
- **Stakeholder Ledger**: Digital view of stakeholder positions and strategies.
- **Activity Log**: Interactive log for meetings and outcomes (Saves to Browser Local Storage).
- **Decision Register**: Track strategic decisions (Saves to Browser Local Storage).
- **Action Alignment**: View linking stakeholders to specific actions.

## Files

- `index.html`: Main application entry.
- `app.js`: Application logic and rendering.
- `data.js`: The initial dataset extracted from the original Strategy Document.
- `styles.css`: Custom professional styling.
