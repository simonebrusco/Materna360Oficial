# Validation Checklist: Lucide Icon System for /descobrir

## Pre-Deployment Verification

### Code Quality
- [x] No new dependencies added (lucide-react already installed v0.460.0)
- [x] AppIcon component created with TypeScript strict mode compliance
- [x] All imports properly resolved in Client.tsx
- [x] Feature flag checks: `isEnabled('FF_LAYOUT_V1')` used consistently
- [x] Fallback emojis in place for when flag is disabled
- [x] No breaking changes to existing routes or data models

### Type Safety
- [x] AppIcon TypeScript types: `IconName` union type for icon names
- [x] Props properly typed: `SVGProps<SVGSVGElement>` with custom extensions
- [x] ref forwarding implemented with `forwardRef`
- [x] No `any` type casts except one intentional cast for iconName mapping (necessary due to dynamic string)

### Build Verification Commands
```bash
# Run in local dev or preview
npm run build        # Should succeed with no errors
npm exec tsc --noEmit  # Should pass with no type errors
```

## Manual Testing on Preview

### Setup
1. Set `NEXT_PUBLIC_FF_LAYOUT_V1=true` in Vercel Preview environment
2. Redeploy Preview or clear browser cache
3. Navigate to `/descobrir`

### Test Cases

#### Test 1: Page Structure
**With flag enabled:**
- [ ] Page title shows search icon (magnifying glass) before "Descobrir"
- [ ] Filter section header shows filter icon (sliders)
- [ ] "Tempo Rápido" section visible with 5, 10, 20 min buttons
- [ ] Each time button shows time icon before duration

**Icon Visual Checks:**
- [ ] All icons are smooth, black (#2f3a56 neutral or #ff005e brand)
- [ ] Icon sizes are proportional to context (18px button, 16px chips, 20px headers)
- [ ] Icons align vertically with text using flexbox

#### Test 2: Section Headers
- [ ] "Sugestão do Dia" title shows star icon (brand color)
- [ ] Large emoji in suggestion card replaced with larger star icon
- [ ] Time metadata in suggestion card shows time icon
- [ ] "Livros Recomendados" shows books icon
- [ ] "Brinquedos Sugeridos" shows toy/building block icon
- [ ] "Para Você" shows heart/care icon

#### Test 3: Rec Shelf (if available)
- [ ] Each category (Books, Toys, Courses, Printables) shows appropriate icon
- [ ] Icons match mapped values: books→📖, toys→🧩, etc.

#### Test 4: IA (Beta) Modal
- [ ] IA button visible in filter bar with idea/lightbulb icon (brand color)
- [ ] Clicking IA button opens modal
- [ ] Modal title shows idea/lightbulb icon with "IA (Beta)"
- [ ] "Favoritar" button shows star icon
- [ ] "Salvar no Planner" button shows crown icon (brand color)
- [ ] Time metadata in modal shows time icon

#### Test 5: Flag Fallback
**With flag disabled:**
1. Set `NEXT_PUBLIC_FF_LAYOUT_V1=false`
2. Reload `/descobrir`
3. Verify:
   - [ ] All previous emoji UI renders (🎨, 🔍, ⏱, 🌟, 📚, 🧸, 💚, 🤖, ❤️, 💾)
   - [ ] No AppIcon elements visible
   - [ ] Layout unchanged, no visual regressions
   - [ ] No console errors or hydration warnings

#### Test 6: Responsive & Accessibility
- [ ] Mobile (375px): Icons don't cause awkward text wrapping in buttons
- [ ] Tablet (768px): Quick picks buttons align properly
- [ ] Desktop (1024px+): All icons properly spaced
- [ ] Tab navigation works (icons are aria-hidden, text is focusable)
- [ ] Screen reader test: aria-hidden icons don't announce, button text is clear
- [ ] Keyboard navigation: buttons are keyboard accessible

#### Test 7: Performance
- [ ] Page loads without noticeable delay
- [ ] No layout shift due to icon rendering
- [ ] Network tab: no additional requests for icons (all inline SVG)
- [ ] Lighthouse score unchanged or improved

#### Test 8: Console Check
- [ ] No errors logged
- [ ] No hydration warnings
- [ ] No deprecation warnings from React/Next.js

## Files Summary

| File | Type | Changes |
|------|------|---------|
| components/ui/AppIcon.tsx | NEW | 53 lines, Lucide wrapper |
| app/(tabs)/descobrir/Client.tsx | MODIFIED | ~20 edits, ~60 lines affected |
| DISCOVER_LUCIDE_ICONS_PR.md | NEW | Documentation |

## Rollback Plan

If issues arise:
1. Keep `NEXT_PUBLIC_FF_LAYOUT_V1=false` in production (default)
2. Revert AppIcon component and Client.tsx changes
3. Feature flag ensures zero impact on users until explicitly enabled

## Success Criteria

✅ All tests pass with flag enabled
✅ Flag fallback works correctly  
✅ No hydration warnings or console errors
✅ Responsive on mobile/tablet/desktop
✅ Lighthouse score maintained
✅ Ready for main branch merge

## Next Steps

1. **Push changes** to cosmos-verse branch
2. **Create Draft PR** cosmos-verse → main
3. **Trigger Vercel Preview** with env var set
4. **Run tests** according to checklist above
5. **Collect screenshots/GIFs** for:
   - Page title + filters (flag on)
   - Suggestion card with star icon (flag on)
   - IA modal with icons (flag on)
   - Same sections with flag off (legacy UI)
6. **Approve & merge** when all tests pass
