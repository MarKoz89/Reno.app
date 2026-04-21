# Wizard Flow

## Purpose

The wizard collects enough structured information to create a useful renovation plan and deterministic estimate without overwhelming the user.

## Entry Conditions

The user should enter the wizard after:

1. Uploading at least one room image or choosing to continue without an image.
2. Selecting a preferred renovation style.

## Proposed Steps

### 1. Room Basics

Collect:

- Room type.
- Approximate room size.
- Current condition.
- Whether the room is occupied or empty.

### 2. Renovation Goal

Collect:

- Main goal: cosmetic refresh, functional upgrade, resale prep, or full refresh.
- Priority: cost, speed, durability, or appearance.

### 3. Scope Selection

Collect selected work areas:

- Paint.
- Flooring.
- Lighting.
- Fixtures.
- Storage/cabinets.
- Countertops.
- Demolition/removal.

### 4. Budget And Timeline

Collect:

- Target budget range.
- Desired timeline.
- DIY comfort level.
- Need for professional labor.

### 5. Constraints

Collect:

- Must-keep items.
- Accessibility needs.
- Pets or children considerations.
- Rental restrictions.
- Notes from the user.

### 6. Review

Show a concise summary before generating results:

- Uploaded image count.
- Selected style.
- Room type and size.
- Selected scope.
- Budget and timeline.

## Output

The wizard should produce a structured project input object that can feed:

- The deterministic cost engine.
- The results page.
- Future AI plan/recommendation generation.
- Saved project storage.

