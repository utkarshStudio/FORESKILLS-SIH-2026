# AGENTS.md

## Project Context

This repository contains **FORESKILLS — Workforce Intelligence & Policy Simulation Platform**, a standard Vite + React + JavaScript application for district-level workforce planning, policy simulation, budget optimization, curriculum alignment, and scenario comparison.

This is the **FINAL DEMO MODE** build: fully self-contained, running on a realistic local demo dataset. No API keys, no external APIs at runtime, no database.

Start with `README.md` for local setup, available scripts, and architecture details.

## Key Directories & Files

- `src/data/data.js` — **Main demo dataset** (districts, industries, occupations, skills, institutes, investments, economic events, data-source registry, entity schemas). Single source of truth for all demo data.
- `src/engines/engines.js` — Deterministic simulation, optimization, risk, skill-gap, scenario, and curriculum engines.
- `src/providers/providers.js` — Provider/service layer bridging engines/data to UI workflows.
- `src/hooks/hooks.js` — Theme (dark/light), local session context, responsive hooks.
- `src/components/` — Application UI components (`Charts.jsx`, `Maps.jsx`, `Layout.jsx`, `Common.jsx`, `UI.jsx`).
- `src/pages/` — Feature pages (Decision Center, District Intelligence, Skill Demand, Economic Shocks, Investments, Curriculum Intelligence, Workforce Digital Twin, Policy Simulator, Budget Optimizer, Scenario Comparison, Talent Mobility, Reports).
- `public/maharashtra-districts.geojson` — MapLibre district boundaries used by the map.
- `vite.config.js` — Vite configuration (`@` → `./src` alias).

## Working Notes

- Use `npm run dev` to start the local Vite development server.
- Use `npm run build` for production builds.
- Run `npm run lint` and `npm run typecheck` to verify code quality.
- Do not reintroduce Supabase/external API dependencies; the demo must stay offline-capable.
