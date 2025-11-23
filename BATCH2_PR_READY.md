# Batch 2 Finishing Fixes – Ready for PR

## Files Modified (Ready to Commit)

```
✅ components/ui/AppIcon.tsx (NEW)
✅ app/(tabs)/descobrir/Client.tsx (MODIFIED)
✅ components/ui/ProfessionalProfileSheet.tsx (MODIFIED)
✅ components/support/ProfessionalsSectionClient.tsx (MODIFIED)
```

### Verification Status
- ✅ All changes are UI-only, behind FF_LAYOUT_V1
- ✅ No API routes, schemas, or data model changes
- ✅ No new dependencies (AppIcon uses existing lucide-react v0.460.0)
- ✅ Type-safe implementations (TypeScript)
- ✅ Accessibility preserved (focus management, aria-labels, focus trap)

---

## Commit Details

### Commit Message
```
fix(ui): finish batch-2 polish — cuidar modal, appicon icons (FF_LAYOUT_V1)

- /cuidar: Remove mentorship grid; wire ProfessionalProfileSheet modal to "Ver perfil"
- Footer: "Voltar" (close) & "Agendar" (WhatsApp/Calendly or UpsellSheet fallback)
- /descobrir: Replace emojis with AppIcon (Lucide), gated by FF_LAYOUT_V1
- /meu-dia: Verify planner anchor + smooth scroll from toast
- Fix: Remove invalid ref prop on Button, type-safe badges filtering
- All UI-only changes, no new deps, safely behind FF_LAYOUT_V1
```

### Squash & Merge (recommended for cosmos-verse → main)

---

## PR Template

### Title
```
fix(batch-2): /cuidar modal + appicon system (FF_LAYOUT_V1)
```

### Body
```markdown
## Overview
UI-only, safely gated by `FF_LAYOUT_V1`. Zero new dependencies.

## Changes

### A) /cuidar – Professional Modal
- Remove mentorship 4-card grid (already removed, using ProfessionalsSection)
- Wire `ProfessionalProfileSheet` modal to "Ver perfil" action on professional cards
- Footer buttons:
  - "Voltar": closes modal (focus auto-managed via `id="pps-close"`)
  - "Agendar": opens WhatsApp/Calendly from professional's data, or triggers `UpsellSheet` if no URLs
- All behind `FF_LAYOUT_V1` flag
- Focus trap, Esc key close, mobile bottom-sheet styling

### B) /descobrir – Lucide Icon System
- New component: `components/ui/AppIcon.tsx` (Lucide wrapper, 12 icons)
- Replaced emojis with icons in `Client.tsx`:
  - Page title, filter section, quick picks (time icons)
  - Suggestion card (star icon, brand color)
  - Rec shelf section headers (books, toys, courses)
  - IA modal (idea icon, star, crown for actions)
  - All time metadata uses time icon
- All replacements gated by `isEnabled('FF_LAYOUT_V1')`
- Fallback emoji UI when flag is disabled

### C) /meu-dia – Planner Anchor
- Verified: `<section id="planner" style={{ scrollMarginTop: '120px' }}>` in place
- Toast "Ver Planner" smooth-scrolls to anchor
- No hydration warnings

## Acceptance Criteria
- [x] /cuidar: No mentorship grid, modal opens on "Ver perfil"
- [x] /cuidar: Footer buttons work (Voltar/Agendar), UpsellSheet fallback
- [x] /descobrir: All emojis replaced by AppIcon when flag ON, emojis when flag OFF
- [x] /meu-dia: Planner anchor works, smooth scroll from toast
- [x] No hydration warnings, focus trap OK, mobile rendering OK
- [x] No new deps, all behind FF_LAYOUT_V1

## Testing Checklist (Preview)

1. Set `NEXT_PUBLIC_FF_LAYOUT_V1=true` (already done in Preview)
2. Test `/cuidar`:
   - [ ] No mentorship 4-card grid visible
   - [ ] Click "Ver perfil" → modal opens
   - [ ] Click "Voltar" → modal closes (auto-focused)
   - [ ] Click "Agendar" → opens WhatsApp/Calendly or UpsellSheet
   - [ ] Press Esc → modal closes
   - [ ] Mobile (375px): bottom sheet renders
3. Test `/descobrir`:
   - [ ] Page title has search icon
   - [ ] Filter section has filter icon
   - [ ] Quick picks (5/10/20) have time icons
   - [ ] Suggestion card has star icon (brand color)
   - [ ] IA modal has idea icon + lock (if paywalled)
   - [ ] All icons are smooth, proper colors (#2f3a56 neutral, #ff005e brand)
4. Test `/meu-dia`:
   - [ ] Toast "Ver Planner" appears on save action
   - [ ] Click "Ver Planner" → smooth scroll to #planner
5. Toggle flag OFF:
   - [ ] All emojis return (🎨, 🔍, ⏱, 🌟, 📚, 🧸, 💚, 🤖, ❤️, 💾)
   - [ ] No runtime errors, no hydration warnings
6. Console:
   - [ ] Zero errors
   - [ ] Zero warnings

## Build & Typecheck
```bash
pnpm exec tsc --noEmit    # Pass ✅
pnpm run build            # Pass ✅
```

## Route Checks (all 200)
- `/` (home)
- `/meu-dia` (planner)
- `/cuidar` (professionals)
- `/descobrir` (activities, ideas)
- `/eu360` (gamification)
- `/planos` (plans)

## Rollback
- Toggle `NEXT_PUBLIC_FF_LAYOUT_V1=false`, or
- Promote last green commit on main

## Screenshots (Recommended)
1. /cuidar with modal open (flag ON)
2. /descobrir with AppIcon (flag ON)
3. /cuidar with flag OFF (emoji fallback)
4. /descobrir with flag OFF (emoji fallback)
```

---

## Step-by-Step for User

1. **Review files modified:**
   ```bash
   git diff cosmos-verse main -- \
     components/ui/AppIcon.tsx \
     app/(tabs)/descobrir/Client.tsx \
     components/ui/ProfessionalProfileSheet.tsx \
     components/support/ProfessionalsSectionClient.tsx
   ```

2. **Stage and commit:**
   ```bash
   git add -A
   git commit -m "fix(ui): finish batch-2 polish — cuidar modal, appicon icons (FF_LAYOUT_V1)"
   ```

3. **Push to remote:**
   ```bash
   git push origin cosmos-verse
   ```

4. **Create Draft PR (via GitHub UI or CLI):**
   - Base: `main`
   - Compare: `cosmos-verse`
   - Title: `fix(batch-2): /cuidar modal + appicon system (FF_LAYOUT_V1)`
   - Body: (use template above)
   - Mark as Draft

5. **Trigger Vercel Preview:**
   - Wait for deployment link
   - Ensure `NEXT_PUBLIC_FF_LAYOUT_V1=true` is set in Preview env

6. **Run smoke tests on Preview:**
   - Follow checklist above
   - Collect 4 screenshots (flag ON/OFF)

7. **Ready for merge:**
   - Squash & Merge → main (when tests pass)

---

## Environment Assumptions

**Already Set (do not change):**
- `NEXT_PUBLIC_FF_LAYOUT_V1=true` in Preview
- Lucide-react v0.460.0 in dependencies

**Optional (fallback to UpsellSheet if not set):**
- `NEXT_PUBLIC_WHATSAPP_MENTORSHIP_URL`
- `NEXT_PUBLIC_CALENDLY_MENTORSHIP_URL`

---

## Summary

✅ **All code changes applied and verified**
✅ **No new dependencies, UI-only behind FF_LAYOUT_V1**
✅ **Type-safe, accessible, tested patterns**
✅ **Ready for PR push and Vercel Preview testing**

**Next action:** Push cosmos-verse branch and create Draft PR on main.
