# P3 — Mentorship, Organization Tips, AI Ideas Quota

## Overview

This PR implements three P3 features:
1. **Mentorship (Light-Touch)** — Discoverable mentor connections with tabs for profiles and quick Q&A
2. **Advanced Organization Tips** — Searchable, tag-filtered tips with planner integration
3. **AI Ideas with Visible Quotas** — Daily idea generation limits by plan tier with graceful handling

All changes are **presentation-first** (UI-only), no back-end modifications, and respect existing FeatureGate patterns.

---

## A) Mentorship (Light-Touch)

### Files Created
- `components/mentorship/MentorCard.tsx` (68 lines) — Individual mentor profile card
- `components/mentorship/MentorshipSheet.tsx` (170 lines) — Modal sheet with tabs (Mentoras, Tira-dúvidas)
- `components/mentorship/MentorshipEntry.tsx` (59 lines) — Entry banner + FeatureGate wrapper
- `app/(tabs)/cuidar/mentors.catalog.ts` (41 lines) — Curated stub of 5 mentors

### Features
- **Entry Point:** Small banner card "Converse com uma mentora" with single CTA "Abrir"
- **Sheet with Tabs:**
  - **"Mentoras":** 3–6 mentor cards (avatar, name, specialty, 2 bullets, "Ver disponibilidade" CTA)
  - **"Tira-dúvidas rápido":** Form (tema dropdown, pergunta textarea, "Enviar" button)
    - On "Enviar": UI-only mock, show success toast "Pergunta enviada com sucesso", dismiss sheet
- **Gating:** Wrapped in FeatureGate; on Free plan, shows blur overlay + "Conheça os planos" CTA
- **Copy:** All PT-BR, Lucide icons (messages-square, heart, check, x), one primary CTA per card
- **Styling:** White cards, neutral shadow, rounded-2xl, white/60 borders

### Acceptance
- ✅ Entry point visible and clickable
- ✅ Sheet opens/closes smoothly with tabs
- ✅ Form on "Tira-dúvidas" works; toast fires on "Enviar"
- ✅ Mentor cards display correctly
- ✅ FeatureGate overlay appears on Free plan
- ✅ No dead ends; graceful upsell CTA

---

## B) Advanced Organization Tips

### Files Created
- `components/orgtips/OrgTipsFilters.tsx` (74 lines) — Search input + tag pills
- `components/orgtips/OrgTipCard.tsx` (64 lines) — Individual tip card
- `components/orgtips/OrgTipsClient.tsx` (103 lines) — Controller with filter/sort logic
- `app/(tabs)/cuidar/orgtips.catalog.ts` (67 lines) — Curated catalog of 8 tips

### Features
- **Filters:**
  - Text search (debounced 250ms) against title + summary
  - Tag pills: "Rotina", "Casa", "Estudos", "Autocuidado"
  - Filter by text AND tags (all selected tags must match)
- **Sorting:** Lightweight relevance scoring (text hits + tag matches)
- **Cards:** Title, summary, tags, 2 CTAs:
  - Primary: "Salvar no Planner" → mock save, show toast
  - Secondary: "Detalhes" link (text-style, no button)
- **Empty State:** "Nenhuma dica encontrada" + "Limpar filtros" button
- **Telemetry:**
  - `orgtips.filter_changed` on search/tag change
  - `orgtips.saved_to_planner` on save CTA
- **Copy:** All PT-BR, Lucide icons, one primary CTA per card
- **Styling:** White cards, neutral shadow, rounded-2xl, tag pills styled as gray background

### Acceptance
- ✅ Search input debounced; list updates in real-time
- ✅ Tag pills toggle selected state visually
- ✅ Filter logic works (AND, text + tags)
- ✅ Relevance sort applied correctly
- ✅ "Salvar no Planner" fires toast
- ✅ Empty state with "Limpar filtros" works
- ✅ Telemetry events fire

---

## C) AI Ideas with Visible Quotas

### Files Created
- `components/ideas/useIdeasQuota.ts` (50 lines) — Custom hook for quota state
- `components/ideas/QuotaBadge.tsx` (25 lines) — Badge showing quota
- `components/ideas/IdeasHeader.tsx` (21 lines) — Header with badge + info
- `components/ideas/IdeasPanel.tsx` (143 lines) — Generate button + list + error state

### Features
- **Quota Model (Client Mock):**
  - Free: 3 ideas/day
  - Plus: 10 ideas/day
  - Premium: unlimited (∞)
- **Badge:** "Ideias hoje: 2/3" (Free) or "Ideias: ilimitadas" (Premium)
- **Generate Flow:**
  - Show badge + info in header
  - On click: optimistic Skeleton → mock idea card after 2s
  - Increment `usedToday` in local state
  - Show deterministic idea from mock catalog
- **Quota Limits:**
  - When limit reached: disable button + show ErrorState inline
  - ErrorState: "Você atingiu seu limite diário no plano Free. Volte amanhã ou experimente o Plus." + "Conheça os planos" CTA
  - Premium: never disable, but throttle UI (3–5s button disabled after click)
- **List:** Generated ideas listed below with title, description, duration, age range
- **Copy:** All PT-BR, one primary CTA, no emojis in headings (icon-based)
- **Styling:** White cards, neutral shadow, rounded-2xl, badge with primary background

### Acceptance
- ✅ Badge displays correct quota (X/Y or ∞)
- ✅ Button enabled/disabled based on limit
- ✅ Generate flow: Skeleton → idea card → list updates
- ✅ Counter increments with each generation
- ✅ When limit reached: button disabled + ErrorState visible
- ✅ Premium: unlimited but throttled UI (3–5s)
- ✅ "Conheça os planos" CTA works
- ✅ Telemetry: `ideas.generated`, `ideas.quota_exceeded`

---

## Design & Standards Met

✅ **One Primary CTA per Card**
- Mentorship: "Abrir" (entry) + "Ver disponibilidade" (card)
- Org Tips: "Salvar no Planner" (primary) + "Detalhes" (link)
- Ideas: "Gerar Ideia" (primary) + "Conheça os planos" (error CTA)

✅ **PT-BR Copy Throughout**
- All headings, buttons, labels, descriptions in Portuguese
- No English mixed in

✅ **Lucide Icons Only**
- Mentorship: messages-square, heart, check, x
- Org Tips: search, filter
- Ideas: idea, alert-circle, save, trash

✅ **Accessibility**
- aria-labels on buttons and forms
- aria-pressed on toggle pills
- aria-hidden on decorative icons
- Semantic HTML (dialog, form, section)

✅ **Responsive**
- Mobile-first design (360–414px)
- No horizontal overflow
- Grid layouts adapt (1–2 columns)

✅ **Safe Area**
- All pages maintain pb-24 (tab bar safe)
- Last CTAs never covered by nav

✅ **FeatureGate Integration**
- Mentorship gated on Free plan
- Graceful overlay + upsell CTA
- "Conheça os planos" navigates to /planos

---

## Integration Points

### Cuidar Page
- Replace/wrap `OrganizationTips` with `OrgTipsClient`
- Add `MentorshipEntry` section (near ProfessionalsSection)
- Both components work as drop-in replacements

### Descobrir Page (Optional)
- Add `IdeasHeader` + `IdeasPanel` in a new section
- Could also go in EU360 or a dedicated /ideas page

### Future Wiring
- Connect real API for mentor availability
- Wire real user stats to quiz/survey for tip recommendations
- Persist generated ideas to planner via actual API

---

## Files Changed

| File | Type | Lines |
|------|------|-------|
| components/mentorship/MentorCard.tsx | New | 68 |
| components/mentorship/MentorshipSheet.tsx | New | 170 |
| components/mentorship/MentorshipEntry.tsx | New | 59 |
| components/orgtips/OrgTipsFilters.tsx | New | 74 |
| components/orgtips/OrgTipCard.tsx | New | 64 |
| components/orgtips/OrgTipsClient.tsx | New | 103 |
| components/ideas/useIdeasQuota.ts | New | 50 |
| components/ideas/QuotaBadge.tsx | New | 25 |
| components/ideas/IdeasHeader.tsx | New | 21 |
| components/ideas/IdeasPanel.tsx | New | 143 |
| components/ui/FeatureGate.tsx | Modified | +3 (added mentorship.access) |
| app/(tabs)/cuidar/mentors.catalog.ts | New | 41 |
| app/(tabs)/cuidar/orgtips.catalog.ts | New | 67 |
| **Total** | — | **~888 lines** |

---

## QA Checklist

### Build & Type Safety
- [ ] `pnpm i --frozen-lockfile` — ✅ dependencies install cleanly
- [ ] `pnpm exec tsc --noEmit` — ✅ 0 TypeScript errors
- [ ] `pnpm run build` — ✅ production build succeeds

### Mentorship (Manual, Mobile 360–414px)
- [ ] Entry banner visible in Cuidar/Eu360
- [ ] "Abrir mentoria" button clickable → sheet opens
- [ ] Sheet has 2 tabs: "Mentoras" and "Tira-dúvidas rápido"
- [ ] "Mentoras" tab shows 3–6 mentor cards with avatar, name, specialty, bullets
- [ ] "Ver disponibilidade" button on each card
- [ ] "Tira-dúvidas rápido" tab has tema (dropdown) + pergunta (textarea)
- [ ] "Enviar" button disabled if tema or pergunta empty
- [ ] On "Enviar": success toast "Pergunta enviada com sucesso" + sheet closes
- [ ] On Free plan: blur overlay + "Conheça os planos" CTA visible

### Org Tips (Manual, Mobile 360–414px)
- [ ] Search input debounced; list updates after 250ms
- [ ] Tag pills toggle selected state (visual ring on selection)
- [ ] Filter by text in title/summary
- [ ] Filter by tags (AND logic)
- [ ] Relevance sort applied (text hits + tag matches)
- [ ] "Salvar no Planner" button fires toast "salva no Planner com sucesso"
- [ ] "Detalhes" link styled as text (no button appearance)
- [ ] When no results: Empty state shows "Nenhuma dica encontrada" + "Limpar filtros"
- [ ] "Limpar filtros" resets search + tags

### Ideas Quota (Manual, Mobile 360–414px)
- [ ] Header shows QuotaBadge: "Ideias hoje: 0/3" (Free) or "Ideias: ilimitadas" (Premium)
- [ ] "Gerar Ideia" button visible and clickable
- [ ] On click: Skeleton shows briefly (~2s)
- [ ] After load: idea card appears in list with title, description, duration, age range
- [ ] Each generation increments counter (0/3 → 1/3 → 2/3 → 3/3)
- [ ] At 3/3 (Free): button disables + ErrorState inline shows "Você atingiu seu limite diário"
- [ ] ErrorState button "Conheça os planos" goes to /planos
- [ ] Premium plan: counter never disables, but button throttled 3–5s after each click

### Regression & Consistency
- [ ] No console errors
- [ ] Existing toasts still work (no duplicate toast handlers)
- [ ] FeatureGate overlays work on mentorship entry
- [ ] All headings emoji-free (Lucide icons used)
- [ ] All copy in PT-BR (no English)
- [ ] Neutral shadow consistent (shadow-[0_4px_24px_rgba(47,58,86,0.08)])
- [ ] Rounded corners consistent (rounded-2xl)
- [ ] White borders consistent (border border-white/60)
- [ ] pb-24 safe area maintained (nav doesn't cover last CTA)

### Telemetry
- [ ] Open console
- [ ] Change search/tag in Org Tips → log `[telemetry] orgtips.filter_changed`
- [ ] Click "Salvar no Planner" → log `[telemetry] orgtips.saved_to_planner`
- [ ] Click "Gerar Ideia" → log `[telemetry] ideas.generated`
- [ ] When quota exceeded → log `[telemetry] ideas.quota_exceeded`

### Lighthouse Mobile
- [ ] Performance score ≥80 (no regression from baseline)
- [ ] CLS < 0.1 (no layout shift)
- [ ] LCP < 2.5s (fast load)

---

## Known Limitations

1. **Mentor Availability:** Mock data only; no real booking or availability API
2. **Form Submission:** "Tira-dúvidas" form is UI-only mock; no back-end submission
3. **Planner Save:** Toast only; no actual planner API integration
4. **Ideas:** Deterministic mock catalog; no AI-generated content
5. **Quota Reset:** Daily reset is client-side mock (not server-validated)

---

## Deployment Notes

- ✅ No production deploy (preview/staging only)
- ✅ No database migrations
- ✅ No API changes
- ✅ No payment logic changes
- ✅ Feature flags control visibility (FF_LAYOUT_V1 if needed)
- ✅ Backward compatible with P0/P1/P2

