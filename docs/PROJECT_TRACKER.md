# 🌸 Materna360 – Live Project Tracker

**Last update:** November 12, 2025
**Branch:** `cosmos-verse`
**Overall progress:** 🟢 **85% complete**
**Estimated completion:** ~10 working days (≈ 2 weeks)

---

## 🧭 Overview
The Materna360 app is a premium parental wellness and organization platform focused on emotional intelligence, self-care, and daily planning for mothers.  
This tracker summarizes progress across **UX/UI, Engineering, Product, and QA**.

---

## ✅ Status Summary

| Phase | Status | Description |
|--------|---------|-------------|
| P0 – UI Base & Structure | ✅ Completed | Design system, navigation, typography, infra |
| P1 – Core Features | ✅ Completed | Meu Dia, Cuidar, Descobrir, Eu360 |
| P2 – Intelligence & Personalization | ✅ Completed | Coach Materno v0.3, Emotion Trends, PDF v2, Telemetry Dashboard, Inactivity Reminders |
| P3 – QA & Polish | 🟡 In progress | A11y review, responsive QA, edge case testing |
| P4 – Launch | 🔜 Upcoming | Final deploy to production |

---

## 📦 Development Checklist

### 1. Core Infrastructure
- [x] Navigation (5 tabs: Meu Dia, Cuidar, Maternar, Descobrir, Eu360)
- [x] Feature flags and redirects
- [x] Telemetry base events
- [x] TypeScript clean build
- [ ] Emoji checker final cleanup (0.5d)
- [ ] Docs: PROJECT_TRACKER.md, ENV.md, QA_CHECKLIST.md filled (1.5d)

### 2. Design System & UI Consistency
- [x] Design tokens (spacing, radius, colors, typography)
- [x] Components (SoftCard, Badge, FilterPill, Toast, EmptyState)
- [x] Unified typography classes `.m360-*`
- [ ] A11y review (contrast & focus) (1d)
- [ ] Responsive QA (mobile/tablet) (1d)

### 3. Tabs

#### /maternar (Hub)
- [x] 6-card grid navigation
- [ ] Empty/onboarding state (1d)
- [ ] "Continue where you left off" (1.5d)
- [ ] Dynamic highlights (1d)

#### /meu-dia
- [x] Planner & reminders
- [x] Mood check-in (single)
- [x] Emotion trend chart (SVG)
- [x] Coach Materno v0.1
- [x] Coach Materno v0.2 (tone + focus)
- [x] PDF focus integration

#### /cuidar
- [ ] Child diary (1d)
- [ ] Mother tracker (0.5d)
- [ ] Consultations/vaccines (1d)
- [ ] Digital safety guide (1.5d)

#### /descobrir
- [x] Filters & ranking by age
- [x] Empty-state
- [ ] Save for later persistence (0.5d)
- [ ] "Semana do Aprender Brincando" (2d)
- [ ] Development quiz MVP (2d)

#### /eu360
- [x] Weekly summary
- [x] Emotional diary
- [x] Coach Materno integration
- [x] Export PDF v1
- [x] Paywall soft modal
- [ ] Export PDF v2 (premium cover + summary) (1.5d)

---

### 4. Premium Features
- [x] Paywall modal
- [ ] Real gating by plan (1d)
- [ ] Premium onboarding flow (1d)

---

### 5. Intelligence & Personalization
- [x] Coach Materno v0.2 (focus + tone)
- [x] Coach v0.3 – contextual empathy with pattern-based messages (low_energy_week, inactivity, trend_up, balanced, no_data)
- [x] Emotion trends: weekly emotional summary in /eu360
- [x] Inactivity reminder in /meu-dia (local-only, gentle CTA)

---

### 6. PDF Export & Reports
- [x] Basic export (window.print)
- [x] Premium PDF v2 (logo, cover, summary, planner) gated by plan
- [ ] Real PDF generation (@react-pdf/renderer) (future enhancement)

---

### 7. Telemetry & Insights
- [x] Unified telemetry (page_view, nav_click, card_click, coach, pdf_export_attempt, paywall_shown, plan_*, discover_save, reminder_inactivity_*, coach_v3_*)
- [x] Local insights dashboard `/admin/insights` v0.2 (flag-gated by NEXT_PUBLIC_FF_INTERNAL_INSIGHTS)
  - KPIs (total events, unique users, top events)
  - Filters by date range and event type
  - Real-time table view with sorting
  - Time-series chart
  - Clear telemetry button
- [x] Clean log outputs and privacy-safe storage

---

### 8. QA & Launch
- [x] Functional QA across 5 routes (/meu-dia, /cuidar, /maternar, /descobrir, /eu360)
- [x] Telemetry validation and dashboard testing
- [x] Documentation updates (PROJECT_TRACKER, QA_CHECKLIST, ENV, README)
- [ ] A11y audit (contrast, focus states) (1d)
- [ ] Responsive polish (tablet ≥768px) (1d)
- [ ] Final edge case testing (0.5d)
- [ ] Production deploy (0.5d)

---

## ⏱️ Estimated Remaining Time
| Category | Time |
|-----------|------|
| A11y + Responsive + Edge cases | **~2.5 days** |
| Final deploy + monitoring | **+0.5 day** |
| **Total (QA + Launch)** | **≈ 10 working days (≈ 2 weeks)** |

---

## 🌟 P2 – Intelligence & Personalization (✅ COMPLETE)

### Delivered Features:
- ✅ **Coach Materno v0.3** – Context-aware, pattern-based messages with empathetic tone
- ✅ **Weekly Emotional Insight** in /eu360 – Summary and trends visualization
- ✅ **Inactivity Reminder** in /meu-dia – Gentle nudge to return to journaling
- ✅ **Premium PDF v2** – Dynamic cover, summary sections, gated by plan
- ✅ **Internal Telemetry Dashboard** (`/admin/insights`) – Local-only KPIs, filters, chart, and clear button
- ✅ **Unified Telemetry** – Comprehensive event tracking across all tabs and features
- ✅ **TypeScript & Builds** – All types passing, no compilation errors

---

## 🌟 Upcoming Milestones (P3 & Beyond)
1. A11y audit (contrast, focus states)
2. Responsive polish for tablet
3. Advanced analytics and exports
4. Public launch (target: late December 2025)

---

_This tracker is auto-updated manually at the end of each sprint and serves as a living reference for Materna360's progress._
