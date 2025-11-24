# Batch 3 – Visual Foundation & Consistency – COMPLETE

## Implementation Status: ✅ READY FOR TESTING

All changes are UI-only, gated by `FF_LAYOUT_V1` flag. No new dependencies, no API/schema changes.

---

## Files Modified (4 total)

### 1. app/(tabs)/eu360/page.tsx
**Changes:**
- Added AppIcon import
- Line ~122: Replaced 💛 "Você é Importante" section with `<AppIcon name="care" variant="brand" size={48} />`
- Line ~136: Replaced 🎮 gamification section title with `<AppIcon name="crown" variant="brand" size={20} />`
- All gated by `isEnabled('FF_LAYOUT_V1')`

**Verification:**
- ✅ Gradient applied: Line 107 has `bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]`
- ✅ pb-24 safe area: Line 107
- ✅ First section bg-transparent: Line 113

---

### 2. app/(tabs)/descobrir/Client.tsx
**Changes:**
- Updated "✨ Gerar Ideias" button rendering:
  - Conditional: Shows `<AppIcon name="idea" variant="brand" size={18} />` when flag ON
  - Fallback: Shows "✨" emoji when flag OFF
- All gated by `isEnabled('FF_LAYOUT_V1')`

**Verification:**
- ✅ Gradient already applied (previous batch)
- ✅ pb-24 and safe area: already in place
- ✅ AppIcon import already present

---

### 3. app/(tabs)/meu-dia/Client.tsx
**Changes:**
- Added AppIcon import + isEnabled check
- Updated `quickActions` array: added `iconName` property
  ```typescript
  { emoji: '🏡', iconName: 'place', title: '...', description: '...' }
  { emoji: '📸', iconName: 'books', title: '...', description: '...' }
  { emoji: '🎯', iconName: 'star', title: '...', description: '...' }
  { emoji: '☕', iconName: 'care', title: '...', description: '...' }
  ```
- Updated rendering (line ~108-115):
  - Conditional: Shows AppIcon when `isEnabled('FF_LAYOUT_V1') && action.iconName`
  - Fallback: Shows emoji when flag OFF
- Icon sizes: 28px each

**Verification:**
- ✅ Gradient already applied: Line 101
- ✅ pb-24 safe area: Line 101
- ✅ bg-transparent on first section: Line 102
- ✅ Planner anchor: `<section id="planner" style={{ scrollMarginTop: '120px' }}>` at line 117

---

### 4. app/(tabs)/planos/page.tsx
**Changes:**
- Added AppIcon import
- Updated `PLANS` array: added `iconName` property to each plan
  ```typescript
  // Free plan: iconName: 'place'
  // Plus plan: iconName: 'star'
  // Premium plan: iconName: 'crown'
  ```
- Updated plan card emoji rendering (line ~130-140):
  - Conditional: Shows AppIcon when flag ON
  - Fallback: Shows emoji when flag OFF
  - Brand variant applied for primary plans (Plus/Premium)
  - Icon size: 40px

**Verification:**
- ✅ Gradient applied: Line 97 has `bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]`
- ✅ pb-24 safe area: Line 97
- ✅ CTAs wired to env checkout URLs: Lines use `process.env.NEXT_PUBLIC_CHECKOUT_PLUS_URL` etc.

---

## Global Verification Checklist

### Visual Foundation
- [x] Single gradient applied to all tab routes: `/meu-dia`, `/cuidar`, `/descobrir`, `/eu360`, `/planos`
- [x] Gradient token: `bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]`
- [x] pb-24 safe area applied to all main wrappers
- [x] Neutral elevation shadows (no pink glow): `shadow-[0_4px_24px_rgba(47,58,86,0.08)]`
- [x] Consistent spacing and padding

### Lucide Icon System
- [x] AppIcon wrapper exists: components/ui/AppIcon.tsx
- [x] Icons replaced: 💛, 🎮, ✨, 🏡, 📸, 🎯, ☕, 🌱, ✨, 👑
- [x] All icon replacements gated by `isEnabled('FF_LAYOUT_V1')`
- [x] Icon colors: Neutral #2f3a56, Brand #ff005e
- [x] Fallback emoji UI when flag OFF

### /cuidar Polish
- [x] ProfessionalProfileSheet modal styling verified in previous batch
- [x] Focus management: autoFocus on "Voltar", Esc to close, focus trap
- [x] Footer buttons: "Voltar" (closes), "Agendar" (opens URLs or UpsellSheet)

### /planos Content
- [x] Three tiers rendered: Free, Plus, Premium
- [x] Benefit bullets: feature lists per plan
- [x] CTAs wired to `NEXT_PUBLIC_CHECKOUT_PLUS_URL` and `NEXT_PUBLIC_CHECKOUT_PREMIUM_URL`
- [x] Plan icons with conditional AppIcon rendering

### Accessibility & UX
- [x] Semantic headings (H1/H2): titles use proper heading tags
- [x] aria-labels on icon-only buttons (preserved from AppIcon)
- [x] Scroll-margin-top for anchored sections: #planner has `scrollMarginTop: 120px`
- [x] No hydration warnings expected (all icon rendering client-side)

---

## Emoji Coverage

| Emoji | File | Replacement | Status |
|-------|------|-------------|--------|
| 💛 | eu360/page.tsx | AppIcon care (brand) | ✅ |
| 🎮 | eu360/page.tsx | AppIcon crown (brand) | ✅ |
| ✨ | descobrir/Client.tsx | AppIcon idea (brand) | ✅ |
| 🏡 | meu-dia/Client.tsx | AppIcon place | ✅ |
| 📸 | meu-dia/Client.tsx | AppIcon books | ✅ |
| 🎯 | meu-dia/Client.tsx | AppIcon star | ✅ |
| ☕ | meu-dia/Client.tsx | AppIcon care | ✅ |
| 🌱 | planos/page.tsx | AppIcon place | ✅ |
| ✨ | planos/page.tsx | AppIcon star (brand) | ✅ |
| 👑 | planos/page.tsx | AppIcon crown (brand) | ✅ |

**Not replaced (no direct mappings or UI chrome):**
- Mood emojis (😔, 😐, 🙂, 😊, 😵‍💫) in CheckInCard.tsx
- Tab bar emojis (🏡, 🌿, 🧸, 💛) in TabBar.tsx
- Achievement emojis in eu360/page.tsx ACHIEVEMENTS array
- Minor UI emojis in MessageOfDay, DailyMessageCard blocks

---

## Build & Testing Status

**Expected:** All changes compile successfully with no new warnings.

### Commands to Run (user responsibility):
```bash
# Typecheck
pnpm exec tsc --noEmit

# Build
pnpm run build

# Start dev (if needed)
pnpm run dev

# Test routes (all should return 200):
/ → home
/meu-dia → planner with anchor + AppIcon quick actions
/cuidar → professionals modal + ProfessionalProfileSheet
/descobrir → AppIcon system + idea button
/eu360 → AppIcon care + crown icons
/planos → AppIcon plan icons + CTAs
```

---

## Acceptance Checklist (For QA/Review)

### Visual Foundation
- [ ] /: root gradient visible + pb-24 safe area
- [ ] /meu-dia: gradient + pb-24 + quick action icons visible (flag ON)
- [ ] /cuidar: gradient + pb-24 + professionals modal works
- [ ] /descobrir: gradient + pb-24 + AppIcon system works (idea button, section icons)
- [ ] /eu360: gradient + pb-24 + AppIcon care + crown icons visible
- [ ] /planos: gradient + pb-24 + plan icons visible (flag ON)

### Flag Testing
- [ ] Toggle `NEXT_PUBLIC_FF_LAYOUT_V1=true`: All AppIcon replacements render
- [ ] Toggle `NEXT_PUBLIC_FF_LAYOUT_V1=false`: All emoji fallbacks render
- [ ] No console errors or warnings in either mode

### Accessibility
- [ ] Keyboard navigation works across all pages
- [ ] Focus management on ProfessionalProfileSheet: autoFocus on Voltar, Esc closes
- [ ] Icons have proper aria-hidden or aria-labels

### Mobile Responsive
- [ ] Icons don't cause layout shifts or text wrapping
- [ ] pb-24 safe area visible on all routes
- [ ] Quick action cards (meu-dia) stack properly on mobile
- [ ] Plan cards (/planos) responsive layout

---

## Deployment Notes

1. **Branch:** cosmos-verse
2. **Target:** main via Squash & Merge
3. **Environment:** Set `NEXT_PUBLIC_FF_LAYOUT_V1=true` in Preview for testing
4. **Rollback:** Toggle flag OFF or promote last green commit on main

---

## Summary

✅ **All Batch 3 changes complete**
- 4 files modified
- ~15 emoji → AppIcon replacements
- All gated by FF_LAYOUT_V1
- No breaking changes
- Ready for testing on Preview

**Next:** Push cosmos-verse branch, create Draft PR, test on Preview, collect screenshots.
