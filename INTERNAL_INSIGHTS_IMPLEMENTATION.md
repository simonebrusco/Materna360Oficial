# 🔍 Internal Insights Implementation

**Date:** November 10, 2025  
**Branch:** `cosmos-verse`  
**Status:** ✅ Complete and ready for testing

---

## Overview

Implemented a private `/admin/insights` page for visualizing and analyzing local telemetry events. This is a **preview-only** feature designed for product decisions and debugging.

---

## Implementation Details

### 1. Flag Gating – `FF_INTERNAL_INSIGHTS`

**File:** `app/lib/flags.client.ts`

- Added `FF_INTERNAL_INSIGHTS` to the `defaultsOn` array
- Default: **ON in preview**, OFF in production
- Can be overridden via localStorage or `NEXT_PUBLIC_FF_INTERNAL_INSIGHTS` env var

```typescript
const defaultsOn = [
  'FF_EMOTION_TRENDS',
  'FF_LAYOUT_V1',
  'FF_COACH_V1',
  'FF_EXPORT_PDF',
  'FF_PAYWALL_MODAL',
  'FF_INTERNAL_INSIGHTS', // ← NEW
];
```

### 2. Local Telemetry Sink – `app/lib/telemetry.ts`

Enhanced the telemetry system to persist events to localStorage for insights visualization.

**New exports:**
- `readLocalEvents()` – retrieves all persisted events
- `clearLocalEvents()` – clears the local telemetry store
- `appendLocalEvent()` – internal function (called by `track()`)

**How it works:**
- Every time `track(name, payload)` is called, the event is appended to localStorage
- Key: `m360_telemetry_local` (localStorage)
- Max capacity: 5,000 events (older events are trimmed)
- Non-blocking, wrapped in try/catch (never breaks the app)

```typescript
const LOCAL_TEL_KEY = 'm360_telemetry_local';

function appendLocalEvent(name, payload, ts) {
  try {
    // Append event to localStorage array (max 5000)
    const arr = JSON.parse(localStorage.getItem(LOCAL_TEL_KEY)) || [];
    arr.push({ event: name, payload, ts });
    localStorage.setItem(LOCAL_TEL_KEY, JSON.stringify(arr.slice(-5000)));
  } catch { /* no-op */ }
}
```

### 3. SVG Chart Component – `components/charts/MiniBar.tsx`

A lightweight, dependency-free SVG bar chart for visualizing events per day.

**Features:**
- Pure SVG (no charting library)
- Responsive sizing (width, height, padding customizable)
- Grid lines for readability
- Responsive bar width calculation
- Accessibility: `role="img"` + `aria-label`

**Usage:**
```typescript
<MiniBar 
  values={[12, 18, 25, 16, 22, 19, 28]} 
  width={640} 
  height={160} 
/>
```

### 4. Admin Insights Page – `app/admin/insights/page.tsx`

**Route:** `/admin/insights` (new route under app/admin/)

**Features:**

#### Access Control
- Gated by `FF_INTERNAL_INSIGHTS` flag
- Shows restricted message if flag is disabled
- Safe for public preview (flag OFF in production)

#### Filters
- **Event name filter** – search by substring (e.g., "coach", "paywall")
- **Date range** – 7 days or 28 days
- **Real-time filtering** – updates chart and table as you type

#### Visualization
- **SVG bar chart** – events per day
- **Event table** – last 400 events (performance capped)
  - Timestamp (locale-aware)
  - Event name
  - Payload (JSON formatted)
  - Reverse chronological order

#### Actions
- **Export CSV** – downloads all filtered events as CSV
  - Columns: `ts`, `event`, `payload`
  - Ready for spreadsheet analysis
- **Clear data** – confirms before clearing all local telemetry
  - Useful for resetting before test sessions

#### Counters
- **Total events** – all-time count in localStorage
- **Last 24h** – recent activity indicator

---

## Data Structure

**Event format in localStorage:**
```json
{
  "event": "coach.card_view",
  "payload": {
    "id": "coach:low-mood-streak",
    "tab": "eu360"
  },
  "ts": 1731196800000
}
```

**Array stored under key:** `m360_telemetry_local`

---

## Integration with Existing Telemetry

The local sink is **automatically integrated** into the existing `track()` function. Every event that flows through `trackTelemetry()` is also persisted locally.

```typescript
export function track(name, payload) {
  const ts = Date.now();
  
  // Provider (existing)
  if (__provider) { /* ... */ }
  
  // Local sink (NEW)
  try { appendLocalEvent(name, payload, ts); } catch {}
  
  // Console + CustomEvent (existing)
  // ...
}
```

---

## UI Link (Optional)

**File:** `app/(tabs)/eu360/Client.tsx`

Added a subtle link to `/admin/insights` at the bottom of the Eu360 page (only visible when `FF_INTERNAL_INSIGHTS` is enabled).

```typescript
{isClientEnabled('FF_INTERNAL_INSIGHTS') && (
  <Link href="/admin/insights">
    <AppIcon name="activity" size={14} /> Internal Insights
  </Link>
)}
```

---

## Files Created/Modified

| File | Status | Type |
|------|--------|------|
| `app/lib/flags.client.ts` | ✅ Modified | Flag update |
| `app/lib/telemetry.ts` | ✅ Modified | Local sink integration |
| `components/charts/MiniBar.tsx` | ✅ Created | New SVG chart |
| `app/admin/insights/page.tsx` | ✅ Created | New insights page |
| `app/(tabs)/eu360/Client.tsx` | ✅ Modified | Optional link |

---

## Testing

### Local Testing
```bash
# 1. Ensure FF_INTERNAL_INSIGHTS is enabled (default in preview)
# 2. Interact with the app (click nav, check mood, etc.)
# 3. Navigate to /admin/insights
# 4. Verify:
#    - Chart shows events per day
#    - Table displays all events
#    - Filters work (event name, date range)
#    - CSV export downloads correctly
#    - Clear data button removes events
```

### Production Safety
- Flag defaults to OFF in production
- Even if enabled, only displays local analytics (no server calls)
- No PII is logged (just event names and generic payloads)
- localStorage data is isolated per domain

---

## Future Enhancements

- **Aggregate stats** – conversion funnels, drop-off analysis
- **Event heatmap** – time-of-day patterns
- **User segmentation** – cohort analysis by plan type
- **Export to external analytics** – one-click send to Google Analytics, Mixpanel, etc.

---

## Environment Setup

**For Preview:**
```bash
NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1
```

**For Production:**
```bash
NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=0  # (or omit, defaults to false)
```

---

## Security & Privacy

✅ **No external calls** – all data stored locally  
✅ **No PII tracked** – only event names and app metadata  
✅ **User-controlled** – events can be cleared anytime  
✅ **Preview-only** – flag OFF in production by default  
✅ **Non-blocking** – telemetry sink errors never affect app  

---

**Status: Ready for preview testing and deployment!** 🚀
