# Multi-Agent Architecture for Reno App

## 1. Recommended agent set

Reno App should not start with a runtime multi-agent system. The useful agent model for the MVP is a set of clearly named responsibilities that can guide prompts, reviews, and later development automation.

### Development agents (core)

Development agents are internal helpers. They support product quality, code maintenance, pricing discipline, prompt quality, and testing. They are not exposed to users.

#### Product Agent

**Responsibility**

Keeps Reno App focused on the guided consumer renovation journey.

**Inputs**

- Product goals.
- Current user flow.
- Feature requests.
- User feedback.
- Existing docs and roadmap notes.

**Outputs**

- Scope recommendations.
- Acceptance criteria.
- Flow review notes.
- Warnings when a feature starts to look like CRM, dashboard, or back-office software.

**When used**

Before adding or reshaping major product flows.

**Why it exists**

Reno App is an early consumer MVP. The Product Agent helps keep the app focused on upload -> style -> wizard -> results -> saved projects, instead of drifting into broad renovation management software.

#### Pricing Agent

**Responsibility**

Protects deterministic, explainable pricing logic.

**Inputs**

- Pricing catalog.
- Estimate engine rules.
- Room type.
- Renovation scope.
- Material assumptions.
- Confidence rules.
- Exclusions.

**Outputs**

- Pricing rule review notes.
- Missing assumption warnings.
- Catalog consistency checks.
- Plain-language explanations of deterministic estimate output.

**When used**

When changing the cost engine, pricing catalog, estimate assumptions, exclusions, or confidence logic.

**Why it exists**

Pricing is core trust infrastructure. AI may help review or explain pricing rules, but it must not generate final prices, override totals, or hide assumptions.

#### UX / Localization Agent

**Responsibility**

Improves homeowner-facing language and prepares copy for future localization.

**Inputs**

- UI copy.
- Wizard questions.
- Report copy.
- Error states.
- Locale requirements.
- Product tone guidance.

**Outputs**

- Clearer consumer copy.
- Localized string suggestions.
- Tone and reading-level review.
- Warnings for technical or contractor-only language.

**When used**

When adding or editing screens, wizard steps, reports, premium framing, or user-facing messages.

**Why it exists**

The product should feel helpful to homeowners. Copy should be clear, practical, and non-technical.

#### AI Prompt Agent

**Responsibility**

Maintains prompts for AI-supported inspiration, explanations, and content.

**Inputs**

- Prompt templates.
- AI output examples.
- Failure cases.
- Style options.
- Wizard answers.
- Estimate output.
- Report requirements.

**Outputs**

- Prompt revisions.
- Eval cases.
- Output format guidance.
- Guardrail recommendations.

**When used**

When improving redesign generation, planning insights, report summaries, or AI fallback behavior.

**Why it exists**

AI behavior should be reviewable and versioned. Prompt changes should be intentional, not scattered through product code.

#### QA / Test Agent

**Responsibility**

Finds regressions in the consumer journey, estimate logic, local storage, and AI output boundaries.

**Inputs**

- Codebase.
- Test suite.
- Known bugs.
- User flows.
- Pricing scenarios.
- Prompt examples.

**Outputs**

- Test cases.
- Regression notes.
- Flow checklists.
- Bug reports.
- Release readiness notes.

**When used**

Before releases, after estimate changes, after prompt changes, and after refactors.

**Why it exists**

The MVP needs confidence in a few critical flows, not broad test infrastructure for its own sake.

#### Code Refactor Agent

**Responsibility**

Performs small, scoped code maintenance tasks.

**Inputs**

- Current repo structure.
- Target files.
- Existing tests.
- Local conventions.
- Refactor goal.

**Outputs**

- PR-sized code changes.
- Cleanup plans.
- Duplication reductions.
- Type and structure improvements.

**When used**

When code becomes harder to change, logic is duplicated, or a small cleanup would make product work easier.

**Why it exists**

The app should stay easy to modify. Refactors should be narrow, reversible, and tied to real maintenance needs.

### Runtime agents (future only)

Runtime agents should come later, after the core product flow and deterministic estimate engine are stable. They should improve explanation and planning, not control core business logic.

#### Planning Assistant Agent

**Responsibility**

Explains the renovation plan in plain language and helps the user understand tradeoffs.

**Inputs**

- Wizard answers.
- Selected style.
- Deterministic estimate output.
- Assumptions.
- Exclusions.
- Confidence reasons.

**Outputs**

- Planning summary.
- Priority suggestions.
- Risk notes.
- Next-step guidance.

**When used**

After results are generated, when the user needs help interpreting the plan.

**Why it exists**

Users may understand the numbers but still need help deciding what to do next. This agent can explain the plan without changing the estimate.

#### Contractor Questions Agent

**Responsibility**

Generates practical questions a homeowner can ask contractors.

**Inputs**

- Project scope.
- Room type.
- Estimate assumptions.
- Exclusions.
- Risk notes.
- User priorities.

**Outputs**

- Contractor question list.
- Scope clarification prompts.
- Comparison checklist.

**When used**

When preparing a report or project packet for contractor conversations.

**Why it exists**

This turns Reno App from an estimate screen into a useful planning artifact while staying outside pricing calculation.

#### Report / Content Agent

**Responsibility**

Creates homeowner-friendly report content from existing project data.

**Inputs**

- Project details.
- Deterministic estimate output.
- Planning insights.
- Assumptions.
- Exclusions.
- Confidence reasons.
- Selected style.

**Outputs**

- Report summary.
- Scope overview.
- Next-step section.
- Tradeoff notes.
- Premium report copy.

**When used**

When generating or previewing a renovation planning report.

**Why it exists**

Reports need clear writing and organization. This agent can improve presentation without becoming a pricing authority.

### Non-agent layer

#### Redesign Prompt Controller

The Redesign Prompt Controller is not an agent.

**Responsibility**

Builds controlled image-generation prompts from user selections and app constraints.

**Inputs**

- Uploaded room image context.
- Selected style.
- Room type.
- User preferences.
- Safety and realism constraints.

**Outputs**

- Image-generation prompt.
- Negative prompt or constraints when supported.
- Controlled style instructions.

**When used**

During AI redesign generation.

**Why it exists**

Image redesign needs consistency and guardrails, but it does not need agent planning, memory, autonomy, or tool routing. It should remain a predictable prompt-building layer.

## 2. Development vs Runtime separation

### Development agents

Development agents are used only while building and maintaining Reno App.

They should never be exposed to users. They should not run as part of the product experience. Their job is to help maintain product quality, pricing discipline, prompt quality, tests, documentation, and code structure.

Development-only work includes:

- Product scope review.
- Pricing catalog review.
- Estimate rule validation.
- Prompt tuning.
- Test generation.
- QA review.
- Code refactoring.
- Documentation updates.
- Localization review.

This work stays outside the product because it affects how Reno App is built, not what a homeowner should interact with.

### Runtime agents

Runtime agents are future product features with limited scope.

They may improve the user experience by explaining renovation plans, preparing report content, or generating contractor questions. They must consume deterministic project data and estimate output. They must never replace the estimate engine.

Runtime agents may later become part of:

- Planning insights.
- Report generation.
- Contractor question lists.
- Homeowner next-step guidance.

Runtime agents must not:

- Generate final prices.
- Modify estimate totals.
- Hide assumptions.
- Rewrite exclusions.
- Claim contractor quote accuracy.
- Replace the guided product flow.

## 3. What we explicitly do NOT build now

Reno App should avoid the following during the MVP:

- No multi-agent orchestration.
- No autonomous agent loops.
- No agent memory or agent database.
- No "AI platform" inside the app.
- No pricing generated by AI.
- No complex routing between agents.
- No enterprise features.
- No agent permissions system.
- No agent dashboards.
- No background agent workers.
- No chat-first replacement for the guided flow.

These are intentionally excluded because the MVP needs simplicity, speed, and control. The product should prove that homeowners want a guided renovation planning flow with trustworthy deterministic estimates before adding complex AI infrastructure.

## 4. Role of Codex SDK

Codex SDK can be useful later for development workflows. It should not be used as runtime AI inside Reno App.

Codex SDK is a development tool, not a product feature.

| Use case | Why useful | Why not needed yet | When it becomes relevant |
| --- | --- | --- | --- |
| Repo analysis | Helps find duplicated logic, unclear boundaries, and architecture drift. | The repo is still small enough for manual review. | After the core flow and estimate engine stabilize. |
| Scoped refactors | Can produce PR-sized cleanup changes that follow existing patterns. | Early files may still change often. | When repeated maintenance slows feature work. |
| Test generation | Helps add coverage for pricing scenarios, local storage, and user flows. | Test targets may still be moving. | After deterministic estimate scenarios are documented. |
| QA automation | Can run checks and summarize regressions. | Reliable scripts and fixtures should exist first. | After basic lint, type, and test commands are trusted. |
| Prompt maintenance | Helps compare prompt outputs against examples and suggest improvements. | Prompt expectations are still likely to change. | After redesign and planning output examples are saved. |
| Pricing catalog validation | Helps review catalog changes for missing assumptions or inconsistent labels. | Human review is still required for pricing judgment. | After the catalog format and estimate contract are stable. |
| PR-sized changes | Helps automate small maintenance tasks without broad rewrites. | Manual coding is faster while the app is young. | After the project has recurring maintenance work. |

Codex SDK should be introduced only when there are repeatable development tasks worth automating.

## 5. Practical rollout plan

### Phase 1 - now

Keep everything manual and simple.

- Use manual prompts for redesign, planning insights, and report content.
- Keep prompt templates easy to find and review.
- Stabilize deterministic pricing inputs, outputs, assumptions, exclusions, and confidence reasons.
- Manually refactor when code becomes difficult to change.
- Clean up UX copy and prepare copy patterns for future localization.
- Add focused tests around pricing and the main project flow when useful.
- Keep AI downstream from deterministic project data.

### Phase 2 - later

Use Codex SDK or Codex-style development agents for repeatable engineering work.

- Introduce repo analysis for architecture drift.
- Automate small scoped refactors.
- Generate and maintain estimate test cases.
- Add QA automation for upload -> style -> wizard -> results -> saved projects.
- Track prompt examples and use them for prompt maintenance.
- Validate pricing catalog changes before release.
- Keep changes PR-sized and easy to review.

### Phase 3 - much later

Add limited runtime agents only if they make the product more useful.

- Planning Assistant Agent for explaining results and next steps.
- Report / Content Agent for clearer planning packets.
- Contractor Questions Agent for contractor conversation prep.

These agents should remain narrow. They should explain and organize deterministic outputs, not control the app.

## 6. Final recommendation

- Build the product first.
- Keep the guided consumer flow as the center of the app.
- Treat AI as support for inspiration, explanation, content, and development.
- Keep deterministic pricing as a core product boundary.
- Never allow AI to generate final prices or override estimate totals.
- Use development agents before runtime agents.
- Treat Codex SDK as a future development tool, not a product feature.
- Avoid premature complexity until the MVP proves the core renovation planning journey.
