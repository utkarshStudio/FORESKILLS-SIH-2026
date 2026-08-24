# FORESKILLS — Workforce Intelligence & Policy Simulation

A Vite + React application for government workforce planning: district-level
skill demand/supply analysis, policy simulation, budget optimization, curriculum
alignment, and scenario comparison. All computation runs locally through
deterministic engines in `src/engines/engines.js`.

**This is the FINAL DEMO build.** The app is fully self-contained: it runs on a
realistic local demo dataset and needs no API keys, no external services and no
database.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

## Available scripts

| Script               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Vite dev server                          |
| `npm run build`      | Production build to `dist/`              |
| `npm run preview`    | Preview the production build             |
| `npm run lint`       | ESLint check                             |
| `npm run lint:fix`   | ESLint autofix                           |
| `npm run typecheck`  | TypeScript check over JS (checkJs)       |

## Architecture

- `src/data/data.js` — **Main demo dataset** (districts, industries,
  occupations, skills, institutes, investments, events, data-source registry).
  Every page, engine and chart reads from this file.
- `src/engines/engines.js` — Deterministic simulation, optimization, risk,
  skill-gap, scenario and curriculum engines (no LLMs for numbers).
- `src/providers/providers.js` — Provider/service layer. All providers are
  local; unconfigured integrations return an honest
  `{ status: 'not_configured', data: null, message }`.
- `src/hooks/hooks.js` — Theme (dark/light), local session context, responsive hooks.
- `src/components/` — Application UI kit (`Charts.jsx`, `Maps.jsx`,
  `Layout.jsx`, `Common.jsx`, `UI.jsx`).
- `src/pages/` — Routed feature pages (Decision Center, District Intelligence,
  Skill Demand, Economic Shocks, Investments, Curriculum, Digital Twin,
  Policy Simulator, Budget Optimizer, Scenario Comparison, Talent Mobility,
  Reports).

## Data & map

- All figures come from the seeded demo dataset — labelled honestly in the UI
  ("Reference Dataset"). Nothing is presented as live government data.
- The MapLibre map uses keyless CARTO (Positron / Dark Matter) basemap tiles
  plus the district boundaries GeoJSON bundled at
  `public/maharashtra-districts.geojson`.

## Environment variables

None. No `.env` file is required or used — remove any leftover `.env.local`
before running the demo.
