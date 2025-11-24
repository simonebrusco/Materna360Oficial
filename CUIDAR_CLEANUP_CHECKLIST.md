# Cuidar Cleanup – Implementation Checklist & Testing Guide

## ✅ Implementation Complete

### Files Changed
- **Created:** `components/ui/ProfessionalProfileSheet.tsx` (206 lines)
- **Deleted:** `components/blocks/MentorshipBlock.tsx` (removed)
- **Modified:**
  - `app/(tabs)/cuidar/page.tsx` (removed MentorshipBlock import + section)
  - `components/support/ProfessionalCard.tsx` (added modal callback, FF gating)
  - `components/support/ProfessionalsResults.tsx` (added modal state + wiring)

### Key Integration Points
✅ ProfessionalProfileSheet created with full Professional type
✅ ProfessionalCard updated to support modal callback + legacy fallback
✅ ProfessionalsResults wired with modal state management
✅ Cuidar page cleaned (mentorship block removed)
✅ All features gated behind FF_LAYOUT_V1
✅ No new environment variables required
✅ TypeScript types fully defined

---

## 🧪 Testing Checklist (Manual)

### 1. Page Loads & Layout
- [ ] Navigate to `/cuidar` in Preview
- [ ] Page loads without errors
- [ ] Mentorship 4-card block is NOT visible
- [ ] Sections appear in order:
  - Hero ("3 minutos agora")
  - Breath Timer
  - Mindfulness
  - Organization Tips
  - Care Journeys
  - Professionals List
- [ ] Root gradient visible at top
- [ ] Safe area (pb-24) visible at bottom (above nav bar)

### 2. Professionals List Rendering
- [ ] Search/Filter section displays correctly
- [ ] Professional cards load and display properly
- [ ] Each card shows:
  - Avatar image (rounded, 56px)
  - Name
  - Specialty
  - Bio (2 lines max)
  - Badges: "Online", optional "Verificado Materna360", optional "Primeira avaliação gratuita"
  - Tags/Chips (max 4 visible)
  - "Ver perfil" button
  - "Vamos conversar?" button (if WhatsApp URL) or "Agenda por mensagem" text

### 3. Modal Trigger (Mobile - 375px width)
- [ ] Tap "Ver perfil" on any professional card
- [ ] **Modal slides up from bottom** (bottom sheet with `rounded-t-3xl`)
- [ ] Overlay appears (semi-transparent black)
- [ ] Modal shows:
  - Avatar (larger, 64px with border)
  - Name in bold
  - Specialty in small text, primary color
  - Price hint (if available) in small text
  - Badges (with ✓ prefix):
    - "✓ Verificado Materna360" (if verificado)
    - "✓ Online" (always)
    - "✓ Primeira avaliação gratuita" (if applicable)

### 4. Modal Content (Mobile & Desktop)
- [ ] Modal body shows:
  - **Sobre** section header
  - Bio text (readable, wrapped)
  - Card with location info:
    - "📍 Local: Atendimento online"
    - "🏙️ Baseado em: [City]" (if available)
  - **Especialidades** section header (if tags exist)
  - Tags/chips displayed: `#Amamentacao`, `#Sono`, etc. (max 6 shown)

### 5. Footer Buttons (Sticky)
- [ ] **"← Voltar"** button (secondary, gray)
- [ ] **"📞 Agendar"** button (primary, pink)
- [ ] Both buttons are 100% width on mobile, flex-1 on desktop
- [ ] Sticky to bottom of modal

### 6. Agendar Button Behavior
#### Scenario A: WhatsApp URL Configured
- [ ] Click "Agendar"
- [ ] WhatsApp opens in new tab
- [ ] Modal closes automatically

#### Scenario B: Calendly URL Configured (no WhatsApp)
- [ ] Click "Agendar"
- [ ] Calendly opens in new tab
- [ ] Modal closes automatically

#### Scenario C: No URLs Configured
- [ ] Click "Agendar"
- [ ] UpsellSheet overlay appears over modal
- [ ] UpsellSheet shows:
  - Title: "Agendar com [Professional Name]"
  - Description: Portuguese text about WhatsApp/Calendly
  - Plan: "Plus ou Premium"
  - Features: 4 benefits listed
  - "Agora não" button (secondary)
  - "Ver Planos" button (primary)
- [ ] Click "Ver Planos" → navigates to `/planos`
- [ ] Click "Agora não" → UpsellSheet closes, back to profile modal

### 7. Modal Close Behavior
- [ ] Click "← Voltar" button → Modal closes
- [ ] Click outside modal (overlay) → Modal closes
- [ ] After close, professionals list is visible again, scrollable

### 8. Desktop Behavior (1024px+)
- [ ] Click "Ver perfil"
- [ ] **Modal centers on screen** (not bottom sheet)
- [ ] `rounded-3xl` corners (not just top corners)
- [ ] Modal is max-w-md (448px)
- [ ] Overlay works the same
- [ ] All content readable
- [ ] Buttons same width, side-by-side layout (flex-row)
- [ ] Scrollable content if bio/tags overflow

### 9. Feature Flag Toggle
#### With FF_LAYOUT_V1=true
- [ ] "Ver perfil" is a `<button>`
- [ ] Clicking it opens modal
- [ ] Professional data flows through modal

#### With FF_LAYOUT_V1=false
- [ ] "Ver perfil" is an `<a>` link
- [ ] Clicking it navigates to `/profissionais/{id}`
- [ ] No modal appears
- [ ] Page doesn't break

### 10. No Hydration Warnings
- [ ] Open browser DevTools → Console
- [ ] Navigate through `/cuidar`
- [ ] Open/close modal multiple times
- [ ] ⚠️ No "Hydration mismatch" errors

### 11. Responsiveness
- [ ] Mobile (375px): Modal slides up, buttons stack, tags wrap
- [ ] Tablet (768px): Modal still mobile sheet, slightly wider
- [ ] Desktop (1024px): Modal centered, side-by-side buttons
- [ ] Extra-wide (1440px): Modal stays max-w-md, centered

### 12. Accessibility
- [ ] Tab through "Ver perfil" buttons → focus visible
- [ ] Tab through modal → can tab "← Voltar" and "📞 Agendar"
- [ ] Screen reader: "Ver perfil de [Name]" (aria-label)
- [ ] Overlay clickable: closes modal
- [ ] Buttons have focus ring (blue outline on primary/secondary buttons)

---

## 🐛 Debugging Tips

### Modal Doesn't Appear
1. Check browser console for errors
2. Verify FF_LAYOUT_V1=true in env
3. Verify ProfessionalCard has `onProfileOpen` prop passed
4. Check if `selectedProfile` state is being set (DevTools → React Profiler)

### Buttons Don't Work
1. Verify WhatsApp URL format: `https://wa.me/5511999999999`
2. Verify Calendly URL format: `https://calendly.com/username`
3. Test UpsellSheet fallback (set both URLs to undefined in code)

### Styling Issues
1. Check if Tailwind is compiling (browser DevTools → Elements → computed styles)
2. Verify border/shadow classes are applied: `border-white/60`, `shadow-[0_4px_24px...]`
3. Check mobile viewport: DevTools → Device toolbar (375px)

### List Doesn't Update
1. Reload page (⌘R or Ctrl+R)
2. Check if API is returning `calendlyUrl` field
3. If API needs update, add to response:
   ```json
   {
     "calendlyUrl": "https://calendly.com/professional"
   }
   ```

---

## 🎨 Visual Inspection

### Checklist
- [ ] Avatar border is subtle (border-white/80, no pink)
- [ ] Header gradient goes from pink (#FFE5EF) to white smoothly
- [ ] Badges are primary color pills (border-primary/20, bg-primary/5, text-primary)
- [ ] Body card has neutral shadow: `shadow-[0_4px_24px_rgba(47,58,86,0.08)]`
- [ ] Footer is sticky, slightly transparent white background
- [ ] No pink glows anywhere (only neutral shadows)
- [ ] Typography matches `/cuidar` style (fonts, sizes, weights)

---

## 📊 Coverage Summary

### Routes Tested
- [ ] `/` – No changes
- [ ] `/meu-dia` – No changes
- [ ] `/cuidar` – Mentorship removed, modal added
- [ ] `/descobrir` – No changes
- [ ] `/eu360` – No changes (mentorship text in pricing remains)
- [ ] `/planos` – No changes (from Batch 2)

### Components Tested
- [ ] ProfessionalCard (modal callback + legacy link)
- [ ] ProfessionalsResults (modal state + wiring)
- [ ] ProfessionalProfileSheet (modal rendering)
- [ ] UpsellSheet (fallback for missing URLs)
- [ ] ProfessionalsSection (parent container)

### Features Gated by FF_LAYOUT_V1
- ✅ ProfessionalProfileSheet rendering
- ✅ "Ver perfil" button opens modal (when FF enabled)
- ✅ All modal interactions
- ✅ UpsellSheet inside modal

---

## 📋 Submission Checklist

Before submitting PR:
- [ ] All test cases above pass
- [ ] No hydration warnings
- [ ] No console errors
- [ ] TypeScript compiles (pnpm exec tsc --noEmit)
- [ ] Build succeeds (pnpm run build)
- [ ] Screenshots captured:
  1. `/cuidar` page (showing no mentorship block)
  2. Modal open on mobile (bottom sheet)
  3. Modal open on desktop (centered)
  4. UpsellSheet after "Agendar" (no URLs)
- [ ] PR description includes:
  - Summary of changes
  - Before/after behavior
  - Feature flag notes
  - Testing results

---

## 🚀 Deployment Notes

### Preview/Staging
1. Ensure `NEXT_PUBLIC_FF_LAYOUT_V1=true` in environment
2. Configure professionals API to include `calendlyUrl` (if not already)
3. Verify WhatsApp URLs are valid

### Production Rollout
- [ ] Start with FF_LAYOUT_V1=true in staging
- [ ] Run smoke tests
- [ ] Monitor for errors (Sentry/logs)
- [ ] Can toggle off instantly if needed (set FF=false)
- [ ] No database migrations required
- [ ] No new secrets or keys needed

### Rollback Plan
If issues arise:
1. Set `NEXT_PUBLIC_FF_LAYOUT_V1=false`
2. "Ver perfil" reverts to legacy `/profissionais/{id}` links
3. Modal never renders
4. No user data affected

---

## 📞 Support

### If modal doesn't open:
1. Check Console: errors about `ProfessionalProfileSheet`?
2. Verify `isEnabled('FF_LAYOUT_V1')` returns true
3. Check `ProfessionalCard` receives `onProfileOpen` prop

### If button clicks do nothing:
1. Verify WhatsApp/Calendly URLs are valid
2. Check if URLs are `undefined` → should show UpsellSheet
3. Inspect network tab: are requests being made?

### If styling looks wrong:
1. Hard refresh browser (⌘+Shift+R or Ctrl+Shift+R)
2. Clear `.next` folder and rebuild (if local)
3. Check Tailwind config: ensure shadow utilities are included

---

**Last Updated:** Today
**Branch:** cosmos-verse
**Status:** Ready for Testing ✅
