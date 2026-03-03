# AET Web Platform

https://sezzy456.github.io/AETProject/ <- Live demo

This repository contains the web platform for **AET (Advanced Environmental Technologies)**.

The project consists of:
- A **public-facing website** used to communicate environmental, social, and economic outcomes
- A **private internal portal** for AET staff (authentication-enabled)
- A shared design system featuring **dark mode** and **glassmorphism-inspired UI**

This codebase is currently in an **active prototyping and iteration phase**, with architecture decisions intentionally made to support future scalability.

---

## Project Purpose

The AET Web Platform is designed to function as:
- A **living information model** (not a static brochure)
- A **decision-support interface** for councils, clients, and investors
- A foundation for future **data-backed operational tools**

Rather than PowerPoint-style presentations, this platform presents:
- Environmental impact data
- Financial projections
- Logistics comparisons
- Strategic narratives  
in an **interactive, web-native format**.

---

## High-Level Structure

The project is divided into two main areas:

### 1. Public Site
Accessible without login.

Audience-specific views include:
- **Overview** – high-level summary and navigation hub
- **Impact** – environmental and ESG outcomes
- **Clients** – logistics, distance comparisons, and cost advantages
- **Investors** – financial models, scenarios, and projections

Navigation is **horizontal (top-based)** and includes:
- Dark Mode toggle
- Page Width toggle
- Login access to the internal portal

---

### 2. Internal Portal (Authenticated)
Accessible via login.

Used by AET staff to:
- View operational data
- Review stakeholders, actions, and logs
- Interact with internal dashboards

The portal shares layout, styling, and core components with the public site to ensure consistency.

---

## Design System

- **Dark Mode** supported globally
- **Glassmorphism-inspired UI**
  - Translucent panels
  - Soft shadows
  - Layered depth
- Emphasis on:
  - Readability
  - Clear hierarchy
  - Large, outcome-focused metrics

> ⚠️ Note: Contrast and accessibility are actively being reviewed and may evolve as data density increases.

---

## Data Status

- Current builds use **mock JSON data**
- All data structures are designed to be:
  - Replaceable with API calls
  - Compatible with future databases
- No production data is stored in this repository

---

## Technology Notes

- Front-end focused
- No Node.js or backend services required at this stage
- Authentication logic is stubbed / simulated for prototyping
- Mapping uses OpenStreetMap-compatible tooling

---

## Ownership & IP

This project is the intellectual property of **AET** upon completion and payment.

Until then, it remains under the control of the author for development and prototyping purposes.

---

## Handover Notes

If you are taking over this project:
- Start with `ARCHITECTURE.md`
- Review shared layout logic first
- Treat UI visibility as the gate for acceptance:
  - No supporting logic should exist without visible UI impact

