# Hydration Error Fix - Complete Solution

## Problem Summary

React hydration errors were occurring on the `/eu360` route with the following symptoms:
- Warning: "Did not expect server HTML to contain a <%s> in <%s>"
- Error: "Hydration failed because the initial UI does not match what was rendered on the server"
- Error trace pointed to `CoachSuggestionCard` wrapped in `HydrationGate`

## Root Cause Analysis

The errors were caused by **server/client rendering mismatches** in three locations:

### 1. `Eu360Client` (app/(tabs)/eu360/Client.tsx)
**Issue**: The `CoachSuggestionCard` was conditionally rendered using `isClientEnabled('FF_COACH_V1')`:
```typescript
{isClientEnabled('FF_COACH_V1') && <CoachSuggestionCard ... />}
```

The `isClientEnabled()` function from `app/lib/flags.client.ts` checks `window`, which:
- Returns `false` on server (window is undefined)
- Returns `true` on client (window exists, flag is in defaultsOn list)

Result: Component renders on client but not on server → **hydration mismatch**

### 2. `CoachSuggestionCard` (components/coach/CoachSuggestionCard.tsx)
**Issue**: Used `HydrationGate` to render fallback skeleton on server:
```typescript
<HydrationGate
  fallback={<div className="..." style={{ minHeight: 96 }} />}
>
  <InnerCoachSuggestionCard {...props} />
</HydrationGate>
```

Problem: The fallback is a simple div, but the actual content is a complex component with:
- SoftCard with multiple children
- Buttons with event handlers
- State management with hooks
- Drawers and tooltips

Result: Server HTML (simple div) doesn't match client HTML (complex component) → **hydration failure**

### 3. `export/page.tsx` & `EmotionTrendDrawer.tsx`
**Issue**: Similar HydrationGate usage with mismatched fallback content

## Solution Implemented

### 1. Created `ClientOnly` Component
**File**: `components/common/ClientOnly.tsx`

A proper client-only wrapper that:
- Returns `null` (or fallback) on server → **no HTML rendered**
- Returns children only after hydration on client

```typescript
'use client';
export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children : fallback ?? null;
}
```

### 2. Updated `Eu360Client`
**Change**: Wrapped the conditional `CoachSuggestionCard` block in `ClientOnly`

```typescript
<ClientOnly>
  {isClientEnabled('FF_COACH_V1') && (
    <CoachSuggestionCard ... />
  )}
</ClientOnly>
```

**Effect**: 
- Server: Renders nothing (no HTML from this section)
- Client: Renders `CoachSuggestionCard` after hydration
- Result: **No mismatch** ✓

### 3. Simplified `CoachSuggestionCard`
**Change**: Removed `HydrationGate` wrapper, now returns component directly

```typescript
export default function CoachSuggestionCard(props: any) {
  return <InnerCoachSuggestionCard {...props} />;
}
```

**Benefit**: Since it's now wrapped in `ClientOnly` at the parent level, it always renders in a client context

### 4. Fixed Export Page
**Change**: Replaced `HydrationGate` with `ClientOnly` wrapping entire export content

**Benefit**: 
- Server: Renders nothing
- Client: Renders full PDF export page with client-dependent date formatting

### 5. Fixed EmotionTrendDrawer
**Change**: Replaced `HydrationGate` with `ClientOnly` wrapping drawer dialog

**Benefit**: Eliminates mismatch between server fallback and client dialog structure

## Key Principles Applied

1. **Server Stability**: Server renders consistent, simple HTML structure
2. **Client Hydration**: Client receives exact same HTML before rendering updates
3. **Conditional Rendering**: Use `ClientOnly` instead of flag checks that differ between server/client
4. **No Fallback Mismatches**: When using wrapper components, fallback must exactly match final structure

## Files Modified

| File | Change | Impact |
|------|--------|--------|
| `components/common/ClientOnly.tsx` | Created | New utility component |
| `app/(tabs)/eu360/Client.tsx` | Add ClientOnly wrapper | Prevents CoachCard mismatch |
| `components/coach/CoachSuggestionCard.tsx` | Remove HydrationGate | Simplified, safer |
| `app/(tabs)/eu360/export/page.tsx` | Replace HydrationGate | Fixes export page hydration |
| `components/ui/EmotionTrendDrawer.tsx` | Replace HydrationGate | Fixes drawer hydration |

## Testing Checklist

- [ ] Navigate to `/eu360` - no hydration errors in console
- [ ] Coach suggestion card renders on client without warnings
- [ ] PDF export page loads without hydration errors
- [ ] Emotion trend drawer opens without warnings
- [ ] All features work as expected (coaching tips, exports, etc.)
- [ ] No console warnings about "Did not expect server HTML..."

## Notes

- `suppressHydrationWarning` attributes left in place on other components (ProfileForm, AchievementsCounter, etc.) don't hurt
- These are legitimate SSR/client differences and are properly gated
- The root issue (flag checking + HydrationGate mismatch) has been addressed
