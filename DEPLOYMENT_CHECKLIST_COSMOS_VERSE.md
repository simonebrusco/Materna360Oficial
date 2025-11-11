# Cosmos-Verse Deployment Checklist

## Status: ✅ Code Ready for Deployment

All code changes for hard-safe Builder embed mode and type fixes are complete on `cosmos-verse` branch.

---

## Pre-Deployment Verification (Code Level)

### ✅ Verified Configuration

**next.config.mjs:**
```javascript
// CSP headers correctly configured
frame-ancestors 'self' https://builder.io https://*.builder.io
```

**package.json:**
```json
{
  "packageManager": "pnpm@10.19.0",
  "engines": { "node": ">=20 <21" },
  "scripts": {
    "dev": "next dev -p 3001",
    "prebuild": "node scripts/check-no-emoji.js",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

**Routes verified (all exist):**
- ✅ `/builder-embed` (new)
- ✅ `/meu-dia`
- ✅ `/eu360`
- ✅ `/cuidar`
- ✅ `/descobrir`
- ✅ `/admin/insights`
- ✅ `/health`

**Feature flags implemented:**
- ✅ `FF_PDF_EXPORT` - Controls ExportButton visibility
- ✅ `FF_COACH_V1` - Coach suggestion card visibility
- ✅ `FF_INTERNAL_INSIGHTS` - Admin insights page access
- ✅ `FF_EMOTION_TRENDS` - Emotion trend drawer

**TypeScript fixes applied:**
- ✅ `DEFAULT_PROFILE` uses `age: 36` (not `ageMonths`)
- ✅ Builder embed fallback profile aligned

---

## Step 1: Local Build Verification (Run Locally)

```bash
# Navigate to project root
cd /path/to/materna360

# Verify Node version
node --version  # Should be 20.x

# Verify pnpm version
pnpm --version  # Should be 10.19.0 (or compatible 8.15.5+)

# Install dependencies
pnpm install

# Run build
pnpm run build

# Expected output:
# ✓ prebuild (emoji check, warnings OK)
# ✓ tsc --noEmit (0 errors)
# ✓ next build (SUCCESS)
# ✓ .next/ directory created
```

**If prebuild warns about emojis:**
- ✅ This is expected and **non-blocking**
- `STRICT_EMOJI` is empty (warn-only mode)
- Build continues normally

**If TypeScript errors appear:**
- ❌ STOP - fix before proceeding
- Expected: 0 errors

---

## Step 2: Vercel Preview Environment Setup

**IMPORTANT:** These steps require Vercel dashboard access.

### 2.1 Set Preview Environment Variables

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

Add/update the following for the **Preview** environment:

```
NEXT_PUBLIC_FF_PDF_EXPORT=1
NEXT_PUBLIC_FF_COACH_V1=1
NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1
NEXT_PUBLIC_FF_EMOTION_TRENDS=1
```

(Keep any existing vars like `NEXT_PUBLIC_BUILDER_API_KEY`, `NEXT_PUBLIC_SUPABASE_*`, etc.)

**Set scope to:**
- ✅ **Preview** (deployments from PRs)
- ✅ **Production** (production deployments)
- ✅ **Development** (local dev - `pnpm dev`)

### 2.2 Verify Production Variables

Ensure these still exist (should be already set):
- `NEXT_PUBLIC_BUILDER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_AUDIO_BASE`

### 2.3 Check Build Settings

Go to: **Vercel Dashboard → Project Settings → Build & Development Settings**

Verify:
```
Framework: Next.js
Build Command: pnpm run build
Output Directory: .next
Install Command: pnpm install --frozen-lockfile
```

---

## Step 3: Trigger New Preview Deployment

### Option A: From GitHub (Recommended)

1. Go to your GitHub repo: `https://github.com/simonebrusco/Materna360Oficial`
2. Navigate to **Pull Requests** → Find PR #120 (or create one if needed)
3. Vercel will automatically create a Preview deployment
4. Wait for deployment to complete (usually 2-5 minutes)
5. Check Vercel comment on PR for **Preview URL**

### Option B: Revert & Redeploy from Vercel

1. Go to **Vercel Dashboard → Deployments**
2. Find latest `cosmos-verse` deployment
3. Click **Redeploy** to trigger a fresh build with new env vars

### Option C: Manual from GitHub

1. Go to **GitHub → Actions → (workflow for cosmos-verse)**
2. Manual trigger if available (depends on workflow setup)

**Wait for deployment status: ✅ READY**

---

## Step 4: Capture Preview URL

Once deployment is complete, you will see:

```
Preview URL: https://[random-id].vercel.app
```

**Save this URL** — you'll need it for smoke tests.

---

## Step 5: Smoke QA Tests

### 5.1 Route Accessibility (should all return 200)

Test each route with the Preview URL from Step 4:

```
https://[preview-url]/health
https://[preview-url]/builder-embed?builder.preview=1
https://[preview-url]/meu-dia
https://[preview-url]/eu360
https://[preview-url]/cuidar
https://[preview-url]/descobrir
https://[preview-url]/admin/insights
```

**Expected**: All return 200 status code (visible content)

### 5.2 Visual Checks

#### Test: /builder-embed?builder.preview=1
- [ ] Page loads (not blank)
- [ ] Header visible: "Meu Dia (Builder Preview)"
- [ ] Daily greeting visible
- [ ] Mood/energy selector visible
- [ ] Planner section visible
- [ ] Bottom navigation visible
- [ ] Dark text (#111) readable on pink background

#### Test: /meu-dia
- [ ] Page loads with full Meu Dia UI
- [ ] Daily message card visible
- [ ] Check-in card visible
- [ ] **"Export as PDF (Beta)" button visible**
- [ ] Bottom navigation visible
- [ ] Text is readable

#### Test: /eu360
- [ ] Profile form section visible
- [ ] Achievements section visible (if coach flag enabled)
- [ ] Gratitude section visible
- [ ] Emotion trend section visible (if flag enabled)

#### Test: /cuidar, /descobrir
- [ ] Both pages load and render content
- [ ] No blank screens

#### Test: /admin/insights
- [ ] Page loads (should show data or "Feature disabled" if flag off)
- [ ] Check DevTools console for errors

### 5.3 PDF Export Test (Critical)

On `/meu-dia` page:

1. **Look for button:** "Export as PDF (Beta)" (or similar)
   - If not visible → Check if `NEXT_PUBLIC_FF_PDF_EXPORT=1` is set
   
2. **Click button:**
   - UI should show loading state briefly
   - A PDF file should download
   
3. **Verify PDF:**
   - File name: `wellness-report-YYYY-MM-DD.pdf` (or similar)
   - File size: 100-500 KB (typical)
   - File is readable PDF (not corrupted)

### 5.4 Console Checks

Open **DevTools Console** (F12) while on each page:

```javascript
// Check for errors (should see none in red)
// Console should show:
// - No "ageMonths" errors ✅
// - No "Cannot read properties of null" ✅
// - Warnings OK (e.g., emoji warnings)

// Check Builder mode flag (if on /builder-embed)
console.log(window.__BUILDER_MODE__)  // Should be true
console.log(window.__BUILDER_LAST_ERROR__)  // Should be undefined (no errors)

// Check telemetry is working (if enabled)
// Look for logs starting with [telemetry]
```

---

## Artifact Collection

### Screenshots to Capture

1. **Preview URL** (save the actual URL)
   ```
   https://[random-id].vercel.app
   ```

2. **Screenshot of /meu-dia**
   - Full page visible
   - Header, message card, check-in, export button visible
   - Bottom nav visible

3. **Screenshot of /builder-embed?builder.preview=1**
   - Full preview visible in light mode
   - All sections (header, greeting, mood, planner, nav)

4. **PDF Export Evidence**
   - Screenshot showing "Export as PDF (Beta)" button
   - Screenshot of downloaded PDF file (name, size)
   - Optional: PDF file size in KB (typical: 100-500 KB)

### Success Checklist Template

```markdown
✅ A1: Build succeeds without TS errors
   - Local build: PASSED
   - Vercel deployment: COMPLETED

✅ A2: New Vercel Preview URL
   - URL: https://[preview-id].vercel.app
   - Status: READY

✅ A3: All routes return 200 and render
   - /health: 200 ✓
   - /builder-embed?builder.preview=1: 200 ✓
   - /meu-dia: 200 ✓
   - /eu360: 200 ✓
   - /cuidar: 200 ✓
   - /descobrir: 200 ✓
   - /admin/insights: 200 ✓

✅ A4: PDF export works
   - Flag enabled: NEXT_PUBLIC_FF_PDF_EXPORT=1
   - Button visible: YES
   - PDF downloads: SUCCESS
   - File size: ~XXX KB
   - PDF readable: YES

✅ A5: Console clean
   - No red errors
   - No ageMonths errors
   - Builder mode flag present (if /builder-embed)
```

---

## If Build Fails

### Common Issues & Fixes

#### Issue: "ageMonths does not exist"
- **Fix applied**: Changed to `age: 36` in DEFAULT_PROFILE
- **Status**: ✅ Fixed

#### Issue: Emoji warnings block build
- **Expected behavior**: Warnings only (non-blocking)
- **If build blocked**:
  - Check `STRICT_EMOJI=1` is NOT set
  - Should be empty or unset for warn-only mode

#### Issue: PDF export button missing
- **Check**: Is `NEXT_PUBLIC_FF_PDF_EXPORT=1` set in Preview env?
- **Verify**: `isEnabled('FF_PDF_EXPORT')` returns true
- **Re-deploy**: Trigger new deployment after setting env var

#### Issue: TypeScript errors on build
- **Report exact error** (copy error message)
- **Common**: Import errors, missing types
- **Fix**: May need code changes on cosmos-verse branch

---

## Deployment Flow Diagram

```
cosmos-verse branch (code ready) ✅
            ↓
Run local: pnpm install && pnpm build
            ↓ (if successful)
Set Preview env vars in Vercel Dashboard
            ↓
Trigger new Preview deployment (GitHub PR or Vercel)
            ↓ (wait 2-5 min)
Copy Preview URL from Vercel
            ↓
Run smoke tests on Preview URL
            ↓
Capture screenshots & test results
            ↓
Report: DEPLOYED ✅
```

---

## Next Steps (After Deployment)

1. ✅ Get Preview URL
2. ✅ Run smoke tests
3. ✅ Capture screenshots
4. ✅ Verify PDF export works
5. ⬜ Share results in PR/ticket
6. ⬜ When ready: Merge PR to main
7. ⬜ Monitor production deployment

---

## Support

**Build fails locally?**
- Check Node 20.x: `node --version`
- Check pnpm 10.19.0: `pnpm --version`
- Clear cache: `rm -rf .next node_modules pnpm-lock.yaml` then `pnpm install`

**Preview URL not created?**
- Check GitHub PR has Vercel comment
- Check Vercel Dashboard → Deployments
- May take 2-5 minutes

**PDF not downloading?**
- Check DevTools Network tab for `POST /api/pdf...` requests
- Check console for errors
- Ensure @react-pdf/renderer is installed

**Routes return blank?**
- Check browser console for errors
- Verify CSP headers allow your domain
- Check feature flags are enabled for the route

---

## Deployment Checklist (Print & Check Off)

- [ ] Node 20.x installed locally
- [ ] pnpm 10.19.0 installed
- [ ] Local build succeeds: `pnpm build`
- [ ] Vercel env vars set (FF_PDF_EXPORT=1, etc.)
- [ ] New Preview deployment triggered
- [ ] Preview URL obtained
- [ ] All 7 routes tested (200 status)
- [ ] /meu-dia renders with Export button
- [ ] PDF exports successfully
- [ ] Console clean (no red errors)
- [ ] /builder-embed renders full preview
- [ ] Screenshots captured
- [ ] Results documented

---

**Status**: ✅ Ready to deploy when Vercel credentials available
**Preview Time**: ~5-10 minutes (Vercel build time)
**QA Time**: ~10-15 minutes (manual testing)
**Total**: ~30-40 minutes start to finish
