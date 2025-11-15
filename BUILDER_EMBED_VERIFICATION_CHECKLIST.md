# Builder Embed Mode - Verification Checklist

## ✅ Implementation Complete

### Core Components
- [x] `components/dev/BuilderErrorBoundary.tsx` - Created
  - Catches React errors
  - Displays error UI with stack trace
  - Exposes error to `window.__BUILDER_LAST_ERROR__`
  - Uses readable dark text (#111) on transparent background

- [x] `app/builder-embed/page.tsx` - Rewritten
  - Lazy-loads MeuDiaClient with `React.lazy()`
  - Sets `window.__BUILDER_MODE__ = true`
  - Wraps with ErrorBoundary
  - Renders PageHeader + BottomNav + LazyMeuDia
  - Uses Suspense fallbacks

- [x] `app/(tabs)/meu-dia/Client.tsx` - Updated
  - Added `__disableHeavy__?: boolean` prop
  - Implemented `builderMode` detection
  - Guarded localStorage access
  - Guarded telemetry calls
  - Guarded dev mode seeding
  - Hidden ExportButton (PDF export)
  - Hidden ExportPlanner
  - Disabled emotion trend charts

- [x] `app/globals.css` - Updated
  - Force readable text: `color: #111`
  - Force light theme: `color-scheme: light`

- [x] `middleware.ts` - Already configured
  - Allows `/builder-embed` paths
  - Allows `?builder.preview=1` query params
  - Excludes `/builder-embed` from rewrite pattern

- [x] `next.config.mjs` - Already configured
  - CSP headers: `frame-ancestors 'self' https://builder.io https://*.builder.io`
  - Builder image support enabled
  - No X-Frame-Options restriction

- [x] `app/health/page.tsx` - Already exists
  - Returns 200 status with health check info

---

## 🧪 Testing Checklist

### Local Dev Testing

```bash
# Start dev server
npm run dev  # or pnpm dev

# Test the three key URLs:
curl http://localhost:3001/health?builder.preview=1
curl http://localhost:3001/builder-embed
curl http://localhost:3001/builder-embed?builder.preview=1
```

Expected results:
- All return 200 status code
- All render full HTML with React content
- No 302/307 redirects

### Visual Verification (in Browser)

#### Test 1: Health Check
```
http://localhost:3001/health?builder.preview=1
```
Expected:
- "Materna360 — Health OK ✓" visible
- Dark text (#111) on light background
- Checklist items visible

#### Test 2: Builder Embed Page
```
http://localhost:3001/builder-embed
```
Expected:
- "Meu Dia (Builder Preview)" header visible
- Dark text on pink/light background
- Daily greeting visible
- Bottom navigation visible
- **No** error boundary error message

#### Test 3: Builder Embed with Parameter
```
http://localhost:3001/builder-embed?builder.preview=1
```
Expected:
- Same as Test 2
- Middleware passes through without redirect

### Developer Console Tests

In browser DevTools Console (when testing locally):

```javascript
// Check for global flag
console.log(window.__BUILDER_MODE__);  // Should be true

// Check for last error (should be undefined unless error occurred)
console.log(window.__BUILDER_LAST_ERROR__);  // Should be undefined (no errors)

// Check for telemetry calls (should be skipped in builder mode)
// Look for [telemetry] console logs (should not appear)
```

### Builder Interact Testing

1. **Open Builder editor**
   - Go to https://builder.io (or your preview environment)
   - Open a design/page in Interact mode

2. **Set preview URL**
   - In Interact settings: "Development Server URL" = `http://localhost:3001`
   - Check "Auto-detect" is disabled if needed

3. **Test the three routes**
   - Navigate to `/health` → Should see health check page
   - Navigate to `/builder-embed` → Should see Meu Dia preview
   - Navigate to `/meu-dia` → Should see regular Meu Dia page

4. **Verify no errors**
   - Open DevTools Console inside Builder iframe
   - Look for any red errors (should be none)
   - Look for `[BuilderErrorBoundary]` logs (should be none unless error)

5. **Verify heavy features disabled**
   - No PDF export button visible in `/builder-embed`
   - No planner export controls visible
   - No emotion trend charts/buttons

### Edge Case Tests

#### Test: No localStorage (simulated iframe restrictions)
```javascript
// In browser console
Object.defineProperty(window, 'localStorage', {
  value: undefined,
  writable: false
});
// Refresh page - should still render without errors
```

#### Test: No cookies (simulated iframe restrictions)
The app should render with fallback profile data when cookies unavailable.

#### Test: Network error in telemetry
Telemetry calls are wrapped in try/catch, so network errors shouldn't break rendering.

---

## 📋 Pre-Deployment Checklist

Before pushing to cosmos-verse:

- [ ] Run TypeScript check: `pnpm exec tsc --noEmit`
- [ ] Run build: `pnpm run build`
- [ ] Verify build succeeds (no errors in stderr)
- [ ] Check bundle size hasn't increased significantly
- [ ] Verify all test URLs return 200 status
- [ ] Test in actual Builder.io preview (if access available)

---

## 🔍 Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `components/dev/BuilderErrorBoundary.tsx` | NEW | Error boundary for iframe |
| `app/builder-embed/page.tsx` | MODIFIED | Lazy loading + ErrorBoundary |
| `app/(tabs)/meu-dia/Client.tsx` | MODIFIED | Builder mode guards + hidden exports |
| `app/globals.css` | MODIFIED | Readable text forcing |
| `middleware.ts` | ✓ OK | Already configured correctly |
| `next.config.mjs` | ✓ OK | CSP headers already correct |
| `app/health/page.tsx` | ✓ OK | Already exists |

---

## 🚀 Success Criteria

When all tests pass:

✅ **A1: Full Content Renders**
- `/builder-embed?builder.preview=1` shows complete Meu Dia UI
- All sections (header, greeting, mood, planner, nav) visible
- No blank/white screen

✅ **A2: No Infinite Redirects**
- No 301/302/307 responses on preview URLs
- No redirect loops in console
- All requests complete successfully

✅ **A3: Heavy Features Disabled**
- PDF export button not visible in builder mode
- localStorage calls guarded (no "localStorage not available" errors)
- Telemetry calls wrapped and won't break rendering

✅ **A4: Errors Display Visibly**
- If any component throws, ErrorBoundary shows error message
- Error stack visible in error panel (not silently hidden)
- Error also in `window.__BUILDER_LAST_ERROR__` for inspection

---

## 🐛 Troubleshooting

### Problem: Blank white/pink screen in Builder
**Solution:**
1. Open DevTools Console in Builder iframe
2. Look for error logs starting with `[BuilderErrorBoundary]`
3. Check `window.__BUILDER_LAST_ERROR__` for the actual error
4. Fix the component that threw the error
5. Refresh preview

### Problem: 302/307 redirects happening
**Solution:**
1. Check middleware.ts is allowing `/builder-embed` path
2. Verify `?builder.preview=1` param isn't being stripped
3. Check if root page redirect is interfering
4. Review request.nextUrl.pathname and searchParams in middleware

### Problem: localStorage/cookies not accessible
**Solution:**
1. This is expected in iframe mode
2. App should fallback to in-memory state
3. Check that guards are in place (if builderMode check)
4. Verify fallback data is being used

### Problem: Heavy features still visible
**Solution:**
1. Check that `builderMode` is being calculated correctly
2. Verify `__disableHeavy__={true}` being passed to MeuDiaClient
3. Check that conditionals (`{!builderMode && <ExportButton />}`) are correct
4. May need to clear browser cache and rebuild

---

## 📞 Support

For issues:
1. Check browser DevTools Console for errors
2. Review `BUILDER_EMBED_HARD_SAFE_IMPLEMENTATION.md` for details
3. Verify all files were created/modified correctly
4. Check that `npm run dev` compiles without errors
5. Run `pnpm exec tsc --noEmit` to catch TypeScript issues
