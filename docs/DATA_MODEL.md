# Data Model

## Purpose

This document defines the initial app data shapes before database or API implementation. The MVP can start local-first and later map these structures to persistent storage.

## Core Entities

### Project

A saved renovation planning session.

Fields:

- `id`
- `name`
- `createdAt`
- `updatedAt`
- `status`
- `uploadedImages`
- `selectedStyle`
- `wizardAnswers`
- `estimate`
- `recommendations`

### Uploaded Image

Represents a user-provided room image.

Fields:

- `id`
- `fileName`
- `previewUrl`
- `mimeType`
- `sizeBytes`
- `uploadedAt`

### Renovation Style

A curated style option shown to consumers.

Fields:

- `id`
- `name`
- `description`
- `imageUrl`
- `tags`

### Wizard Answers

Structured answers collected during the guided flow.

Fields:

- `roomType`
- `roomSize`
- `currentCondition`
- `renovationGoal`
- `priority`
- `scopeItems`
- `budgetRange`
- `timeline`
- `diyComfort`
- `constraints`
- `notes`

### Estimate

Deterministic output from the cost engine.

Fields:

- `lowTotal`
- `highTotal`
- `currency`
- `lineItems`
- `assumptions`
- `confidenceLevel`

### Estimate Line Item

An explainable cost item.

Fields:

- `id`
- `label`
- `category`
- `quantity`
- `unit`
- `lowUnitCost`
- `highUnitCost`
- `lowSubtotal`
- `highSubtotal`
- `explanation`

### Recommendation

Consumer-facing guidance generated from project inputs.

Fields:

- `id`
- `title`
- `body`
- `priority`
- `source`

## Storage Strategy For MVP

- Use local-first project storage initially.
- Keep data serializable as JSON.
- Avoid database-specific assumptions in the first implementation.
- Treat uploaded images as local previews until persistent storage is introduced.

