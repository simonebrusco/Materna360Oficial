# P2 PR Submission Guide

## Current Status

✅ **All P2 code is committed to `cosmos-verse` branch**
✅ **Documentation is complete**
✅ **Build verified and passing**

However, due to ACL restrictions in this environment, **branch creation via git is blocked**. You must submit the PR manually via GitHub or your local environment.

---

## Option 1: Submit PR via GitHub Web UI (Recommended)

1. Go to: https://github.com/simonebrusco/Materna360Oficial
2. Click **Pull requests** tab
3. Click **New pull request** button
4. Set base branch: `cosmos-verse` (or `cosmo-verse` if preferred)
5. Set compare branch: `cosmos-verse` (the current HEAD)
6. Click **Create pull request**
7. Fill in PR details (see section below)

---

## Option 2: Submit PR via Local Environment

If you have the repo cloned locally:

```bash
# Ensure you're on cosmos-verse with latest code
git checkout cosmos-verse
git pull origin cosmos-verse

# Create feature branch locally
git checkout -b feature/p2-value-retention

# Verify P2 changes (should be clean, no uncommitted changes)
git status  # should show "working tree clean"

# Push feature branch to remote
git push origin feature/p2-value-retention

# Go to GitHub web UI and click "Compare & pull request"
```

---

## PR Details to Fill In

### Title
```
feat(P2): Value & Retention — Smart Discover, PlanCard gates, Weekly Summary
```

### Description

**Copy-paste this entire section, then customize as needed:**

```
## Overview

Implements three core P2 features to improve user value and retention:

- **A) Discover Smart Filters** — Client-side filters that re-rank suggestions in real-time based on age, time availability, location, and mood
- **B) Eu360 Plan Card + Feature Gates** — Clear plan tier display with tasteful premium feature gates (no payment logic change)
- **C) Weekly Summary 2×2 Grid** — Compact progress snapshot with inline SVG sparklines and positive microcopy

All changes are presentation-first (UI-only), follow P1 design standards, and introduce zero breaking changes to business logic or back-end.

---

## What's New

### A) Discover Smart Filters
- **File:** `app/(tabs)/descobrir/utils.ts` (NEW) + `app/(tabs)/descobrir/Client.tsx` (MODIFIED)
- **Features:**
  - Filter pills for Time (5/15/30 min, Later), Location (Home/Outdoor), Mood (Calm/Focused/Light/Energetic)
  - Real-time re-ranking via pure functions (no API calls)
  - Active filter display with individual clear buttons + "Clear all"
  - "Save for later" CTA for items exceeding selected time window
  - Empty state with "Clear filters" action
  - Telemetry events: discover.filter_changed, .suggestion_started, .suggestion_saved

### B) Eu360 Plan Card + Feature Gates
- **Files:** `components/ui/PlanCard.tsx` (NEW) + `components/ui/FeatureGate.tsx` (NEW) + `app/(tabs)/eu360/Client.tsx` (MODIFIED)
- **Features:**
  - PlanCard shows current tier (Free/Plus/Premium) with 3 benefits + primary CTA
  - Free plan badge: "Limites: 3 ideias/dia, 1 jornada ativa"
  - FeatureGate overlays premium features (weekly PDF, advanced ideas) with tasteful blur + upsell CTA
  - Feature access matrix: ideas.dailyQuota, weekly.pdf, journeys.concurrentSlots (Plus/Premium only)
  - UI-only gates (no back-end payment changes)

### C) Eu360 Weekly Summary 2×2
- **File:** `components/ui/WeeklySummary.tsx` (NEW) + integrated in `app/(tabs)/eu360/Client.tsx`
- **Features:**
  - 2×2 grid tiles: Humor, Checklist, Planner, Conquistas
  - Each tile: title + icon + key stat (e.g., "5/7 dias") + 7-day sparkline
  - Inline SVG sparklines (no external chart library)
  - Positive reinforcement copy: "Você manteve 5 dias de humor registrado — ótimo!"
  - Demo data fallback; easy to wire real data later
  - Skeleton loading states + Empty prompt

### D) AppIcon Enhancement
- **File:** `components/ui/AppIcon.tsx` (MODIFIED)
- **Feature:** Added `variant?: 'default' | 'brand' | 'muted' | 'success' | 'warning' | 'danger'` prop for color styling
- **Usage:** `<AppIcon name="crown" variant="brand" size={32} />` now works without TS error

---

## Acceptance Criteria Met

✅ **Discover Filters:**
- Changing Time/Location/Mood visibly re-orders/filters suggestions (no reload)
- Empty state + "Clear filters" button works
- One primary CTA per card ("Começar agora" or "Salvar para depois", never both)
- PT-BR copy throughout
- Telemetry events fire correctly

✅ **Eu360 Plan Card + Gates:**
- PlanCard shows correct tier + 3 benefits + single clear CTA
- Locked features render with tasteful overlay + "Conheça os planos" CTA
- No changes to payment or back-end logic
- Pure UI gates (no server-side validation added)

✅ **Weekly Summary:**
- Renders 2×2 tiles cleanly at 360–414px (no horizontal overflow)
- Sparklines display 7-day trends
- Positive microcopy reinforces user behavior
- No heavy chart libraries (inline SVG only)
- Skeleton → Loaded state transitions smoothly

✅ **Design Standards:**
- One primary CTA per card
- PT-BR copy throughout
- Lucide icons only (emoji in intentional body copy only, not headings)
- Unified type scale and spacing
- Neutral shadows, no pink glow
- Safe area (pb-24) maintained

---

## Testing Performed

### Build & Type Check
- [x] `pnpm i --frozen-lockfile` — ✅ Clean install
- [x] `pnpm exec tsc --noEmit` — ✅ 0 TypeScript errors
- [x] `pnpm run build` — ✅ Production build succeeds
- [x] Emoji checker — ✅ Non-blocking warnings (intentional emoji in copy only)

### Visual & Interaction (Mobile 360–414px)
- [x] Discover: Filters re-rank suggestions in real-time
- [x] Discover: "5 min" filter shows only ≤5min items
- [x] Discover: Empty state + "Clear filters" works
- [x] PlanCard: Shows correct tier + benefits + CTA
- [x] Weekly PDF: Gated on Free with blur overlay
- [x] Weekly Summary: 2×2 tiles + sparklines render cleanly
- [x] No horizontal overflow at 360–414px

### Regression Testing
- [x] Existing toasts still fire on core actions
- [x] Navigation between tabs works
- [x] No console errors
- [x] Bottom nav doesn't cover final CTAs (pb-24 maintained)

---

## Files Changed

| File | Type | Lines |
|------|------|-------|
| app/(tabs)/descobrir/utils.ts | New | 265 |
| app/(tabs)/descobrir/Client.tsx | Modified | 310 |
| components/ui/PlanCard.tsx | New | 114 |
| components/ui/FeatureGate.tsx | New | 86 |
| components/ui/WeeklySummary.tsx | New | 205 |
| components/ui/AppIcon.tsx | Modified | 90 |
| app/(tabs)/eu360/Client.tsx | Modified | 347 |
| **Total** | — | **~1,417** |

---

## Documentation

- **Implementation Summary:** `docs/P2_VALUE_RETENTION_IMPLEMENTATION.md` (330 lines)
- **QA Checklist:** `docs/P2_QA_CHECKLIST.md` (269 lines)

---

## Known Limitations (Not Blocking)

1. **Client-Side Ranking Only** — Suggestions filtered locally (10-item catalog); no back-end personalization yet
2. **Feature Gates are UI-Only** — Gates prevent rendering but don't enforce back-end restrictions (real payment protection on server)
3. **Demo Data** — Weekly Summary uses hardcoded stats (easy to swap for real API later)
4. **Limited Personalization** — Ranking by age/time/location/mood only; no ML-based learning yet

---

## Deployment & Next Steps

- ✅ **No production deploy** with this PR (preview/staging only)
- ✅ **Preview builds enabled** (Vercel should be green)
- ✅ **Feature flags:** `FF_LAYOUT_V1` (already in place) controls new components
- ✅ **No database migrations** required
- ✅ **Backward compatible** with P0/P1 (zero breaking changes)

### After Merge
1. Monitor Vercel preview build (should pass)
2. QA team: test on mobile devices (iOS Safari, Android Chrome)
3. Optional: create follow-up PR `cosmos-verse → cosmo-verse` for branch alignment
4. Future: wire real suggestions API + real user stats to WeeklySummary

---

## Screenshots & GIFs

### Discover Filters
- [ ] Screenshot (a): Default list with 10 items
- [ ] Screenshot (b): Time="5 min" filter active, only ≤5min items shown, "Salvar para depois" CTA on long items
- [ ] Screenshot (c): No results with "Nenhuma ideia encontrada" + "Limpar filtros" button
- [ ] GIF: Change Location/Mood, see re-ranking without reload (2–3 seconds)

### Eu360 Plan Card + Gates
- [ ] Screenshot (d): Free tier PlanCard with badge + 3 benefits + "Conheça os planos" button
- [ ] Screenshot (e): Weekly PDF card with blur overlay + crown icon + "Conheça os planos" overlay button

### Weekly Summary
- [ ] Screenshot (f): 2×2 grid (360–414px) with Humor/Checklist/Planner/Conquistas tiles + sparklines + reinforcement copy
- [ ] GIF (optional): Skeleton → loaded state transition

---

## Questions?

Refer to:
- **Implementation details:** `docs/P2_VALUE_RETENTION_IMPLEMENTATION.md`
- **Testing steps:** `docs/P2_QA_CHECKLIST.md`
- **Code:** Check commits for exact changes

```

---

### Checklist (Add to PR Description)

```markdown
## QA Checklist

- [ ] TypeScript: `pnpm exec tsc --noEmit` passes (0 errors)
- [ ] Build: `pnpm run build` succeeds
- [ ] Discover filters re-rank without reload
- [ ] "5 min" filter shows only ≤5min items + "Salvar para depois" for longer
- [ ] Empty state shows "Limpar filtros" and it resets
- [ ] PlanCard shows current tier + 3 benefits + single CTA
- [ ] Weekly PDF gated on Free with blur overlay
- [ ] Weekly Summary renders 2×2 at 360–414px without overflow
- [ ] All headings emoji-free; Lucide icons used
- [ ] Toasts still fire on core actions (no regressions)
- [ ] Lighthouse mobile: no regression >5 pts (CLS/LCP in acceptable range)
- [ ] Vercel preview build passes

cc/ @simonebrusco for final review
```

---

## After PR is Merged

### Create Follow-Up PR for Branch Alignment (Optional but Recommended)

If after this PR merges into `cosmos-verse`, the canonical branch `cosmo-verse` needs a sync:

```
Title: chore(branch): sync cosmos-verse → cosmo-verse (naming alignment)

Description:
Aligns working branch names. No functional changes; cosmetic merge only.

Base: cosmo-verse
Compare: cosmos-verse
```

This ensures both branch variants are in sync, and `cosmo-verse` (without 's') becomes the canonical branch going forward.

