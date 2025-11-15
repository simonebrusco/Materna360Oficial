# /Maternar Flag Wiring Fix - Complete

## Changes Made

### 1. Unified Flags API (`app/lib/flags.ts`)

#### New Unified Types
```typescript
export type Flags = {
  FF_LAYOUT_V1: boolean;
  FF_FEEDBACK_KIT: boolean;
  FF_HOME_V1: boolean;
  FF_MATERNAR_HUB: boolean;
};
```

#### New Server-Side Function
```typescript
export async function getServerFlags(): Promise<Flags>
```
- Uses `cookies()` from Next.js
- Reads `ff_maternar` cookie
- Env var: `NEXT_PUBLIC_FF_MATERNAR_HUB`
- Default: `true` in Preview, `false` in Production
- Note: URL params require header injection (fallback to env)

#### New Client-Side Function
```typescript
export function getClientFlagsUnified(): Flags
```
- Reads from: `?ff_maternar=1|0` (URL param) → `ff_maternar` cookie → `NEXT_PUBLIC_FF_MATERNAR_HUB` env
- Default: `true` in Preview, `false` in Production
- Safe to call only on client (uses `window`, `document`)

#### Updated Single Flag Helper
```typescript
export function isEnabled(flag: FlagName): boolean
```
- Now calls `getClientFlagsUnified()` internally
- Supports all unified flags
- Replaces old behavior of client-only URL override for FF_LAYOUT_V1

#### Flag Precedence (Highest → Lowest)
1. URL query param: `?ff_maternar=1` or `?ff_maternar=0`
2. Cookie: `ff_maternar=1` or `ff_maternar=0`
3. Env var: `NEXT_PUBLIC_FF_MATERNAR_HUB` (if set)
4. Environment default:
   - **Preview**: `true` (hub enabled)
   - **Production**: `false` (hub disabled)

### 2. Updated BottomNav (`components/common/BottomNav.tsx`)

**Before:**
```typescript
'use client';
import { isEnabled } from '@/app/lib/flags';

const showHub = isEnabled('FF_MATERNAR_HUB');
```

**After:**
```typescript
'use client';
import { getClientFlagsUnified } from '@/app/lib/flags';

const flags = getClientFlagsUnified();
const showHub = flags.FF_MATERNAR_HUB;
```

**Result:** 5-tab nav when flag is ON with exact order:
```
/meu-dia | /cuidar | /maternar (center, highlighted) | /descobrir | /eu360
```

### 3. Updated /Maternar Route (`app/(tabs)/maternar/page.tsx`)

**Before:**
```typescript
export default function MaternarPage() {
  if (!isEnabled('FF_MATERNAR_HUB')) {
    redirect('/meu-dia');
  }
  return <MaternarClient />;
}
```

**After:**
```typescript
export default async function MaternarPage() {
  const flags = await getServerFlags();
  if (!flags.FF_MATERNAR_HUB) {
    redirect('/meu-dia');
  }
  return <MaternarClient />;
}
```

**Result:** Server-side flag resolution prevents hydration mismatches

## Testing QA Overrides

### Test 1: Enable Flag in Preview
```
URL: http://localhost:3001/meu-dia?ff_maternar=1
Expected:
  - BottomNav shows 5 tabs
  - Center tab highlighted (Maternar)
  - /maternar accessible and renders Hub
```

### Test 2: Disable Flag in Preview
```
URL: http://localhost:3001/meu-dia?ff_maternar=0
Expected:
  - BottomNav shows 4 tabs (original layout)
  - /maternar redirects to /meu-dia
```

### Test 3: Default Preview Behavior
```
URL: http://localhost:3001/meu-dia (no query param)
Expected:
  - FF_MATERNAR_HUB defaults to true (Preview)
  - BottomNav shows 5 tabs
  - /maternar renders Hub
```

### Test 4: Cookie Override (Dev Tools)
1. Open DevTools → Application → Cookies
2. Create cookie: `ff_maternar=1` for localhost
3. Refresh page
4. Verify 5-tab nav appears

## QA Checklist

- [ ] TypeScript: `pnpm exec tsc --noEmit` returns 0 errors
- [ ] Build: `pnpm run build` succeeds
- [ ] No hydration warnings in browser console
- [ ] BottomNav shows 5 tabs when flag ON (default or ?ff_maternar=1)
- [ ] BottomNav shows 4 tabs when flag OFF (?ff_maternar=0)
- [ ] /maternar renders Hub when flag ON
- [ ] /maternar redirects to /meu-dia when flag OFF
- [ ] Center tab has aria-label="Maternar" and is focusable
- [ ] Tap targets ≥40px (no tap issues on mobile)
- [ ] Safe area: no overlap with last row of cards (pb-24)
- [ ] Production env: FF_MATERNAR_HUB defaults to false

## Files Changed

1. `app/lib/flags.ts` - Unified flag resolution API
2. `components/common/BottomNav.tsx` - Use unified client flags
3. `app/(tabs)/maternar/page.tsx` - Use server flags + async

## Backward Compatibility

- Old `getClientFlags()` → `DiscoverFlags` still works (deprecated)
- Old `isEnabled('FF_LAYOUT_V1')` still works (routes through new unified API)
- No breaking changes to existing components

## Environment Configuration

### Vercel Preview (Auto)
- `VERCEL_ENV=preview` → `FF_MATERNAR_HUB` defaults to `true`
- Set `NEXT_PUBLIC_FF_MATERNAR_HUB=1` explicitly (optional, redundant)

### Vercel Production
- `VERCEL_ENV=production` → `FF_MATERNAR_HUB` defaults to `false`
- Hub is disabled by default in prod

### Local Development
- `VERCEL_ENV` not set → defaults to `'development'`
- Treated as Preview → `FF_MATERNAR_HUB` defaults to `true`
- Test with `?ff_maternar=0` to simulate prod behavior
