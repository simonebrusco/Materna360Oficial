# Materna360 — Project Tracker

## 1) Overview
- **Status**: P0 completed (production stable, UX premium, TS=0, green deploy).
- **Current phase**: P1 (Incremental Value) — routine, empathy, and daily recurrence.
- **Principles**: Soft Luxury, consistency, no dead-ends, non-blocking telemetry.

## 2) Roadmap by Phase
- **P1 (now)**:
  - /meu-dia: "Mom in Motion" (smart lists + reminders), mood/energy check-in complete.
  - /cuidar: Vaccines & Appointments (MVP: log + timeline).
  - /eu360: Weekly emotional summary (light insights).
  - Light AI daily messages (local), soft local notifications.
- **P1.5 (next)**:
  - Free/Plus/Premium plans, soft paywall, upsell toasts/banners.
  - Gamification (3 badges), quota for free tier.
- **P2**:
  - Maternal Coach (AI), auto suggestions, charts, PDF export, "Learning Through Play Week", quizzes.
- **P3**:
  - Strong launch, community, partnerships, courses, RN/Expo future.

## 3) Route Status (quick)
- **/maternar**: OK; needs "Highlights of the day" + "Continue where I left off" (P1).
- **/meu-dia**: OK base; implement Mom in Motion + final check-in + reminders (P1).
- **/cuidar**: OK base; Vaccines/Appointments MVP + timeline (P1).
- **/descobrir**: filters/empty OK; "Save for later" persistent (P1).
- **/eu360**: weekly summary OK; emotional weekly summary (P1).

## 4) Sprint P1.1 (7 days)
**Goal**: increase daily utility and emotional care.

### Backlog (with acceptance criteria)
- **MEU-DIA-001** Mom in Motion (smart lists)
  - *Acceptance*: create/edit/remove; quick templates (grocery/lunchbox); local persistence; telemetry `todos.add|edit|remove`.
- **MEU-DIA-002** Mood/Energy check-in 100%
  - *Acceptance*: 1-tap; 7-day sparkline; telemetry `mood.checkin`.
- **MEU-DIA-003** Local reminders
  - *Acceptance*: date/time; confirmation toast; telemetry `reminder.created`.
- **CUIDAR-001** Vaccines & Appointments (MVP)
  - *Acceptance*: add record (name, date, notes, type); list upcoming/past; timeline; telemetry `care.appointment_add`.
- **EU360-001** Weekly emotional summary
  - *Acceptance*: weekly avg mood/energy + one text insight; telemetry `eu360.summary_view`.

### Definition of Done
- TS=0; preview build green; basic Lighthouse OK.
- A11y focus/AA contrast; mobile 375/414 and ≥768 no overflow.
- Telemetry wired and non-blocking; events named per Telemetry Spec.

## 5) Decision Log
- 2025-11-09: P0 closed; P1 prioritized for routine/empathy.
- 2025-11-09: Paywall/gamification moved to P1.5 for fluid UX.

## 6) Risks & Mitigations
- Visual drift → enforce templates/tokens (see `UX_GUIDELINES.md`).
- Over-tracking → only essential events; never block UI.
- P1 scope creep → keep MVPs useful; push monetization to P1.5.

## 7) Telemetry Spec (summary)
- `event`: kebab-case (`mood.checkin`, `todos.add`, `care.appointment_add`)
- `tab`: `meu-dia|cuidar|maternar|descobrir|eu360`
- `payload`: short keys (`id`, `template`, `value`, `date`)
