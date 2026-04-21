# Architecture

## Current Direction

Reno App should be organized around the consumer journey:

Landing page -> upload -> style selection -> wizard -> results -> saved projects.

The app should avoid dashboard-first or internal business structures.

## Proposed Top-Level Shape

- `app/` for routes and route-level layout.
- `components/` for reusable UI and flow components.
- `features/` for domain-specific logic.
- `data/` for static MVP data and mock fixtures.
- `docs/` for product and engineering documentation.
- `public/` for static assets.

## Route Areas

- `/` landing page.
- `/upload` image upload.
- `/style` style selection.
- `/wizard` guided planning flow.
- `/results` generated project output.
- `/projects` saved project list.
- `/projects/[projectId]` saved project detail.

## Feature Areas

- `features/upload` for upload validation and image metadata.
- `features/style-selection` for curated renovation styles.
- `features/wizard` for steps, schemas, and collected answers.
- `features/estimation` for deterministic cost logic.
- `features/ai` for future prompt and provider boundaries.
- `features/projects` for saved session behavior.

## Maintainability Rules

- Keep pricing logic out of UI components.
- Keep AI logic out of pricing logic.
- Keep route files thin.
- Prefer plain TypeScript modules for domain rules.
- Add persistence only after local project flow is stable.
- Avoid introducing service layers before there is real complexity.

## Near-Term Technical Direction

- Start local-first.
- Use static data for styles and estimate rules.
- Save project sessions in browser storage initially.
- Defer database, authentication, and API routes.
- Keep every module easy to delete or replace.

