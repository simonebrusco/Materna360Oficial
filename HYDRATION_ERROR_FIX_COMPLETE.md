# Hydration Error Fixes - Complete Solution

## Problem Analysis

The application was experiencing hydration failures with the error:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

### Root Causes Identified

1. **Flag Resolution Inconsistency**: The `isClientEnabled()` function in `flags.client.ts` was returning `false` on server (because `window` is undefined) but returning `true` on client (because flags were in a hardcoded `defaultsOn` list), causing different HTML to render.

2. **Conditional Rendering Without ClientOnly**: Components in `eu360/Client.tsx` were conditionally rendering based on `isEnabled('FF_LAYOUT_V1')` without wrapping in `ClientOnly`, leading to potential server/client mismatches.

3. **Random ID Generation**: The `ProfileForm` component was using `crypto.randomUUID()` to generate child IDs, which produces different values during SSR vs client hydration, causing htmlFor and id attribute mismatches.

## Fixes Applied

### 1. Fixed `app/lib/flags.client.ts`

Changed the flag resolution logic to:
- Check environment variables first (consistent on both server and client)
- Only check localStorage on the client (safe to access only when `window` is defined)
- Return `false` as default instead of using a hardcoded `defaultsOn` list
- Ensure consistent behavior between server and client

**Key Change**: Removed hardcoded flag defaults that would return true even when env variables said false.

```typescript
// Now checks env variables first (consistent on both server and client)
if (env === '1' || env === 'true') return true;
if (env === '0' || env === 'false') return false;

// Only check localStorage on client
if (typeof window !== 'undefined') {
  // localStorage logic
}

// Return false as default (matches actual env configuration)
return false;
```

### 2. Wrapped Flag-Dependent Content in `ClientOnly` - `app/(tabs)/eu360/Client.tsx`

Wrapped conditional blocks that depend on `isEnabled('FF_LAYOUT_V1')`:
- "Sua Jornada Gamificada" section (lines 191-221)
- "Seu Plano" section (lines 224-241)

These sections are now wrapped in `<ClientOnly>` components to ensure they only render on client after hydration, preventing server/client mismatches.

**Pattern Applied**:
```typescript
<ClientOnly>
  {isEnabled('FF_LAYOUT_V1') && (
    // Content that depends on flag
  )}
</ClientOnly>
```

### 3. Fixed Random ID Generation - `components/blocks/ProfileForm.tsx`

Changed from random UUIDs to stable index-based IDs:
- Removed `createId()` function that used `crypto.randomUUID()`
- Modified `createEmptyChild()` to accept an index parameter: `createEmptyChild(index: number)`
- Changed child IDs to: `child-${index}` format

**Key Changes**:
- `defaultState()` now creates first child with `createEmptyChild(0)`
- `addChild()` now creates new children with `createEmptyChild(previous.filhos.length)`

This ensures stable IDs like `child-0`, `child-1`, etc. that are consistent between server and client rendering.

## Verification

To verify the fixes work correctly:

1. **Type Check**: `pnpm exec tsc --noEmit` should show 0 errors
2. **Build**: `pnpm run build` should complete successfully
3. **Dev Server**: `pnpm dev` should show no hydration warnings in browser console
4. **Test Routes**: Visit `/eu360` and verify no console errors about hydration mismatches

## Expected Behavior After Fixes

- Server renders initial HTML with flag-dependent sections returning `null` (via `ClientOnly`)
- Client hydration receives same HTML (with sections as null)
- After hydration completes, `ClientOnly` components render their content on client
- All element IDs are stable and consistent across renders
- No warnings about server/client HTML mismatches

## Files Modified

1. **`app/lib/flags.client.ts`** - Fixed flag resolution logic
   - Changed to check environment variables first (consistent on both server and client)
   - Only check localStorage on client side
   - Return false as default instead of hardcoded list

2. **`app/(tabs)/eu360/Client.tsx`** - Wrapped all flag-dependent sections in `ClientOnly`
   - "Sua Jornada Gamificada" section (FF_LAYOUT_V1)
   - "Seu Plano" section (FF_LAYOUT_V1)
   - "Resumo da Semana" section (FF_LAYOUT_V1)
   - "Exportar Relatório" section (FF_LAYOUT_V1)
   - "Internal Insights" section (FF_INTERNAL_INSIGHTS)

3. **`app/(tabs)/meu-dia/Client.tsx`** - Added ClientOnly import and wrapped flag-dependent sections
   - Coach suggestion card (FF_COACH_V1)
   - Emotion trend drawer (FF_EMOTION_TRENDS)

4. **`components/blocks/ProfileForm.tsx`** - Changed from random to index-based IDs
   - Removed `createId()` function
   - Changed `createEmptyChild()` to use index parameter
   - Child IDs now use format: `child-${index}`

## Impact Assessment

- **Non-Breaking**: These changes are backward compatible
- **Performance**: Minimal impact (ClientOnly adds minimal overhead)
- **User Experience**: Fixes hydration errors that may have been causing blank screens or console warnings
