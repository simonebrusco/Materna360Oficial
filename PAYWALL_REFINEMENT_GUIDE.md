# Paywall & Plans Page Refinement - Complete Guide

## Overview
The /planos page and paywall gates have been refined following P0 specifications:
- ✅ Clear feature tables (3 bullets per tier, expandable)
- ✅ Soft paywall gates (never block flow, always have "see later" CTA)
- ✅ PaywallBanner component for feature limits
- ✅ Full telemetry tracking (paywall.view, paywall.click)
- ✅ Consistent soft-luxury design

---

## Files Created & Modified

### 1. **New: `components/ui/PaywallBanner.tsx`** (101 lines)
**Purpose:** Soft paywall banner for feature limits

```typescript
import { PaywallBanner } from '@/components/ui/PaywallBanner'

<PaywallBanner
  title="Você atingiu seu limite diário"
  description="No plano Gratuito, você tem até 3 ideias por dia. Volte amanhã ou explore nossos planos."
  featureName="Gerador de Ideias"
  upgradeText="Conheça os planos"
  variant="warning"
  onUpgradeClick={() => navigateTo('/planos')}
  onDismiss={() => logEvent('banner_dismissed')}
/>
```

**Features:**
- ✅ Non-blocking (always dismissible)
- ✅ "Ver depois" CTA (soft dismissal)
- ✅ Close button (X)
- ✅ Optional variant: 'info' (blue) or 'warning' (yellow)
- ✅ Fire-and-forget integration
- ✅ Soft-luxury styling (Card, AppIcon, soft shadows)

---

### 2. **Updated: `components/ui/FeatureGate.tsx`**
**Changes:** Added soft dismissal with "Ver depois" button

```typescript
// Before: No dismissal option, permanent blur
// After: Can dismiss with "Ver depois" button, shows dimmed content

<FeatureGate
  featureKey="ideas.dailyQuota"
  currentPlan="Free"
  onUpgradeClick={() => navigateTo('/planos')}
>
  <IdeasPanel />
</FeatureGate>
```

**Key Changes:**
- Added state: `dismissed` flag
- New button: "Ver depois" → dismisses overlay, dims content
- Styling: Updated to match soft-luxury (rounded-[var(--radius-card)], border-white/60, shadow-[0_4px_24px...])
- Behavior: Never fully blocks, users can still see dimmed content

**Design:**
```
Before:
┌──────────────────────┐
│ [Blur Overlay Modal]  │  ← Modal centered
│ "Conheça os planos"  │
└──────────────────────┘

After:
┌──────────────────────┐
│ [Blur Overlay Modal]  │  ← Same modal
│ "Conheça os planos"  │
│ "Ver depois"         │  ← New soft dismiss
└──────────────────────┘
→ Then shows dimmed content below (not fully blocked)
```

---

### 3. **Updated: `app/(tabs)/planos/page.tsx`** (345 lines)
**Complete refinement of the plans page**

#### New Structure
```
┌─────────────────────────────────────┐
│         PageTemplate                │
│  ├─ Title: "Planos que Crescem..."  │
│  ├─ Subtitle: "Escolha o plano..."  │
│  │                                  │
│  ├─ [PaywallBanner] (optional)      │
│  │                                  │
│  ├─ PageGrid (3 cols)               │
│  │  ├─ Card: Gratuito               │
│  │  ├─ Card: Plus (highlighted)     │
│  │  └─ Card: Premium (highlighted)  │
│  │                                  │
│  ├─ Info Card                       │
│  │                                  │
│  ├─ FAQ Section (3 items)           │
│  │                                  │
│  └─ Contact Support CTA             │
└─────────────────────────────────────┘
```

#### Key Features

**Feature Tables (3 bullets per tier):**
```typescript
const PLANS = [
  {
    name: 'Gratuito',
    features: [                     // ← 3 key features (highlighted)
      'Registrar humor e atividades',
      '3 questões IA por semana',
      'Receitas e dicas de organização',
    ],
    fullFeatures: [                 // ← All features (expandable)
      'Registrar humor e atividades',
      'Responder a 3 questões IA por semana',
      'Acessar receitas e dicas de organização',
      'Comunidade e suporte básico',
      'Modo escuro e lembretes',
    ],
  },
  // ... Plus and Premium similarly structured
]
```

**Expandable Features:**
- Shows 3 key features by default
- Button: "+ 2 mais" (expandable)
- Click to reveal full feature list
- Divider line between key and full features

**Badge System:**
```
Gratuito:  "Sua opção atual"  (gray)
Plus:      "Popular"          (primary color, ring)
Premium:   "Melhor valor"     (primary color, ring)
```

**Visual Hierarchy:**
- Primary plans (Plus/Premium): Ring, gradient background, brand colors
- Free plan: Minimal styling, subtle colors
- AppIcon for each tier (place, star, crown)

---

## Telemetry Integration

### Events Tracked

#### 1. Page View
```typescript
// Fired on page mount
track({
  event: 'paywall.view',
  payload: { page: 'plans_overview' }
})
```

#### 2. Upgrade Click
```typescript
// Fired on plan CTA button click
track({
  event: 'paywall.click',
  action: 'upgrade_click',
  id: 'plus',  // or 'premium'
  payload: { plan: 'plus' }
})
```

#### 3. Support Contact Click
```typescript
// Fired on contact support CTA
track({
  event: 'paywall.click',
  action: 'contact_support',
  payload: { context: 'plans_page' }
})
```

### Viewing Events in Console
```javascript
// Dev mode: Check browser console → Debug tab
// Look for: [telemetry] paywall.view, paywall.click

// Production mode: Check /api/telemetry endpoint logs
```

---

## Soft Paywall Design Principles

### Never Block User Flow
✅ Feature gates always have "Ver depois" dismissal
✅ PaywallBanner always dismissible
✅ Dimmed content still visible/readable
✅ No dead-end UX

### Always Provide "See Later" CTA
✅ FeatureGate: "Ver depois" button
✅ PaywallBanner: "Ver depois" + Close (X) button
✅ Plans page: Direct upgrade path (no gate)

### Non-Intrusive Styling
✅ Soft borders (border-white/60)
✅ Subtle shadows (0 4px 24px rgba(...,0.08))
✅ Soft gradient backgrounds (primary/5, secondary/5)
✅ No harsh colors or blocking overlays
✅ Consistent with app design language

### Graceful Degradation
✅ Gate: Blur overlay removable, content dims but visible
✅ Banner: Dismiss button, content still functional
✅ Plans: Clear feature comparison, no surprises

---

## Usage Examples

### Example 1: Feature Gate with Soft Dismissal
```typescript
import { FeatureGate } from '@/components/ui/FeatureGate'

function IdeasPanel() {
  return (
    <FeatureGate
      featureKey="ideas.dailyQuota"
      currentPlan={userPlan}
      onUpgradeClick={() => router.push('/planos')}
    >
      <div>
        <h2>Gerar Ideias</h2>
        <p>Você já gerou 3 ideias hoje. Volte amanhã ou atualize seu plano.</p>
      </div>
    </FeatureGate>
  )
}
```

### Example 2: PaywallBanner for Quota Exceeded
```typescript
import { PaywallBanner } from '@/components/ui/PaywallBanner'

function MeuDiaClient() {
  const [quotaExceeded, setQuotaExceeded] = useState(false)

  return (
    <div>
      {quotaExceeded && (
        <PaywallBanner
          title="Limite de ideias atingido"
          description="Você usou suas 3 ideias diárias. Volte amanhã ou explore nossos planos."
          featureName="Gerador de Ideias"
          variant="warning"
          onUpgradeClick={() => {
            track({ event: 'paywall.click', action: 'upgrade_from_banner', id: 'banner' })
            router.push('/planos')
          }}
          onDismiss={() => track({ event: 'paywall.click', action: 'banner_dismissed' })}
        />
      )}
      {/* Rest of content */}
    </div>
  )
}
```

### Example 3: Plans Page with Telemetry
```typescript
// Already integrated in /planos/page.tsx
// - paywall.view fired on mount
// - paywall.click fired on upgrade buttons
// - No additional code needed
```

---

## Design Token Integration

All components use soft-luxury tokens:

| Element | Token |
|---------|-------|
| Border | `border-white/60` |
| Shadow | `shadow-[0_4px_24px_rgba(47,58,86,0.08)]` |
| Hover shadow | `shadow-[0_8px_32px_rgba(47,58,86,0.12)]` |
| Radius | `rounded-[var(--radius-card)]` = 20px |
| Primary color | `#ff005e` |
| Accent | `#ffd8e6` |
| Text (dark) | `#2f3a56` (text-support-1) |
| Text (muted) | `#545454` (text-support-2) |

---

## Responsive Design

**Mobile (360px):**
- Full-width cards (1 column)
- Stacked features
- Readable text sizes
- Touch-friendly buttons (40px+ height)

**Tablet (768px):**
- 2-column layout (for 3 plans, 2+1 split)
- Expanded spacing
- Larger icon sizes

**Desktop (1024px+):**
- 3-column layout
- Max-width container (1040px)
- Optimal spacing

---

## Testing Checklist

### Visual Testing
- [ ] /planos page loads with PageTemplate layout
- [ ] Badge system visible (Sua opção atual, Popular, Melhor valor)
- [ ] Feature expansion works (click "+ 2 mais")
- [ ] Primary plans highlighted (Plus/Premium with ring + gradient)
- [ ] Responsive at 360px, 768px, 1024px

### Telemetry Testing
- [ ] paywall.view event fires on page load (check console)
- [ ] paywall.click event fires on upgrade button
- [ ] paywall.click event fires on contact support button
- [ ] Events include correct payload data

### Gate Testing
- [ ] FeatureGate shows blur overlay + modal
- [ ] "Ver depois" button dismisses overlay
- [ ] "X" close button works
- [ ] Dimmed content visible after dismissal
- [ ] "Conheça os planos" CTA navigates to /planos

### Banner Testing
- [ ] PaywallBanner renders when showBanner=true
- [ ] "Ver depois" button dismisses banner
- [ ] "X" close button works
- [ ] "Conheça os planos" CTA works
- [ ] Variant styles apply correctly (info/warning)

### Mobile Testing
- [ ] Touch targets ≥40px
- [ ] Text readable without zoom
- [ ] Cards stack properly
- [ ] No horizontal scroll
- [ ] Safe area (pb-24) respected

---

## FAQ

### Q: Will gates block users forever?
**A:** No. Users can dismiss with "Ver depois" and see dimmed content. Gates are soft and non-blocking.

### Q: Can PaywallBanner be dismissed?
**A:** Yes. Both "Ver depois" button and "X" close button dismiss it. State managed by parent component.

### Q: How are telemetry events tracked?
**A:** Via the `track()` function from `telemetry-track.ts`. Events post to console (dev) or /api/telemetry (prod).

### Q: Is the /planos page visually consistent with other tabs?
**A:** Yes. It uses:
- PageTemplate wrapper (like /meu-dia, /cuidar, /descobrir, /eu360)
- data-layout="page-template-v1" attribute
- PageGrid for responsive layout
- Card component for containers
- Soft-luxury design tokens

### Q: What if users never click upgrade?
**A:** That's fine. They can use the app with free plan features. Gates/banners are informational, not blocking.

---

## Next Steps

1. **Test in production:**
   - Verify telemetry events flow to analytics
   - Check checkout URL environment variables are set
   - Monitor user engagement on /planos

2. **Monitor metrics:**
   - Track paywall.view → paywall.click conversion rate
   - Track gate dismissals (Ver depois clicks)
   - Track upgrade click sources

3. **Iterate:**
   - Based on data, adjust CTA copy, banner timing, etc.
   - A/B test different messaging
   - Refine feature descriptions

4. **Integrate in other tabs:**
   - Add PaywallBanner when users hit feature limits
   - Use FeatureGate for premium features
   - Track paywall events from all sources

---

## Summary

✅ **Complete P0 paywall refinement:**
- Feature tables with clear 3-bullet highlights
- Soft gates with always-available "see later" option
- PaywallBanner component for feature limits
- Full telemetry tracking (paywall.view, paywall.click)
- Consistent soft-luxury design across entire flow
- Zero user blockers, graceful degradation

**Ready for production with clear upgrade path and non-intrusive UX.**
