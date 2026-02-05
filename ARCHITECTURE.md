# AET Web Platform – Architecture Overview

This document explains how the AET Web Platform is structured, how pages interact, and the architectural intent behind key decisions.

It is written for:
- Future developers
- Technical reviewers
- Project handover scenarios

---

## Architectural Philosophy

The platform follows a **single-shell, multi-view** mindset:

- One shared layout shell
- Content swapped dynamically per page/view
- No duplicated layout logic
- Minimal page reload side effects (e.g. flicker, width resets)

This avoids:
- Layout drift
- Sidebar inconsistencies
- Per-page styling regressions

---

## Layout Model

### Shared Application Shell
The shell contains:
- Top navigation (public)
- Sidebar navigation (internal portal)
- Global toggles (Dark Mode, Page Width)
- App container and background layers

Only **content regions** change between views.

---

### Page Width Modes

Two modes are supported:
- **Wide View (boxed)**  
  - Centered layout
  - Floating app window
  - Rounded corners and shadow
- **Full Width**
  - Content expands edge-to-edge
  - Visual priority given to maps and charts

The toggle affects the **entire application shell**, not individual components.

---

## Public Pages

### Overview
- Entry point
- Summary of project purpose
- Navigation to deeper views

---

### Impact
- Environmental outcomes
- Carbon abatement
- ESG metrics
- Graphs with interactive and animated behaviour

---

### Clients
- Logistics comparisons
- Distance calculations
- Map-based visualisation:
  - ARRC (Bendigo)
  - Nearby waste facilities (e.g. Maldon, Sunbury)
  - Selected council / client location
- Financial advantage summaries

Map behaviour:
- Auto-zoom to include all relevant points
- Visual routing lines to compare distances

---

### Investors
- Financial engine concepts
- Scenario presets (e.g. cautious, aggressive)
- Interactive sliders for variables
- Live-updating projections and charts

Layout priority:
- Inputs on the left (compact)
- Outputs and graphs on the right (dominant)

---

## Internal Portal

The internal portal uses:
- The same core layout system
- Shared CSS and JS
- Auth-gated access (currently simulated)

Modules may include:
- Stakeholders
- Actions
- Activity logs
- Strategy views

---

## Data Layer

### Current State
- JSON-based mock data
- Loaded synchronously for predictability
- Designed to eliminate loading flicker

### Future State
- API-backed data
- Server-side authentication
- Role-based access control

No UI assumptions should be hard-coded to mock data.

---

## Mapping & Visualisation

- OpenStreetMap-compatible tiles
- Dynamic overlays (routes, markers)
- Designed for future real coordinate datasets

---

## Animation Guidelines

Animations are:
- Subtle
- Fast
- Ease-based
- One-time on load or state change

Purpose:
- Reinforce relationships between data
- Differentiate from static presentations
- Avoid distraction or novelty effects

---

## Non-Goals (For Now)

- Production authentication
- Real financial or operational data
- Backend services
- Performance optimisation for scale

These are intentionally deferred.

---

## Key Rule Going Forward

**UI visibility is the gate for acceptance.**

If a change does not result in a visible, verifiable UI improvement:
- Do not introduce supporting logic yet.

This rule exists to prevent architectural drift during prototyping.

