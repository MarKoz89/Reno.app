# Decisions

This file tracks important product and engineering decisions for Reno App.

## 001 - Consumer-First Product

Decision:

Reno App is a consumer-facing renovation planning app.

Implications:

- No CRM concepts in the MVP.
- No clients, contractor pipeline, or internal dashboard IA.
- The main navigation follows the homeowner journey.

## 002 - Deterministic Pricing

Decision:

Renovation estimates must come from deterministic rules, not AI-generated prices.

Implications:

- Cost formulas must be inspectable.
- Estimate assumptions must be visible.
- AI can explain pricing but cannot create totals.

## 003 - Local-First MVP

Decision:

The MVP should start without database, auth, or API routes.

Implications:

- Saved projects can begin with browser storage.
- Data structures should remain serializable.
- Backend work waits until the product flow is proven.

## 004 - Narrow Renovation Scope

Decision:

The first version focuses on room refresh planning, not full construction management.

Implications:

- Initial project types should be limited.
- The wizard should avoid advanced contractor or permit workflows.
- Recommendations should remain practical and consumer-readable.

## 005 - AI As Support Layer

Decision:

AI should support personalization, summarization, and guidance.

Implications:

- The app must still work without AI.
- AI output should be structured and validated.
- Prompt templates should be versioned and reviewable.

