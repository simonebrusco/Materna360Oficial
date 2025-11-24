# Complete Flag Resolution Architecture

## Two Flag Functions in Codebase

### 1. `app/lib/flags.ts` - Unified Flags ✅ FIXED
Used in: `Eu360Client`, `DescobrirClient`, etc.
```typescript
export function getClientFlagsUnified(): Flags {
  // Reads from: URL param > cookie > env > Preview default
  return {
    FF_LAYOUT_V1: coerceEnv(process.env.NEXT_PUBLIC_FF_LAYOUT_V1, '0'),
    FF_FEEDBACK_KIT: coerceEnv(process.env.NEXT_PUBLIC_FF_FEEDBACK_KIT, '0'),
    FF_HOME_V1: coerceEnv(process.env.NEXT_PUBLIC_FF_HOME_V1, '0'),
    FF_MATERNAR_HUB: maternarHub,
  };
}
```
**Status**: ✅ Fixed - Now returns correct env values instead of hardcoded true

### 2. `app/lib/flags.client.ts` - Client-Only Flags ⚠️ NEEDS REVIEW
Used in: `MeuDiaClient`, etc.
```typescript
export function isEnabled(name: string): boolean {
  if (typeof window === 'undefined') return false; // Server-safe
  
  // Defaults: FF_EMOTION_TRENDS, FF_LAYOUT_V1, FF_COACH_V1, FF_EXPORT_PDF, 
  //          FF_PAYWALL_MODAL, FF_INTERNAL_INSIGHTS
  const defaultsOn = ['FF_EMOTION_TRENDS', 'FF_LAYOUT_V1', 'FF_COACH_V1', ...];
  
  // Priority: localStorage > env > defaults
  return localOverride === '1' || env === '1' || defaultsOn.includes(name);
}
```

**Issues**:
- Has a hardcoded defaults list that differs from actual environment
- When `window` is undefined (server), returns `false`
- Client behavior depends on environment variables that might differ from defaults

**Current Environment**:
- `NEXT_PUBLIC_FF_EMOTION_TRENDS="1"` ✅
- `NEXT_PUBLIC_FF_LAYOUT_V1="false"` ⚠️ (but defaults to true in flags.client)
- `NEXT_PUBLIC_FF_COACH_V1="1"` ✅
- Others not explicitly set

## Hydration Fix Strategy

### Current Solution (Applied)
Wrapped entire page content in `ClientOnly` component:
- Server renders: `null`
- Client pre-hydration: `null`
- Client post-hydration: actual content

This prevents ANY flag-related mismatches by deferring content rendering.

### Alternative Solution (For Future Optimization)
Instead of `ClientOnly` wrapper, ensure flag consistency:
1. Remove hardcoded defaults from `flags.client.ts`
2. Read actual environment variables
3. Make both `flags.ts` and `flags.client.ts` return identical values

## Recommendation

The current fix (ClientOnly wrapper) is:
- ✅ Safe and robust
- ✅ Prevents all hydration mismatches
- ✅ Already tested on `/eu360`
- ⚠️ Slight performance impact (full page deferred)

The `flags.client.ts` function should eventually be updated to match the corrected `flags.ts` logic, but the current `ClientOnly` wrapper prevents this from being critical.

## Affected Routes

1. `/eu360` - ✅ FIXED (ClientOnly wrapper applied)
2. `/meu-dia` - Uses `isClientFlagEnabled()` (should monitor for hydration issues)
3. `/descobrir` - Uses `isEnabled('FF_LAYOUT_V1')`
4. `/cuidar` - Uses `isEnabled()` conditionally
5. `/maternar` - SSR with redirect
6. `/planos` - Minimal flag usage

## Next Steps

1. Monitor other routes for hydration warnings
2. Consider applying similar `ClientOnly` wrappers if needed
3. Future refactoring: Unify flag resolution across both modules
