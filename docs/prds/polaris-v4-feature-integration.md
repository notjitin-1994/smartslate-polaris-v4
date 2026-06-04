# Polaris v4 — Feature Integration Document

**Product:** Smartslate Polaris — AI-assisted Learning Experience Design
**Document type:** Feature integration specification
**Version:** 0.1 (draft for review)
**Date:** 4 June 2026
**Status:** Proposed — pending engineering review

---

## 1. Purpose & strategic context

Polaris generates learning blueprints from intelligent questioning and hands them directly to **Constellation** for instructional design build-out. That integration already exists and is the product's downstream anchor.

This document specifies three new capability areas that move Polaris from "a structured prompt with a good UI" toward a **defensible system of record** for learning design:

1. **Org Memory** — a living, versioned, diffable, reusable artifact layer.
2. **Multiplayer Stakeholder Intake** — selective question distribution to stakeholders and SMEs, with aggregated answer selection.
3. **Immutability & Locking** — controlled freezing of static answers and generated blueprints.

### Why these features matter (defensibility thesis)

The core generation loop (questions in, blueprint out) is increasingly replicable with a general-purpose AI assistant. The features below are deliberately the parts a stateless chatbot **cannot** reproduce:

- **Memory** creates switching costs — leaving Polaris means losing accumulated organizational context.
- **Versioned artifacts** turn a one-shot transcript into a reusable, auditable asset.
- **Multiplayer intake** makes needs analysis a coordinated, multi-party process rather than a single-player chat.
- **Immutability** provides the auditability and trust that AI-generated design work currently lacks.

The moat is not generation quality (commoditized, improving externally). The moat is methodology + memory + workflow + artifact integrity + handoff to Constellation.

---

## 2. Scope

### In scope
- Org Memory artifact model, versioning, diff, and reuse.
- Static and dynamic questionnaire question-level selection and sharing.
- External stakeholder/SME share links scoped to selected questions only.
- Answer collection, email delivery to the owning user, and multi-answer aggregation/selection.
- Locking rules for static questionnaires and generated blueprints.

### Out of scope (this document)
- Constellation's internal build behavior (treated as an existing downstream consumer).
- Authoring/content generation beyond the blueprint handoff.
- Billing, plan gating, and usage limits (referenced only where they touch these features).

### Assumptions to confirm
- Stack continuity: Next.js / TypeScript / Supabase / Drizzle / Vercel.
- An authenticated **owning user** initiates intake; **stakeholders/SMEs** may be unauthenticated link recipients.
- Email delivery uses a transactional provider (e.g., Resend/Postmark/SES) — provider TBD.
- "Static questionnaire" = fixed baseline intake questions. "Dynamic questionnaire" = AI-generated follow-up questions conditioned on prior answers and org context.

> Confirm each assumption before build; items marked **(TBC)** below depend on these.

---

## 3. Core concepts & glossary

| Term | Definition |
|------|------------|
| **Project** | A single learning-design engagement that produces one or more blueprints. |
| **Static questionnaire** | Fixed, predefined intake questions. Baseline context capture. |
| **Dynamic questionnaire** | AI-generated follow-up questions, conditioned on static answers + org memory. |
| **Question** | An individually addressable intake item; can be shared independently. |
| **Stakeholder / SME** | A person invited to answer selected questions, typically via external share link. |
| **Share link** | A scoped, tokenized URL exposing only the questions selected for that recipient. |
| **Answer set** | All collected answers for a question, across all respondents. |
| **Org Memory** | Persistent, versioned organizational context reused across projects. |
| **Blueprint** | The generated learning design artifact handed to Constellation. |
| **Lock** | An immutability state preventing further edits to a scoped object. |

---

## 4. Feature 1 — Org Memory (living, versioned, reusable)

### 4.1 Goal
Persist organizational design context so every new project is sharper than the last, and so blueprints become auditable, comparable assets rather than disposable outputs.

### 4.2 What lives in Org Memory
- Competency frameworks and role/skill taxonomies.
- Learner personas and audience segments.
- Brand, tone, and instructional standards (e.g., preferred objective verbs, evaluation model).
- Constraints (time, budget, delivery modality, compliance).
- Prior blueprints and their intake answer sets.

### 4.3 Living + versioned
- Every memory object is **versioned**; edits create a new immutable version, never an in-place overwrite.
- Each version records author, timestamp, and a change summary.
- A version pointer marks the **current** state; prior versions remain retrievable.

### 4.4 Diffable
- Any two versions of a memory object (or two blueprints) can be compared field-by-field.
- Diffs render added / removed / changed at the section and field level.
- Use case: "What changed in our onboarding blueprint between Q1 and Q3?"

### 4.5 Reusable
- New projects can **seed** from existing memory (personas, constraints, frameworks) so intake is pre-populated.
- Dynamic questionnaire generation reads org memory as context, producing more tailored follow-ups over time.

### 4.6 Data model (sketch — refine with Drizzle schema)
- `org_memory_object` — `id`, `org_id`, `type`, `current_version_id`
- `org_memory_version` — `id`, `object_id`, `version_no`, `payload` (JSON), `author_id`, `created_at`, `change_summary`
- `blueprint_version` — `id`, `project_id`, `version_no`, `sections` (JSON), `locked`, `created_at`

### 4.7 Acceptance criteria
- [ ] Editing a memory object produces a new version; the prior version is retrievable.
- [ ] Two versions can be diffed with field-level granularity.
- [ ] A new project can be seeded from selected memory objects, pre-filling intake.
- [ ] Dynamic questionnaire generation demonstrably uses org memory as input.

---

## 5. Feature 2 — Multiplayer Stakeholder Intake

This is the highest-novelty feature. It converts intake from a single-player questionnaire into a coordinated, multi-respondent process.

### 5.1 Question selection & sharing
- The owning user can select **individual questions** from **both** the static and dynamic questionnaires.
- Selected questions are bundled into a **share** targeted at one or more stakeholders/SMEs.
- Different recipients can receive different question subsets (e.g., budget questions to a sponsor, content questions to an SME).

**Behavior**
- Selection is per-question, not all-or-nothing.
- A question may be shared with multiple recipients simultaneously.
- The owning user retains a record of which questions went to whom.

### 5.2 Share link behavior
- Each share generates a **scoped, tokenized link**.
- The recipient sees **only the questions selected for them** — no other questionnaire content, no project internals.
- Recipients are typically unauthenticated; the token is the access control. **(TBC: link expiry, single-use vs. reusable, optional email verification.)**
- The page presents the selected questions and a submission action.

### 5.3 Answer collection & delivery
- On submission, the recipient's answers are captured against the specific questions.
- Provided answers are **sent to the owning user via email**.
- **(TBC)** Email contents: full answers inline vs. notification + link back into Polaris. Recommendation below.

> **Recommendation:** send a notification email with a summary and a deep link back into Polaris, rather than dumping all answers into email. This keeps Polaris the system of record, supports long/structured answers, and avoids email as a data store. Confirm whether the literal requirement ("answers sent over via email") means full inline answers or notification — this changes the email design.

### 5.4 Answer aggregation & selection
- On the questionnaire page, the owning user sees **all answers from all stakeholders, for every question**, presented as selectable options.
- For any question with multiple collected answers, the user can **choose which answer** (or answers) to carry forward into the blueprint.
- This selection step is what feeds the canonical answer set used for generation.

**Behavior**
- Each question shows: its own answer (if any) plus every stakeholder answer, attributed to respondent.
- The user selects the authoritative answer per question.
- **(TBC)** whether multiple answers can be merged/combined, or strictly one is chosen. Define explicitly.

### 5.5 User flow (happy path)
1. User completes/began static + dynamic questionnaires.
2. User selects specific questions and shares them with chosen stakeholders/SMEs.
3. Each recipient opens a scoped link showing only their questions and submits answers.
4. User receives email notification per submission.
5. User returns to the questionnaire page, reviews all collected answers per question, and selects the authoritative answer(s).
6. User proceeds to blueprint generation.

### 5.6 Acceptance criteria
- [ ] User can select individual questions from both static and dynamic sets.
- [ ] A share link exposes only the selected questions for that recipient.
- [ ] Stakeholder submissions trigger an email to the owning user.
- [ ] All stakeholder answers appear per-question as selectable options for the user.
- [ ] User's selected answers form the canonical set used in generation.

---

## 6. Feature 3 — Immutability & Locking

### 6.1 Static questionnaire lock
- **Trigger:** the static questionnaire is submitted.
- **Effect:** static answers become **read-only and cannot be modified** thereafter.
- **Rationale:** establishes a fixed, auditable baseline for the engagement.

**Edge cases to resolve**
- Do **stakeholder** answers to shared static questions count toward "submitted," or only the owning user's submission? **(TBC)**
- Is there any correction path (e.g., new version of the project) if a static answer was wrong? Recommend a "fork/new version" escape hatch rather than silent edit, to preserve auditability.

### 6.2 Blueprint lock
- **Trigger:** a blueprint is generated.
- **Effect:** **no section of the generated blueprint is modifiable.** The blueprint is frozen on creation.
- **Rationale:** the blueprint is the contract handed to Constellation; immutability guarantees what was approved is what gets built.

**Edge cases to resolve**
- Regeneration: if the user wants changes, do they generate a **new blueprint version** (preferred — ties into §4 versioning) rather than editing the existing one? Recommend yes.
- Diff between blueprint versions falls out naturally from §4.4.

### 6.3 State model
```
Static questionnaire:  draft -> submitted (LOCKED)
Blueprint:             not_generated -> generated (LOCKED)
```

### 6.4 Acceptance criteria
- [ ] After static submission, static answers reject all edit attempts.
- [ ] After generation, all blueprint sections reject all edit attempts.
- [ ] Any "change" path creates a new version rather than mutating a locked object.

---

## 7. Constellation integration (existing — documented for completeness)

- Generated blueprints **plug directly into Constellation** for instructional design build-out.
- Because blueprints are locked on generation (§6.2), Constellation consumes a stable, immutable artifact.
- **(TBC)** Document the handoff contract: payload shape, trigger (automatic on generation vs. explicit push), and version mapping between a Polaris blueprint version and its Constellation build.

---

## 8. Cross-cutting considerations

| Area | Note |
|------|------|
| **Access control** | Owning user authenticated; stakeholders via scoped token. Define token lifetime, revocation, and re-share behavior. |
| **Privacy** | Stakeholder answers may contain sensitive org data. Confirm storage, retention, and that share links can be revoked. |
| **Auditability** | Versioning + locking together give a defensible audit trail — a key selling point vs. generic AI. |
| **Cost** | Dynamic questionnaire generation and blueprint generation are LLM calls; meter per project for margin protection. |
| **Email deliverability** | If notifications are core to the flow, use a reputable transactional provider and monitor bounces. |

---

## 9. Suggested build sequence

1. **Org Memory versioning + lock primitives** — the shared foundation; §4 and §6 reuse the same versioning machinery.
2. **Immutability rules** (§6) — small, high-trust win; depends on (1).
3. **Question-level selection + scoped share links** (§5.1–5.2).
4. **Answer collection + email notification** (§5.3).
5. **Answer aggregation + selection UI** (§5.4).
6. **Diff & reuse UX** (§4.4–4.5) — the visible payoff of the versioning foundation.

Sequencing rationale: versioning underpins both memory and locking, so it ships first. Multiplayer intake is the headline differentiator but depends on the share/answer plumbing, so it follows the foundation.

---

## 10. Open questions (consolidated)

1. Email: full inline answers, or notification + deep link? (§5.3)
2. Can multiple stakeholder answers be merged, or is exactly one chosen per question? (§5.4)
3. Does stakeholder submission contribute to the static "submitted/locked" trigger? (§6.1)
4. Correction path for a wrong static answer — fork to new project version? (§6.1)
5. Share link policy: expiry, single-use vs. reusable, optional verification? (§5.2)
6. Constellation handoff contract: payload, trigger, version mapping? (§7)

---

*Prepared as a working specification. Bracketed **(TBC)** items and §10 require product decisions before engineering estimation.*
