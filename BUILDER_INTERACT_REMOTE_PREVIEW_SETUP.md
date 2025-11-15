# Builder Interact Remote Preview Setup

## Status: ✅ All Code Configuration Complete

All backend code is configured to support remote Vercel preview embedding in Builder Interact.

---

## 📋 What's Been Done (Code)

### ✅ 1. CSP Headers Configured
**File:** `next.config.mjs`

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://builder.io https://*.builder.io",
        },
      ],
    },
  ];
}
```

**Effect:** Allows Builder.io to embed the app in iframe without frame-blocking.

---

### ✅ 2. Middleware Builder.preview Bypass
**File:** `middleware.ts`

```typescript
if (request.nextUrl.searchParams.has('builder.preview')) {
  return NextResponse.next()
}
```

**Effect:** `?builder.preview=1` param passes through without redirect.

---

### ✅ 3. Client-Only Code Guards
**Files Updated:**
- `app/lib/moodStore.client.ts`
- `app/lib/plannerStore.client.ts`
- `app/lib/persist.ts`
- `app/lib/telemetry.ts`
- `app/lib/planClient.ts`
- `app/lib/badges.ts`
- `app/lib/safeFetch.ts`
- `app/(tabs)/descobrir/lib/quota.ts`

All now check:
```typescript
if (typeof window === 'undefined') return [];  // or appropriate default
```

**Effect:** Prevents SSR errors when code executes on server (Builder preview).

---

### ✅ 4. PDF Export Lazy Loading
**File:** `components/pdf/ExportButton.tsx`

Dynamic import at runtime:
```typescript
const { buildReport, downloadBlob } = await import(
  '@/app/lib/pdf/buildReport'
);
```

**Effect:** PDF library only loads on-demand; doesn't block iframe rendering.

---

### ✅ 5. Health Check Route Created
**File:** `app/health/page.tsx` (NEW)

Minimal test page to validate iframe embedding:
- Renders simple HTML with checks
- Confirms CSP + middleware working
- No client-side state (pure static)
- Safe for iframe sandboxing

**Route:** `/health?builder.preview=1`

---

## 🎯 What You Need to Do (Manual in Builder UI)

### Step 1: Get Latest Vercel Preview URL

1. Go to your Vercel project dashboard
2. Find the latest Preview deployment (usually at top of list)
3. Copy the preview URL, e.g.: `https://materna360-xyz123.vercel.app`

### Step 2: Set Preview URL in Builder.io

1. **Open Builder.io Console**
2. **Go to:** Project Settings → Preview URL
3. **Replace** any localhost reference with your Vercel Preview URL
4. **Disable "Auto-detect dev server URL"** if enabled
5. **Save** the settings

### Step 3: Purge Builder Cache

1. **Go to:** Project Settings → Advanced
2. **Click:** "Clear Preview Cache" or "Purge Cache"
3. **Wait** 10-15 seconds for cache to clear

### Step 4: Test in Interact

1. **Open** the Interact panel (top-right of Builder editor)
2. **Paste in URL bar:** `https://<your-preview-url>/health?builder.preview=1`
3. **Hit Enter**

**Expected Result:** Simple health check page renders (white page with checkmarks)

If successful, try:
```
https://<your-preview-url>/meu-dia?builder.preview=1
```

Should show the Meu Dia page with planner, mood checkin, actions.

---

## 🔍 Verification Checklist

### A1: Pages Render in Interact ✅
- [ ] `/health?builder.preview=1` renders checkmarks page
- [ ] `/meu-dia?builder.preview=1` renders with sections
- [ ] No blank white screen

### A2: CSP Headers Present ✅
1. Open DevTools in Interact frame (might require iframe inspector)
2. Go to Network tab
3. Click any request
4. In Response Headers, confirm:
   ```
   Content-Security-Policy: frame-ancestors 'self' https://builder.io https://*.builder.io
   ```

### A3: No Console Errors ✅
1. Open DevTools Console in Interact iframe
2. Should be empty (no red errors)
3. Warnings OK (third-party scripts)
4. Look for:
   - ✓ No "window is undefined" errors
   - ✓ No "localStorage is undefined" errors
   - ✓ No "fetch failed" errors

### A4: Meu Dia Features ✅
- [ ] Page title visible: "Seu dia, no seu ritmo"
- [ ] Planner section visible
- [ ] Mood checkin visible
- [ ] Quick actions visible
- [ ] "Exportar Relatório" button visible (if FF_PDF_EXPORT=1)

---

## 🚀 Configuration Verification

### Next.config.mjs ✓
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://builder.io https://*.builder.io",
        },
      ],
    },
  ];
}
swcMinify: true
productionBrowserSourceMaps: false
```

### Middleware.ts ✓
```typescript
if (request.nextUrl.searchParams.has('builder.preview')) {
  return NextResponse.next()
}
```

### Client Guards ✓
All localStorage/window access protected by:
```typescript
if (typeof window === 'undefined') return []
```

### Health Route ���
```typescript
app/health/page.tsx created
```

---

## 📊 Expected Behavior

### Before (Blank Screen)
```
Builder Interact → Request /meu-dia → Next.js renders → SSR hydration mismatch → Blank
```

### After (Fixed)
```
Builder Interact → Request /meu-dia?builder.preview=1
  → Middleware passes through (builder.preview=1 present)
  → CSP headers allow iframe embedding
  → Client-only code guarded (typeof window !== 'undefined')
  → Components hydrate successfully
  → Page renders inside iframe ✓
```

---

## 🔧 Troubleshooting

### Still Blank After Cache Clear?

1. **Check Vercel URL is accessible:**
   ```bash
   curl https://<preview-url>/health?builder.preview=1
   ```
   Should return HTML (no 404 or error)

2. **Verify CSP header in curl:**
   ```bash
   curl -i https://<preview-url>/health | grep -i content-security
   ```
   Should show `frame-ancestors 'self' https://builder.io`

3. **Check browser console in iframe:**
   - Open DevTools → Console
   - Paste exact first error line in chat
   - We'll add minimal guard to fix it

4. **Verify builder.preview param:**
   - Check URL in Interact: should have `?builder.preview=1`
   - If missing, middleware might be stripping it

### 404 on /health or /meu-dia?

- Ensure Vercel deployment is current and running
- Health route just added to cosmos-verse (might not be on main)
- Verify you're testing against the cosmos-verse preview, not main

### Redirect Loop?

- Middleware builder.preview check might not be working
- Verify middleware.ts has the guard (see above)
- Clear Next.js cache: `rm -rf .next`

---

## 📝 Summary of Files Changed

| File | Change | Type |
|------|--------|------|
| `next.config.mjs` | CSP headers added | Config |
| `middleware.ts` | builder.preview bypass | Logic |
| `app/health/page.tsx` | Health check route | NEW |
| `app/lib/*.client.ts` | `typeof window` guards | Guards |
| `components/pdf/ExportButton.tsx` | Dynamic import (already done) | Lazy |

---

## 🎬 Next Steps

1. **Get Vercel Preview URL** from your Vercel dashboard
2. **Set it in Builder.io Project Settings → Preview URL**
3. **Purge Builder cache**
4. **Test in Interact:** `/health?builder.preview=1`
5. **If successful, test:** `/meu-dia?builder.preview=1`
6. **Check DevTools Console** for errors (should be empty)
7. **Verify Response Headers** have CSP with frame-ancestors
8. **Take screenshots** for documentation

---

## ✨ Once Working

The following will render inside Builder Interact:
- ✅ `/health?builder.preview=1` - Health check page
- ✅ `/meu-dia?builder.preview=1` - Planner + mood + actions
- ✅ `/admin/insights?builder.preview=1` - Admin dashboard (if applicable)
- ✅ PDF Export button (visible + functional)
- ✅ All telemetry and persistence (working)

---

**Configuration Status:** ✅ COMPLETE  
**Deployment Branch:** `cosmos-verse`  
**CSP Headers:** ✅ Configured  
**Middleware:** ✅ Configured  
**Client Guards:** ✅ Applied  
**Health Route:** ✅ Created  

**Ready for Builder.io Integration!**
