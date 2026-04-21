<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reno App Repository Guidance

## Product Identity

Reno App is a consumer-facing AI renovation planning app. It is not a CRM, dashboard, admin console, contractor back office, or enterprise workflow product.

The app helps users plan real room renovations through:

- guided consumer UX
- local project/session flow
- deterministic renovation estimates
- later AI assistance for analysis, inspiration, summaries, and recommendations

## Core Product Rule

Pricing logic must remain deterministic, explainable, and auditable.

AI may support:

- room/photo analysis
- redesign inspiration
- summarization
- recommendations
- user-friendly explanations

AI must not:

- invent prices
- replace the estimate engine
- override deterministic totals
- hide assumptions, exclusions, or confidence logic

## Current Project Phase

Reno App is in early MVP.

Priority order:

1. Consumer flow
2. Local persistence
3. Deterministic estimate engine
4. Architecture clarity
5. AI integrations later

Keep the MVP narrow until the core journey works well:

landing -> upload -> style -> wizard -> results -> saved projects

## Implementation Preferences

- Keep the stack simple.
- Prefer small, reversible changes.
- Avoid unnecessary abstractions.
- Use existing project patterns before introducing new structure.
- Keep route files focused and domain logic easy to find.
- Do not add external services unless explicitly requested.
- Do not add auth, payments, database code, API routes, or AI provider abstractions unless required by the task.
- Keep local-first behavior practical and easy to replace later.

## UX Guidance

- Optimize for a guided consumer renovation flow.
- Use clear, non-technical homeowner language.
- Make each step feel purposeful and connected.
- Show estimate assumptions, exclusions, and confidence plainly.
- Avoid dashboard-first information architecture.
- Avoid CRM, admin, pipeline, client-management, or back-office concepts.

## Safety Guidance

- Never expose secrets.
- Never hardcode API keys.
- Keep environment values out of committed files.
- Respect sandbox and approval settings.
- Do not bypass approval requirements.
- Keep changes easy to review.
- Avoid broad rewrites unless the task explicitly calls for them.

## Working Style

Before making changes:

- inspect the current repository state
- read relevant local Next.js docs when touching Next.js behavior
- propose a short plan
- keep scope tight
- list files to modify
- call out any existing unrelated worktree changes

When implementing:

- complete the requested task end to end when feasible
- verify with lint/type checks when relevant
- do not modify unrelated files
- do not revert user changes unless explicitly asked
