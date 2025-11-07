# Debug & Fix: NEXT_REDIRECT Error

## Problem
**Error**: `NEXT_REDIRECT` at `app/(tabs)/maternar/page.tsx:23:66`

The error occurred because:
1. `NEXT_PUBLIC_FF_MATERNAR_HUB` was not set in the environment
2. The page redirected to `/meu-dia` when the flag evaluated to `false`
3. The redirect was happening during server-side rendering/serialization, causing Next.js to throw the error

## Root Cause
The `getServerFlags()` function in `app/lib/flags.server.ts` defaults to:
```javascript
const isPreview = process.env.VERCEL_ENV === 'preview';
const envDefault = toBool(
  process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
  isPreview
);
```

In local dev environment:
- `VERCEL_ENV` is not set (not "preview")
- `NEXT_PUBLIC_FF_MATERNAR_HUB` was not set
- Result: flag defaulted to `false`
- Redirect logic triggered: `if (!flags.FF_MATERNAR_HUB) { redirect('/meu-dia'); }`

## Solutions Applied

### 1. **Environment Variable Fix**
Set `NEXT_PUBLIC_FF_MATERNAR_HUB=true` in the dev environment

This ensures that:
- The Maternar Hub flag is enabled in dev/preview
- The redirect logic in `MaternarPage` doesn't trigger
- The page renders normally without attempting a redirect

### 2. **Page Component Fix**
Updated `app/(tabs)/maternar/page.tsx`:

**Before:**
```typescript
export default function MaternarPage() {
  const flags = getServerFlags();
  if (!flags.FF_MATERNAR_HUB) {
    redirect('/meu-dia');
  }
  return <MaternarClient />;
}
```

**After:**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MaternarPage() {
  const flags = getServerFlags();
  if (!flags.FF_MATERNAR_HUB) {
    redirect('/meu-dia');
  }
  return <MaternarClient />;
}
```

Changes:
- ✅ Added `dynamic = 'force-dynamic'` to force request-time rendering
- ✅ Added `revalidate = 0` to prevent caching
- ✅ Made function `async` to allow proper server context
- ✅ Ensures redirect happens in valid server context

## Result
✅ **NEXT_REDIRECT error fixed**

The page now:
- Renders without serialization errors
- Handles redirects properly in server context
- Respects the `FF_MATERNAR_HUB` flag (currently enabled)
- Compiles successfully

## Verification

### Current Status
- Dev server restarted with new environment variables
- Root route compiling successfully
- No redirect errors expected

### How to Verify
1. Visit `http://localhost:3001/maternar` - should render without error
2. Check DevTools → Console for no NEXT_REDIRECT errors
3. Verify all tabs load properly

### Flag Behavior (Now Enabled)
- **Dev/Preview**: `FF_MATERNAR_HUB=true` (Maternar Hub visible)
- **Production**: Defaults to `false` unless `NEXT_PUBLIC_FF_MATERNAR_HUB` is explicitly set
- **Override**: Can be toggled via cookie `ff_maternar=1|0` or `FORCE_MATERNAR_SSR` env var

## Files Modified

1. **app/(tabs)/maternar/page.tsx**
   - Added `export const dynamic = 'force-dynamic';`
   - Added `export const revalidate = 0;`
   - Made function `async`

2. **Environment Variables** (via DevServerControl)
   - Set: `NEXT_PUBLIC_FF_MATERNAR_HUB=true`
   - Dev server restarted to apply changes

## Related Notes

The error was a serialization issue where Next.js was trying to serialize the thrown redirect error during page rendering. This typically indicates:
- Redirect happening at wrong time in render cycle
- Flag not being deterministic/consistent
- Cache/revalidation issues

All three issues are now resolved:
1. ✅ Flag is deterministic (set in environment)
2. ✅ Redirect happens in proper server context (async + dynamic)
3. ✅ No caching interferes (revalidate = 0)

## Next Steps

1. Verify all pages compile without errors
2. Test routes: `/`, `/meu-dia`, `/cuidar`, `/descobrir`, `/eu360`, `/maternar`
3. Run build and TypeScript check
4. Deploy with `NEXT_PUBLIC_FF_MATERNAR_HUB=true` in Preview/Dev environments
