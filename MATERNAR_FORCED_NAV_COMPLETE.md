# Force-Visible Maternar Tab in BottomNav - Complete

## Status: ✅ DONE

Maternar tab is now always visible in the center of BottomNav, independent of server flags. This is a temporary UX override to unblock QA.

## Changes Made

### 1. Updated `components/common/BottomNav.tsx` ✅

**Key Changes:**
- ✅ Removed flag checks (`flags?.FF_MATERNAR_HUB`)
- ✅ Removed conditional item arrays (`ITEMS_WITH_HUB`, `ITEMS_WITHOUT_HUB`)
- ✅ Added single forced 5-item array: `ITEMS_FORCED`
- ✅ Always renders `grid-cols-5` (5 columns)
- ✅ Removed import of `Flags` type (no flag logic)
- ✅ Pure renderer: accepts but ignores `flags` prop (backward compat)
- ✅ Added `data-debug-nav="count:5;forced:yes"` attribute

**Navigation Items (always 5):**
```
1. /meu-dia    (Meu Dia)   - icon: star
2. /cuidar     (Cuidar)    - icon: care
3. /maternar   (Maternar)  - icon: home, CENTER HIGHLIGHTED ⭐
4. /descobrir  (Descobrir) - icon: books
5. /eu360      (Eu360)     - icon: crown
```

### 2. Simplified `app/(tabs)/layout.tsx` ✅

**Before:**
```typescript
const flags = getServerFlags();
const itemCount = flags.FF_MATERNAR_HUB ? 5 : 4;
const hubStatus = flags.FF_MATERNAR_HUB ? 'on' : 'off';
<BottomNav flags={flags} data-debug-nav={...} />
```

**After:**
```typescript
<BottomNav />
```

- ✅ Removed `getServerFlags()` call (no longer needed in layout)
- ✅ Removed conditional logic
- ✅ Clean, simple component mount
- ✅ BottomNav handles all rendering logic internally

### 3. Guards Remain Unchanged ✅

**`app/(tabs)/maternar/page.tsx`:**
```typescript
const flags = getServerFlags();
if (!flags.FF_MATERNAR_HUB) {
  redirect('/meu-dia');
}
```
- ✅ Still guards the hub route
- ✅ Redirects to /meu-dia when flag is OFF
- ✅ Renders hub when flag is ON

**`app/page.tsx`:**
```typescript
const flags = getServerFlags();
redirect(flags.FF_MATERNAR_HUB ? '/maternar' : '/meu-dia');
```
- ✅ Conditional redirect based on flag state
- ✅ No changes made

## Expected Behavior

### Preview (Flag ON or OFF - Visually the same)

```
Bottom Navigation:
┌─────────────────────────────────────────────────┐
│ 📅 Meu Dia │ ❤️ Cuidar │ 🏠 Maternar │ ✨ Descobrir │ 👤 Eu360 │
│                          ↑ CENTER HIGHLIGHTED                   │
└─────────────────────────────────────────────────┘
```

- ✅ Always shows 5 tabs
- ✅ Center Maternar tab is always highlighted with primary color
- ✅ Center tab is slightly raised (h-16 -mt-2)
- ✅ `data-debug-nav="count:5;forced:yes"` visible in DevTools

### Clicking Maternar Tab

**If flag is ON:**
- ✅ Renders Maternar Hub (no redirect)

**If flag is OFF:**
- ✅ Redirects to `/meu-dia` (server-side guard)
- ✅ UX: Tab clicked, but landed on Meu Dia (acceptable for now)

## Build Status

```bash
✅ TypeScript: pnpm exec tsc --noEmit
   → 0 errors

✅ Dev server: Running and responsive
```

## QA Verification

**Visual:**
1. Open any tab page (e.g., `/meu-dia`, `/cuidar`, `/descobrir`, `/eu360`)
2. Bottom navigation should show 5 items
3. Center "Maternar" tab is highlighted (primary color, raised)
4. Tabs are evenly spaced (5 columns)

**DevTools Inspection:**
```
<nav ... data-debug-nav="count:5;forced:yes">
  <ul class="grid-cols-5">
    <!-- 5 items, center one highlighted -->
  </ul>
</nav>
```

**User Interaction:**
- Click any tab → navigates to that route
- Click Maternar tab:
  - If `FORCE_MATERNAR_SSR=1` → renders hub
  - If flag is OFF → redirects to /meu-dia (acceptable)

## Files Modified

- ✅ `components/common/BottomNav.tsx` (forced 5 items, pure renderer)
- ✅ `app/(tabs)/layout.tsx` (simplified, removed flag logic)

## Files NOT Changed (As Requested)

- ✅ `app/lib/flags.server.ts` (unchanged)
- ✅ `app/(tabs)/maternar/page.tsx` (guard unchanged)
- ✅ `app/page.tsx` (redirect logic unchanged)
- ✅ All route guards remain intact

## Rollback Plan (Future)

When SSR flags are stable and QA is unblocked, revert to conditional rendering by:

1. Restore `ITEMS_WITH_HUB` and `ITEMS_WITHOUT_HUB` in BottomNav
2. Restore flag check: `const hubOn = !!flags?.FF_MATERNAR_HUB;`
3. Conditionally pick items array based on `hubOn`
4. Restore layout call: `<BottomNav flags={flags} />`

This is a clean, easy rollback when flags are ready.

## Why This Works

1. **Visual Unblock:** QA can test the full 5-tab UI without flag dependency
2. **Guard Intact:** Server-side routing guards still work
3. **No Breaking Changes:** All routes, redirects, and data flows unchanged
4. **Pure Renderer:** BottomNav is decoupled from flag logic
5. **Debuggable:** `data-debug-nav` attribute shows forced state
6. **Temporary:** Easy to revert when flags stabilize

---

**Status:** ✅ Ready for QA. Maternar tab always visible and highlighted, regardless of flag state. Clicking it either renders the hub (flag ON) or redirects to Meu Dia (flag OFF).
