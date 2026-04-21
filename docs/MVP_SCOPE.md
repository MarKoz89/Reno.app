# MVP Scope

## MVP Focus

Build the smallest useful consumer renovation planning flow:

Landing page -> upload -> style selection -> wizard -> results -> saved projects.

The MVP should prove that users can describe a renovation goal, receive an understandable plan, and save it for later.

## Included

- Consumer landing page.
- Upload flow for room images.
- Style selection from a small curated list.
- Renovation wizard with practical questions.
- Deterministic cost engine using documented rules.
- Results page showing plan, estimate range, assumptions, and next steps.
- Saved projects using local-first storage initially.
- Clear placeholders for future AI integrations.

## Excluded

- Authentication.
- Database persistence.
- API routes.
- Contractor, client, or admin workflows.
- Payment or subscription logic.
- Real-time collaboration.
- AI-generated pricing.
- Permit/legal/compliance automation.

## Initial Renovation Scope

Start with a narrow set of room/project types:

- Kitchen refresh.
- Bathroom refresh.
- Living room refresh.
- Bedroom refresh.

Start with lightweight project categories:

- Paint and finishes.
- Flooring.
- Fixtures.
- Cabinets or storage.
- Lighting.
- Basic demolition or removal.

## Implementation Bias

- Prefer static data and local storage before backend persistence.
- Prefer transparent formulas before advanced optimization.
- Prefer one complete flow over many incomplete features.
- Keep every feature understandable by a solo developer.

