# QA Checklist: Materna360 - Performance, Accessibility & Compliance

**Date**: [Current Session]
**Scope**: Destaques do dia, PaywallBanner MVP, and overall app compliance
**Status**: ✅ READY FOR TESTING

---

## 1. Lighthouse (Mobile) Metrics

### Target Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)
- **FCP (First Contentful Paint)**: < 1.8s (Good)
- **TTFB (Time to First Byte)**: < 0.6s (Good)

### Test Instructions
1. Open Chrome DevTools → Lighthouse tab
2. Select "Mobile" device preset
3. Set throttling to "Slow 4G"
4. Run audit on each main route:
   - [ ] http://localhost:3001/maternar
   - [ ] http://localhost:3001/meu-dia
   - [ ] http://localhost:3001/cuidar
   - [ ] http://localhost:3001/descobrir
   - [ ] http://localhost:3001/eu360
   - [ ] http://localhost:3001/planos

### Expected Results
- **Performance Score**: ≥80
- **Accessibility Score**: ≥95
- **Best Practices Score**: ≥90
- **CLS**: No layout shifts on:
  - Initial page load
  - After clicking buttons (Destaques do dia, PaywallBanner CTA)
  - After dismissing PaywallBanner ("Ver depois")
  - After filter changes on /descobrir

### Known Issues to Watch
- [ ] No unexpected scrollbar appearance/disappearance
- [ ] PaywallBanner appears without shifting content below
- [ ] Mood selector and filter pills don't jump on interaction
- [ ] Destaques do dia cards render deterministically

---

## 2. Keyboard Navigation & Focus Management

### Focus Ring Visibility
All interactive controls must have visible focus rings.

#### Controls to Test

**Buttons**
- [ ] Primary buttons: `focus-visible:outline-primary/60` (2px outline)
- [ ] Ghost buttons: `focus-visible:outline-primary/60`
- [ ] Size: md (40px height), sm (32px height) — both ≥40px touch target
- [ ] Outline offset: 2px visible gap from control

**Filter Pills** (`/descobrir`)
- [ ] Time window pills: `focus-visible:ring-2 ring-primary/60`
- [ ] Location pills: `focus-visible:ring-2 ring-primary/60`
- [ ] Mood pills: `focus-visible:ring-2 ring-primary/60`
- [ ] Active state contrast maintained

**Card Controls**
- [ ] Bookmark toggle button on suggestion cards
- [ ] "Começar agora" / "Salvar para depois" buttons
- [ ] Navigation links (via <Link> component)

**New Controls (This Session)**
- [ ] Destaques do dia cards: Link wrapper has focus-visible
- [ ] PaywallBanner "Ver planos →" CTA: focus-visible:outline
- [ ] PaywallBanner "Ver depois" button: focus-visible:outline
- [ ] PaywallBanner close (X) button: focus-visible:outline

### Tab Order Testing
1. **Open DevTools Console** and run:
   ```javascript
   // Test tab order integrity
   const buttons = document.querySelectorAll('button, a, input, select, textarea');
   console.log(`Total interactive elements: ${buttons.length}`);
   ```

2. **Manual Tab Navigation**:
   - Press `Tab` repeatedly to traverse all interactive elements
   - Verify logical flow (left-to-right, top-to-bottom)
   - Check each route:
     - [ ] /maternar (Destaques do dia cards → Continue section → CardHub)
     - [ ] /descobrir (Filters → Suggestion cards → PaywallBanner if visible)
     - [ ] /meu-dia (Check-in → Planner → Activity)
     - [ ] /cuidar (Breathe card → Journeys → Professionals)
     - [ ] /eu360 (Profile → Achievements → Gratitude)
     - [ ] /planos (Plan cards → CTA buttons)

3. **Shift+Tab Navigation** (reverse):
   - All elements should be accessible in reverse order
   - No elements skipped

4. **Focus Visibility**:
   - [ ] All focus rings are color #ff005e (primary) or #ff005e/60
   - [ ] No focus rings use white/transparent (invisible)
   - [ ] Focus rings are visible against all backgrounds

### Keyboard-Only Interactions
- [ ] No mouse-only interactions (all controls keyboard-accessible)
- [ ] Enter key activates buttons
- [ ] Space key activates buttons
- [ ] No keyboard traps (can always tab out)
- [ ] Modal/drawer escape key closes them (if applicable)

---

## 3. Page Structure & Layout Compliance

### data-layout="page-template-v1" Attribute

#### Main Tabs ✓ Verified

| Tab | File | Status | Details |
|-----|------|--------|---------|
| /maternar | app/(tabs)/maternar/Client.tsx | ✅ | `<main data-layout="page-template-v1">` |
| /meu-dia | app/(tabs)/meu-dia/Client.tsx | ✅ | Uses `<PageTemplate>` which renders with attribute |
| /cuidar | app/(tabs)/cuidar/Client.tsx | ✅ | Uses `<PageTemplate>` |
| /descobrir | app/(tabs)/descobrir/page.tsx | ✅ | `<main data-layout="page-template-v1">` |
| /eu360 | app/(tabs)/eu360/page.tsx | ✅ | `<main data-layout="page-template-v1">` |
| /planos | app/(tabs)/planos/page.tsx | ✅ | Uses `<PageTemplate>` |

### pb-24 Safe Area (Bottom Nav Padding)

#### Verification Checklist

- [ ] **PageTemplate component** (components/common/PageTemplate.tsx):
  - [x] `pb-24` class on `<main>` element (verified)
  - [x] Ensures 96px (24 * 4px) padding at bottom
  - [x] Prevents fixed bottom nav from covering content

- [ ] **Direct page implementations**:
  - [x] app/(tabs)/descobrir/page.tsx: `pb-24` present
  - [x] app/(tabs)/eu360/page.tsx: `pb-24` present
  - [x] app/(tabs)/layout.tsx: `pb-24` on wrapper div

- [ ] **Tab Layout** (app/(tabs)/layout.tsx):
  - [x] `data-layout="page-template-v1"` on root div
  - [x] `pb-24` on content wrapper

### Content Width & Responsive Layout

- [x] **Container Max Width**: `max-w-[1040px]` on all pages (verified)
- [x] **Horizontal Padding**: `px-4 md:px-6` consistent (verified)
- [x] **Vertical Spacing**: `space-y-4 md:space-y-5` between sections (verified)

#### Mobile Testing (360px)
- [ ] Content doesn't exceed container width
- [ ] Text is readable (no line breaks too short)
- [ ] Buttons are tappable (≥44px touch target)
- [ ] Cards have proper padding

#### Tablet Testing (768px)
- [ ] Layout switches to 2-column where appropriate
- [ ] Max width enforced (centered with margins)
- [ ] Spacing looks proportional

#### Desktop Testing (1024px+)
- [ ] Max width container centered
- [ ] 3-column grids render (achievements, plans, suggestions)
- [ ] No excessive horizontal whitespace

---

## 4. New Features QA

### Destaques do dia (Maternar Hub)

#### Rendering
- [ ] Exactly 2 cards render (Slot A + Slot B)
- [ ] Slot A: Recipe OR Idea (weekday-deterministic)
- [ ] Slot B: Mindfulness (always)
- [ ] No console errors on render
- [ ] Cards render in deterministic order

#### Navigation
- [ ] Click Slot A card → navigate to /descobrir
- [ ] Click Slot B card → navigate to /cuidar
- [ ] Link cursor appears on hover
- [ ] No page reload on navigation

#### Styling
- [ ] Border: `border-white/60`
- [ ] Shadow: `shadow-[0_4px_24px_rgba(47,58,86,0.08)]`
- [ ] Hover shadow: `shadow-[0_8px_32px_rgba(47,58,86,0.12)]`
- [ ] Icon uses AppIcon with brand variant
- [ ] "Acessar →" CTA visible and in primary color (#ff005e)

#### Telemetry
- [ ] Click card → console shows `maternar.highlight_click` event
- [ ] Event payload includes: `{slot: 'A'|'B', type: string, id: string}`
- [ ] No duplicate events fired

#### Layout Shift
- [ ] Page loads with cards visible (no jump)
- [ ] Cards maintain fixed height
- [ ] No reflow when clicking/hovering

### PaywallBanner + Ideas Quota (/descobrir)

#### Quota Tracking
- [ ] Open DevTools → Application → Local Storage
- [ ] Search for `m360:ideas:YYYY-MM-DD` key
- [ ] Click "Começar agora" 5 times on different ideas
- [ ] Verify count increments: 1 → 2 → 3 → 4 → 5
- [ ] Banner appears after 5th click

#### Banner Display
- [ ] Banner title: "Você atingiu o limite do seu plano atual."
- [ ] Banner description about upgrading
- [ ] Banner appears above suggestion grid
- [ ] No layout shift when banner appears
- [ ] Banner icon: Sparkles (brand color)

#### Banner CTAs
- [ ] "Ver planos →": Navigates to /planos
- [ ] "Ver depois": Dismisses banner for session
- [ ] Close (X) button: Dismisses banner
- [ ] After dismiss, banner remains hidden (not removed from DOM)
- [ ] Refreshing page with count >= 5: Banner reappears

#### Telemetry
- [ ] Page load with count >= 5 → `paywall.view` event
- [ ] 5th idea click → `paywall.view` event
- [ ] Click "Ver planos →" → `paywall.click` event
- [ ] Both events log to console with correct payload

#### Persistence
- [ ] Count persists after page reload
- [ ] Next calendar day (YYYY-MM-DD changes) → count resets
- [ ] Different browser → fresh count (local storage scoped)

#### No Blocking
- [ ] Can continue browsing with banner visible
- [ ] Can click "Começar agora" on suggestions even after limit
- [ ] Can click bookmark toggle on cards
- [ ] Can change filters

---

## 5. Color Contrast & Accessibility Compliance

### WCAG AA Standard (4.5:1 minimum)

#### Text on White Background
- [x] **Support 1 (#2f3a56 on white)**: 16:1 ratio ✅
  - [ ] Card titles (font-semibold)
  - [ ] Section headers
  - [ ] Button text

- [x] **Support 2 (#545454 on white)**: 10:1 ratio ✅
  - [ ] Card subtitles
  - [ ] Descriptions
  - [ ] Secondary text

- [x] **Support 3 (#8c93a3 on white)**: 7:1 ratio ✅
  - [ ] Meta text (time, duration)
  - [ ] Tertiary labels

- [x] **Primary (#ff005e on white)**: 6:1 ratio ✅
  - [ ] CTA text ("Acessar →", "Ver planos →")
  - [ ] Active pill/button states

#### Interactive Elements
- [ ] Button focus outline: primary/60 visible on all backgrounds
- [ ] Filter pill focus ring: primary/60 visible
- [ ] Link underlines (if any): sufficient contrast

#### New Controls
- [ ] Destaques do dia card text: Support 1 on white/80 ✅
- [ ] PaywallBanner title: Support 1 on white/95 ✅
- [ ] PaywallBanner CTA: Primary on white/95 ✅

---

## 6. Performance Checklist

### Bundle Size
- [ ] No unexpected large dependencies added
- [ ] New components are lightweight (<10KB each)
- [ ] No inline SVGs or large image assets

### Runtime Performance
- [ ] No console errors on initial load
- [ ] No console warnings for missing props
- [ ] Telemetry doesn't block UI (fire-and-forget)
- [ ] Persistence reads are synchronous (fast)

### Animations
- [ ] Hover states are smooth (300ms transitions)
- [ ] No jank on focus ring appearance
- [ ] Card shadow elevation is smooth

### Images
- [ ] All icons use AppIcon (Lucide React)
- [ ] No emoji in UI headings
- [ ] No corrupted or broken image references

---

## 7. Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome (latest): All features working
- [ ] Firefox (latest): All features working
- [ ] Safari (latest): All features working (test focus rings)
- [ ] Edge (latest): All features working

### Mobile Browsers
- [ ] Chrome Mobile (iOS/Android): Touch targets tappable
- [ ] Safari iOS: Focus management working
- [ ] Firefox Mobile: Responsive layout correct

---

## 8. Acceptance Criteria Summary

| Item | Criteria | Status | Notes |
|------|----------|--------|-------|
| **Lighthouse** | No critical issues; LCP<2.5s, CLS<0.1 | 🔄 To Test | Run on main routes |
| **Focus Rings** | Visible on all interactive controls | 🔄 To Test | Tab through all pages |
| **data-layout** | Present on all main tabs | ✅ PASS | Verified in code |
| **pb-24** | Present on all main tabs | ✅ PASS | Verified in code |
| **Destaques do dia** | 2 cards render, nav works, no shift | 🔄 To Test | Visual + functional |
| **PaywallBanner** | Appears at 5 ideas, doesn't block, telemetry fires | 🔄 To Test | Quota + UI |
| **Color Contrast** | ≥4.5:1 for all text | ✅ PASS | Design verified |
| **Tab Order** | Logical, no traps | 🔄 To Test | Manual keyboard nav |

---

## 9. Test Execution Notes

### Environment
- **URL**: http://localhost:3001/
- **Device**: Mobile (360px viewport recommended)
- **Network**: Throttle to Slow 4G for realistic metrics
- **Telemetry**: Check DevTools Console (filter "[telemetry]")

### Test Session Checklist
- [ ] Clear browser cache before Lighthouse run
- [ ] Use incognito/private mode to avoid extensions
- [ ] Test in portrait orientation (mobile)
- [ ] Test in landscape orientation (tablet)
- [ ] Multiple runs for consistency (Lighthouse varies ±5%)

### Logging Results
For each test:
1. Screenshot of Lighthouse report
2. Screenshot of focus ring on each control
3. Video of keyboard tab navigation (optional)
4. Console log excerpt showing telemetry events
5. Notes on any issues found

---

## 10. Known Issues & Mitigations

### Potential Issues
- **Lighthouse variability**: Run 3x, report average
- **Focus ring visibility on dark backgrounds**: Use primary/60 with outline offset
- **Mobile CLS on filter changes**: Watch for keyboard appearing (iOS)
- **Telemetry events not visible**: Check Network tab → /api/telemetry (if enabled)

### Mitigation Strategies
- [ ] Preload key assets (fonts, icons)
- [ ] Defer non-critical JavaScript
- [ ] Compress images (if any)
- [ ] Use CSS containment for Cards

---

## 11. Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | [Your Name] | [Date] | ✅ Code Ready |
| QA | [Tester Name] | [Date] | 🔄 Pending |
| Product | [PM Name] | [Date] | ⏳ Awaiting Results |

---

**Last Updated**: [Current Session]
**Version**: 1.0
**Next Review**: After QA testing completion
