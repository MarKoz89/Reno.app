# AI Integration

## Purpose

AI should make Reno App feel helpful and personalized while keeping estimates deterministic, inspectable, and reproducible.

## MVP Position

The first implementation should work without AI. AI integration should be added behind clear boundaries after the core flow and cost engine exist.

## AI-Supported Use Cases

- Summarize the uploaded room context.
- Turn wizard answers into a plain-language renovation brief.
- Suggest style-aligned recommendations.
- Explain estimate assumptions in consumer-friendly language.
- Generate next-step checklists.

## AI Should Not

- Calculate final pricing.
- Replace the deterministic cost engine.
- Store secrets in prompts or client code.
- Make legal, permit, or safety guarantees.
- Present uncertain image observations as facts.

## Input Contract

AI prompts should receive structured data:

- Selected style.
- Wizard answers.
- Cost engine output.
- User notes.
- Optional image-derived observations in the future.

## Output Contract

AI responses should be structured and validated before display.

Expected sections:

- Summary.
- Recommended priorities.
- Style guidance.
- Risks or assumptions.
- Next steps.

## Fallback Behavior

If AI is unavailable, the app should still show:

- Deterministic estimate.
- Saved project data.
- Basic rule-based recommendations.
- Static next steps.

## Security Notes

- API keys must stay server-side.
- Do not add API routes until the integration design is ready.
- Do not send unnecessary personal information to AI providers.
- Keep prompt templates versioned and reviewable.

