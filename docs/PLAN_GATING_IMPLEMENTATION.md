# Plan Gating System Implementation

## Overview

A lightweight local plan system has been implemented to gate premium features in Materna360 (v0.2.0-p2-staging1).

### Files Created/Modified

- **NEW**: `app/lib/plan.ts` - Core plan utilities
- **NEW**: `app/lib/premiumGate.ts` - Feature gating helpers
- **MODIFIED**: `app/(tabs)/eu360/components/ExportBlock.tsx` - PDF export gating
- **MODIFIED**: `components/pdf/ExportButton.tsx` - PDF button gating

## Core API

### `app/lib/plan.ts`

```typescript
import { isPremium, getPlan, setPlan, upgradeToPremium } from '@/app/lib/plan'

// Check if user is premium
if (isPremium()) {
  // Show premium feature
}

// Get current plan ('free' | 'premium')
const plan = getPlan()

// Set plan (fires telemetry event)
setPlan('premium')

// Upgrade to premium (fires confirmation telemetry)
upgradeToPremium()
```

### `app/lib/premiumGate.ts`

```typescript
import { canAccessPremium, gatePremiumAction } from '@/app/lib/premiumGate'

// Simple access check
if (canAccessPremium('pdf_export', 'eu360')) {
  // Feature allowed
}

// Detailed gating with message
const gate = gatePremiumAction('pdf_export', 'eu360')
if (!gate.allowed) {
  showPaywall(gate.message)
}
```

## Usage Examples

### Example 1: Conditional Rendering

```tsx
'use client'

import { isPremium } from '@/app/lib/plan'

export function MyFeature() {
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  useEffect(() => {
    setIsPremiumUser(isPremium())
  }, [])

  return (
    <>
      {isPremiumUser ? (
        <PremiumFeature />
      ) : (
        <PaywallBanner message="Este recurso é premium" />
      )}
    </>
  )
}
```

### Example 2: Feature Gating with Telemetry

```tsx
'use client'

import { canAccessPremium } from '@/app/lib/premiumGate'
import { track } from '@/app/lib/telemetry'

export function ExportButton() {
  const handleClick = () => {
    if (!canAccessPremium('pdf_export', 'report')) {
      return // Telemetry already fired
    }
    
    // Proceed with premium action
    exportPDF()
  }

  return <button onClick={handleClick}>Export</button>
}
```

## Telemetry Events

The system automatically tracks the following events:

### `paywall_open`
Fired when a non-premium user attempts to access a premium feature.

```json
{
  "feature": "pdf_export",
  "context": "eu360"
}
```

### `paywall_confirm`
Fired when a user confirms a plan upgrade.

```json
{
  "plan": "premium",
  "source": "plan_upgrade_button",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### `plan_upgrade_attempt`
Fired when plan is changed.

```json
{
  "from": "free",
  "to": "premium",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Plan Storage

Plans are stored in localStorage with the key `m360.plan`:

```typescript
localStorage.getItem('m360.plan') // Returns: 'free' | 'premium'
localStorage.setItem('m360.plan', 'premium')
```

## Migration Guide

To add plan gating to an existing feature:

1. Import the plan utilities:
   ```typescript
   import { isPremium } from '@/app/lib/plan'
   import { canAccessPremium } from '@/app/lib/premiumGate'
   ```

2. Use in conditional rendering:
   ```tsx
   {isPremium() ? <Feature /> : <Paywall />}
   ```

3. Or use gating for actions:
   ```typescript
   const handleAction = () => {
     if (!canAccessPremium('feature_name', 'context')) return
     // Proceed with feature
   }
   ```

## Development & Testing

### Enable Premium Locally

```javascript
// In browser console
localStorage.setItem('m360.plan', 'premium')
location.reload()
```

### View Telemetry Events

```javascript
// In browser console
const events = JSON.parse(localStorage.getItem('m360_telemetry_local'))
console.table(events)
```

### Reset to Free Plan

```javascript
localStorage.removeItem('m360.plan')
location.reload()
```

## Components Using Plan Gating

- `app/(tabs)/eu360/components/ExportBlock.tsx` - PDF export (premium-only)
- `components/pdf/ExportButton.tsx` - PDF button (premium-only)

## Future Enhancements

- Integration with payment provider (Stripe, etc.)
- Server-side plan validation
- Plan tier levels (free, plus, premium)
- Feature-level limits per tier
- Auto-expire premium trial
