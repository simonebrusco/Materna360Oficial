# Navigation & Routing Audit Report

## Executive Summary
✅ **Navigation is stable with 5 visible tabs**
✅ **Redirects behave correctly under flag ON/OFF**
⚠️ **Safe-area padding (pb-24) needs standardization**

---

## 1. BottomNav 5-Tab Verification

### ✅ CONFIRMED: Exactly 5 tabs, always visible

**File:** `components/common/BottomNav.tsx` (lines 8-47)

```
ITEMS_FORCED = [
  1. /meu-dia    → "Meu Dia"     (icon: star)
  2. /cuidar     → "Cuidar"      (icon: care)
  3. /maternar   → "Maternar"    (icon: home, CENTER, always highlighted)
  4. /descobrir  → "Descobrir"   (icon: books)
  5. /eu360      → "Eu360"       (icon: crown)
]
```

### Key Features:
- **Force-visible**: `const items = ITEMS_FORCED` - always 5 tabs, no flag gating
- **Center highlight**: Maternar is `center: true` with `-mt-2` and `h-16` (raised, larger)
- **Active states**:
  - `/meu-dia`: exact match `pathname === '/meu-dia'`
  - `/cuidar`: exact match `pathname === '/cuidar'`
  - `/maternar`: prefix match `pathname.startsWith('/maternar')`
  - `/descobrir`: prefix match `pathname.startsWith('/descobrir')`
  - `/eu360`: exact or prefix `pathname === '/eu360' || pathname.startsWith('/eu360/')`
- **Telemetry**: `trackTelemetry('nav_click', {...})` on every click
- **a11y**: `aria-current="page"` on active, `aria-label` on each item
- **Debug attribute**: `data-debug-nav="count:5;forced:yes"` for verification

### Layout placement:
```tsx
// app/(tabs)/layout.tsx
<div className="relative">
  <div className="pb-24">{children}</div>
  <BottomNav />
</div>
```

✅ **Verdict:** Implementation correct. Nav is always 5 items, properly positioned.

---

## 2. Safe-Area Padding (pb-24) Status

### Partially Applied:

| Page | pb-24 Location | Status |
|------|---|---|
| `/meu-dia` | Page wrapper (via PageTemplate) | ✅ Inherited from PageTemplate |
| `/cuidar` | Explicit main tag, line 16 | ✅ Explicit `pb-24` |
| `/descobrir` | Missing from page.tsx | ⚠️ Should be added |
| `/eu360` | Missing from page.tsx | ⚠️ Should be added |
| `/maternar` | Not present (uses custom main in Client) | ⚠️ Client uses custom main |
| Layout wrapper | `app/(tabs)/layout.tsx`, line 9 | ✅ `<div className="pb-24">` |

### Issue Details:

1. **PageTemplate adds pb-24:**
   ```tsx
   // components/common/PageTemplate.tsx line 23-28
   <main
     data-layout="page-template-v1"
     className={clsx(
       'bg-soft-page min-h-[100dvh] pb-24',  // ← pb-24 included
       className
     )}
   >
   ```

2. **Some pages missing it:**
   - `app/(tabs)/descobrir/page.tsx` - only has `data-layout="page-template-v1"`, no explicit pb-24
   - `app/(tabs)/eu360/page.tsx` - same issue

3. **Maternar uses custom main:**
   ```tsx
   // app/(tabs)/maternar/Client.tsx (line 16)
   <main className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
     <PageTemplate ...>  // PageTemplate adds pb-24
   ```
   - ✅ PageTemplate inside adds pb-24, so safe

### Recommendation:
**Add explicit pb-24 to page.tsx files that don't use PageTemplate wrapper:**
```tsx
// app/(tabs)/descobrir/page.tsx
<main data-layout="page-template-v1" className="pb-24">

// app/(tabs)/eu360/page.tsx  
<main data-layout="page-template-v1" className="pb-24">
```

---

## 3. Redirects & Flag Logic

### 3.1 Root Page Redirect (app/page.tsx)

```tsx
export default async function Page() {
  const flags = getServerFlags()
  redirect(flags.FF_MATERNAR_HUB ? '/maternar' : '/meu-dia')
}
```

✅ **Behavior:**
- **FF_MATERNAR_HUB = true** → redirects to `/maternar` (hub visible)
- **FF_MATERNAR_HUB = false** → redirects to `/meu-dia` (hub hidden, default)

✅ **Correct:** Uses `getServerFlags()` (proper server context)

---

### 3.2 Maternar Page Guard (app/(tabs)/maternar/page.tsx)

```tsx
export default async function MaternarPage() {
  const flags = getServerFlags();
  if (!flags.FF_MATERNAR_HUB) {
    redirect('/meu-dia');
  }
  return <MaternarClient />;
}
```

✅ **Behavior:**
- If flag OFF → redirects to `/meu-dia`
- If flag ON → renders MaternarClient hub

✅ **Correct:** Guard prevents access when hub is disabled

---

### 3.3 Flag Resolution Logic

**File:** `app/lib/flags.server.ts`

```tsx
export function getServerFlags(): Flags {
  // 1) Hard server override (highest priority)
  const forceSSR = toBool(process.env.FORCE_MATERNAR_SSR, false);
  if (forceSSR) {
    return {
      FF_LAYOUT_V1: true,
      FF_FEEDBACK_KIT: true,
      FF_HOME_V1: true,
      FF_MATERNAR_HUB: true,
    };
  }

  // 2) Cookie override
  const cookieVal = cookies().get('ff_maternar')?.value ?? null;
  const cookieBool = cookieVal === '1' ? true : cookieVal === '0' ? false : null;

  // 3) Environment defaults (Preview vs Prod)
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const envDefault = toBool(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview
  );

  const mat = cookieBool !== null ? cookieBool : envDefault;

  return {
    FF_LAYOUT_V1: true,
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: mat,
  };
}
```

✅ **Precedence Correct:**
1. `FORCE_MATERNAR_SSR=1` (server-only, highest)
2. Cookie `ff_maternar=1|0` (QA override)
3. Environment `NEXT_PUBLIC_FF_MATERNAR_HUB` (defaults to true in Preview, false in Prod)

✅ **No "use server" issues:** Function is in `.server.ts` file, proper context

---

## 4. Flag Logic Consistency

### Client-side (`app/lib/flags.ts`)

```tsx
export function getClientFlagsUnified(): Flags {
  // URL param > cookie > env > Preview default
  const queryParam = search.get('ff_maternar');
  const cookieValue = // parse from document.cookie
  const envDefault = coerceEnv(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview ? '1' : '0'
  );
  const maternarHub = resolveMaternarFrom(queryParam, cookieValue, envDefault);
  return { ... FF_MATERNAR_HUB: maternarHub }
}
```

✅ **Client Precedence:**
1. URL param `?ff_maternar=1|0`
2. Cookie `ff_maternar=1|0`
3. Environment + Preview default

✅ **No conflicts:** Client and server use same precedence model

---

## 5. Summary of Issues Found

| Issue | Severity | File | Action |
|-------|----------|------|--------|
| `/descobrir` missing explicit pb-24 | Low | `app/(tabs)/descobrir/page.tsx` | Add `pb-24` to main tag |
| `/eu360` missing explicit pb-24 | Low | `app/(tabs)/eu360/page.tsx` | Add `pb-24` to main tag |
| Maternar custom main (inconsistent) | Low | `app/(tabs)/maternar/Client.tsx` | Consider using PageTemplate wrapper only |

---

## 6. Recommended Fixes

### Fix 1: Add pb-24 to descobrir/page.tsx
```tsx
// Before:
<main data-layout="page-template-v1">

// After:
<main data-layout="page-template-v1" className="pb-24">
```

### Fix 2: Add pb-24 to eu360/page.tsx
```tsx
// Before:
<main data-layout="page-template-v1">

// After:
<main data-layout="page-template-v1" className="pb-24">
```

### Fix 3 (Optional): Maternar consistency
Consider removing custom main from `MaternarClient` and letting PageTemplate handle layout:
```tsx
// Option: Let PageTemplate render the main
export default function MaternarClient() {
  return (
    <PageTemplate
      title="Bem-vinda ao Maternar"
      subtitle="Como você quer se cuidar hoje?"
      hero={<HubHeader ... />}
    >
      <CardHub />
    </PageTemplate>
  );
}
```

---

## Final Verdict

✅ **Navigation: STABLE**
- 5 tabs always visible, properly ordered
- Center Maternar highlighted correctly
- Telemetry firing on all clicks
- a11y attributes present

✅ **Redirects: CORRECT**
- Root page → `/maternar` when ON, `/meu-dia` when OFF
- Maternar guard → prevents access when OFF
- No circular redirects

⚠️ **Safe-area padding: MOSTLY CORRECT**
- Layout wrapper has pb-24
- PageTemplate adds pb-24
- Some page.tsx files missing explicit pb-24 (but inherited via PageTemplate or layout)
- Recommend adding explicit pb-24 to all page wrappers for clarity

✅ **Flag logic: SOUND**
- No "use server" misuse
- Correct precedence on server and client
- No conflicts between implementations
