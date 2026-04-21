# Free vs Premium

## Positioning

Free gives homeowners a useful renovation planning estimate.

Premium helps them organize that estimate into a clearer project packet.

Pricing logic stays deterministic and explainable in both tiers.

## Free Includes

- Upload room context.
- Choose a renovation style.
- Select redesign inspiration.
- Complete the planning wizard.
- See deterministic low, mid, and high estimates.
- Review cost breakdown line items.
- See assumptions and exclusions.
- See confidence score and confidence reasons.
- Save and reopen local projects.
- Preview the local planning report shell.
- Review basic renovation checklist and next steps.

## Premium Includes

Premium should focus on planning presentation and preparation.

- Polished project report.
- Contractor-ready scope summary.
- Budget risk and tradeoff review.
- Material and finish planning checklist.
- Timeline preparation guide.
- Contractor question list.
- Export/share-ready packet later.
- AI-assisted explanation later, using deterministic estimate output.

## Planned Later

These are not part of the current local-first MVP:

- Real payments.
- Authentication.
- Database-backed accounts.
- Purchase history.
- PDF generation.
- Share links.
- Email delivery.
- Contractor matching.
- AI-generated pricing.

## Always Free

These must never be gated:

- Estimate total range.
- Mid estimate.
- Line item breakdown.
- Assumptions.
- Exclusions.
- Confidence score.
- Confidence reasons.
- Explanation of how the estimate was produced.

## Premium Must Not Affect

Premium status must not change:

- cost formulas
- room type rates
- scope multipliers
- quality multipliers
- complexity factor
- line item inclusion
- confidence scoring
- assumptions
- exclusions

Premium may consume estimate output for presentation, but it must not mutate or replace it.

## Boundary Examples

Allowed:

- Free user sees the complete estimate.
- Premium user gets the same estimate organized into a cleaner report packet.

Not allowed:

- Free user sees only a vague range while premium user gets the real line items.

Allowed:

- Premium AI summarizes the deterministic estimate in plain language.

Not allowed:

- Premium AI generates a different estimate.

Allowed:

- Premium adds contractor questions based on assumptions and exclusions.

Not allowed:

- Premium hides exclusions until payment.

## Suggested Upgrade Moments

- Results page after the free estimate is shown.
- Report preview page after the user sees the planning packet shell.
- Saved project detail page when returning to a plan.

## In-Product Framing

Use:

- "Create a cleaner planning packet."
- "Prepare before you contact contractors."
- "Organize your estimate, assumptions, and next steps."
- "Unlock full renovation packet."

Avoid:

- "Unlock your estimate."
- "Get AI pricing."
- "Professional quote."
- "Guaranteed cost."

## Implementation Notes For Later

- Add entitlement checks outside the cost engine.
- Treat premium as a report, export, or planning capability.
- Keep deterministic estimate output serializable and auditable.
- Do not add payments, authentication, API routes, or database persistence until explicitly scoped.
