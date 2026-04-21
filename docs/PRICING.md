# Pricing Strategy

## Product Principle

Reno App charges for better renovation planning organization, not for hiding core estimate logic.

The free product should help a consumer understand a real room renovation: style direction, project inputs, deterministic estimate range, line items, assumptions, exclusions, and confidence.

Premium should package that information into a clearer planning artifact a homeowner can use before talking to contractors.

## What Must Stay Free

- Guided consumer flow from upload to results.
- Style selection and local redesign inspiration.
- Deterministic low, mid, and high estimate range.
- Cost breakdown line items.
- Estimate assumptions and exclusions.
- Confidence score and confidence reasons.
- Basic next steps and checklist.
- Local project save and reopen.

## First Paid Unit

The recommended first paid unit is a one-time project planning report unlock.

Suggested early range: `$9-$19` per project.

This should be framed as:

- contractor-ready scope summary
- budget risk review
- tradeoff notes
- homeowner checklist
- contractor question list
- cleaner report/export-ready packet later

This must not include:

- different estimate totals
- AI-invented pricing
- contractor quote guarantees
- contractor matching
- payment, auth, API, or database work in the current MVP

## Pricing Model Options

## Free

Best for validating the core product.

- Full deterministic estimate.
- Local saved project.
- Basic planning report preview.
- No account required.

## One-Time Unlock

Best first paid model for an early consumer MVP.

- User pays for one project packet.
- Easier to understand than a subscription.
- Lower implementation and trust burden once payments are added.
- Fits occasional renovation planning behavior.

## Bundle

Possible later option.

- Example: three project packets for a discounted price.
- Useful if users compare multiple rooms or design directions.
- Should come after single-project willingness to pay is proven.

## Subscription

Defer until repeat usage is proven.

- Better for users planning many projects over time.
- Requires account state, billing state, cancellation flows, and ongoing value.
- Too heavy for the current local-first MVP.

## Recommended MVP Strategy

Start with free usage plus a soft premium report shell.

When paid implementation is explicitly scoped, start with a one-time project planning packet unlock rather than a subscription.

The first monetization test should answer:

- Do users value a cleaner renovation packet after seeing the free estimate?
- Does the report help users prepare for contractor conversations?
- Are users willing to pay per project before Reno App has accounts or long-term project management?

## Subscription vs One-Time Unlock Risks

## Subscription Risks

- Feels too heavy for occasional renovation planning.
- Requires authentication, billing, account state, cancellation, and support.
- Creates pressure to add recurring features before the core journey is proven.
- May reduce trust if users only need help with one room.

## One-Time Unlock Risks

- Lower lifetime value than a successful subscription.
- The premium artifact must be clear and useful.
- Users may expect export/share/PDF functionality.
- Pricing must feel reasonable relative to the planning value.

## Monetization Guardrails

- Never hide estimate totals, line items, assumptions, exclusions, or confidence behind premium.
- Never make free estimates intentionally vague.
- Never change estimate formulas based on payment status.
- Never position AI as a premium pricing authority.
- Never claim Reno App produces contractor quotes or guaranteed costs.
- Keep premium checks out of the deterministic estimate engine.

## In-Product Framing

Use language like:

- "Create a cleaner planning packet."
- "Prepare before contacting contractors."
- "Organize your estimate, assumptions, and next steps."
- "Unlock full renovation packet."

Avoid language like:

- "Unlock your estimate."
- "Get AI pricing."
- "Professional quote."
- "Guaranteed renovation cost."

## Planned Later

- Real payment provider integration.
- Account and purchase state.
- Export or PDF generation.
- Shareable project links.
- Premium AI summaries based on deterministic outputs.
- Scenario comparison.
- Multi-project bundles.

These should be added only when explicitly scoped.
