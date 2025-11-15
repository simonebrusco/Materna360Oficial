# Telemetry & Persistence Helpers - Complete Guide

## Overview
Two unified helper modules for consistent telemetry tracking and local data persistence across all tabs.

### Files Created
1. **`app/lib/telemetry-track.ts`** - Structured event tracking
2. **`app/lib/persist.ts`** - Local persistence with m360: namespace

---

## Part 1: Telemetry Tracking (`app/lib/telemetry-track.ts`)

### Core Function

```typescript
import { track, trackNavClick, trackCardClick, trackFilterChange } from '@/app/lib/telemetry-track'

// Main unified tracking function
track({
  event: 'mood.checkin',        // Required: event name
  tab: 'meu-dia',               // Optional: tab name
  component: 'CheckInCard',     // Optional: component name
  action: 'selected',           // Optional: action type
  id: 'feliz',                  // Optional: entity id
  payload: { duration: 2 },     // Optional: additional data
  ts: Date.now(),               // Optional: timestamp (auto-added)
})
```

### Supported Events

```typescript
// Navigation
'nav.click'

// Maternar Hub
'maternar.page_view'
'maternar.card_click'

// Planner (Meu Dia)
'planner.item_add'
'planner.item_done'

// Mood Check-in (Meu Dia)
'mood.checkin'

// Care Log (Cuidar)
'care.log_add'
'care.view_section'

// Discover Filter
'discover.filter_changed'
'discover.suggestion_started'
'discover.suggestion_saved'

// Eu360 Diary
'eu360.diary_add'
'eu360.summary_view'

// Paywall
'paywall.view'
'paywall.click'
```

### Convenience Helpers

#### Track Navigation Click
```typescript
import { trackNavClick } from '@/app/lib/telemetry-track'

trackNavClick('/meu-dia', 'Meu Dia', '/cuidar')
// Logs: { event: 'nav.click', id: '/meu-dia', payload: { href: '/meu-dia', label: 'Meu Dia', from: '/cuidar' } }
```

#### Track Card Click
```typescript
import { trackCardClick } from '@/app/lib/telemetry-track'

trackCardClick('maternar', 'Rotina da Casa', 'card-1', '/meu-dia')
// Logs: { event: 'maternar.card_click', tab: 'maternar', id: 'card-1', payload: { cardName: 'Rotina da Casa', href: '/meu-dia' } }
```

#### Track Filter Change
```typescript
import { trackFilterChange } from '@/app/lib/telemetry-track'

trackFilterChange('mood', 'calm', { mood: 'calm', time: 'now-5' })
// Logs: { event: 'discover.filter_changed', tab: 'descobrir', filterType: 'mood', filterValue: 'calm', appliedFilters: {...} }
```

### Usage Examples

**Example 1: Meu Dia Mood Check-in**
```typescript
import { track } from '@/app/lib/telemetry-track'

function MeuDiaClient() {
  const handleMoodSelect = (mood: string) => {
    track({
      event: 'mood.checkin',
      tab: 'meu-dia',
      component: 'CheckInCard',
      action: 'selected',
      id: mood,
      payload: { moodLabel: 'Feliz' },
    })
    // Update UI...
  }
}
```

**Example 2: Cuidar Care Log**
```typescript
import { track } from '@/app/lib/telemetry-track'

function QuickChildDiary() {
  const handleSaveDiary = (food: string, sleep: string, mood: string) => {
    track({
      event: 'care.log_add',
      tab: 'cuidar',
      component: 'QuickChildDiary',
      action: 'saved',
      payload: { food, sleep, mood },
    })
    // Save to localStorage...
  }
}
```

**Example 3: Descobrir Suggestion Saved**
```typescript
import { track } from '@/app/lib/telemetry-track'

function DiscoverClient() {
  const handleSaveSuggestion = (id: string, title: string) => {
    track({
      event: 'discover.suggestion_saved',
      tab: 'descobrir',
      component: 'SuggestionCard',
      action: 'saved_for_later',
      id: id,
      payload: { title },
    })
    // Save to localStorage...
  }
}
```

### How It Works
1. **Fire-and-forget**: Never blocks the UI or throws errors
2. **Dev mode**: Logs to console.debug
3. **Production**: Posts to `/api/telemetry` endpoint (non-blocking)
4. **Graceful failures**: Silently ignores network errors
5. **Timestamping**: Auto-adds current timestamp if not provided

---

## Part 2: Local Persistence (`app/lib/persist.ts`)

### Core Functions

#### Save
```typescript
import { save } from '@/app/lib/persist'

save('planner:2024-W01', { tasks: [...] })
// Stores in: localStorage['m360:planner:2024-W01']
```

#### Load
```typescript
import { load } from '@/app/lib/persist'

const planner = load('planner:2024-W01', [])
// Retrieves from: localStorage['m360:planner:2024-W01']
// Returns: parsed value or default value if not found
```

#### Remove
```typescript
import { remove } from '@/app/lib/persist'

remove('diary:2024-01-15')
// Removes: localStorage['m360:diary:2024-01-15']
```

### Recommended Key Patterns

```typescript
import { getCurrentDateKey, getCurrentWeekKey, save, load } from '@/app/lib/persist'

// Planner (per week)
save(`planner:${getCurrentWeekKey()}`, { items: [] })
// → m360:planner:2024-W02

// Mood (per week)
save(`mood:${getCurrentWeekKey()}`, { entries: [] })
// → m360:mood:2024-W02

// Diary (per day)
save(`diary:${getCurrentDateKey()}`, { food: 'bem', sleep: 'completa', mood: 'feliz' })
// → m360:diary:2024-01-15

// Care (per day)
save(`care:child:${getCurrentDateKey()}`, { entries: [] })
// → m360:care:child:2024-01-15

// Saved Discover Items
save('saved:discover', new Set(['item-1', 'item-2']))
// → m360:saved:discover
```

### Convenience Helpers

#### Append to List
```typescript
import { appendItem, loadItems } from '@/app/lib/persist'

// Add a note
appendItem('notes', { text: 'Remember milk', ts: Date.now() })

// Load all notes
const notes = loadItems('notes')
```

#### Save Timestamped Entry
```typescript
import { saveEntry } from '@/app/lib/persist'

saveEntry(`emotions:${getCurrentDateKey()}`, {
  text: 'Feeling great today',
  intensity: 4,
  // ts: auto-added if not present
})
```

#### Get Entries by Date Range
```typescript
import { getEntriesByDateRange } from '@/app/lib/persist'

const weekEntries = getEntriesByDateRange(
  'diary',
  '2024-01-08', // Start
  '2024-01-14'  // End
)
// Returns: { '2024-01-08': {...}, '2024-01-09': {...}, ... }
```

#### Export All Data
```typescript
import { exportData } from '@/app/lib/persist'

const allData = exportData()
// Returns: { 'planner:2024-W01': {...}, 'diary:2024-01-15': {...}, ... }
// Useful for debugging or data export features
```

### Usage Examples

**Example 1: Meu Dia Planner**
```typescript
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'

function FamilyPlanner() {
  const weekKey = `planner:${getCurrentWeekKey()}`
  
  const handleAddTask = (task: Task) => {
    const items = load(weekKey, [])
    items.push(task)
    save(weekKey, items)
    
    track({ event: 'planner.item_add', tab: 'meu-dia' })
  }
}
```

**Example 2: Cuidar Child Diary**
```typescript
import { save, load, getCurrentDateKey } from '@/app/lib/persist'

function QuickChildDiary() {
  const dateKey = `diary:${getCurrentDateKey()}`
  
  const handleSaveDiary = (food: string, sleep: string, mood: string) => {
    save(dateKey, { food, sleep, mood, ts: Date.now() })
    
    track({
      event: 'care.log_add',
      tab: 'cuidar',
      payload: { food, sleep, mood },
    })
  }
}
```

**Example 3: Descobrir Save for Later**
```typescript
import { save, load } from '@/app/lib/persist'

function DiscoverClient() {
  const handleSaveSuggestion = (id: string) => {
    const saved = new Set(load('saved:discover', []))
    saved.add(id)
    save('saved:discover', Array.from(saved))
    
    track({
      event: 'discover.suggestion_saved',
      id: id,
    })
  }
}
```

**Example 4: Eu360 Emotional Diary**
```typescript
import { saveEntry, getCurrentDateKey } from '@/app/lib/persist'

function EmotionalDiary() {
  const handleSaveMood = (text: string, intensity: number) => {
    saveEntry(`emotions:${getCurrentDateKey()}`, {
      text,
      intensity,
    })
    
    track({
      event: 'eu360.diary_add',
      tab: 'eu360',
      payload: { intensity },
    })
  }
}
```

### How It Works
1. **Auto-prefixing**: All keys automatically prefixed with `m360:`
2. **Safe parsing**: Invalid JSON returns defaultValue
3. **Error handling**: Logs errors but never throws
4. **Client-side only**: Checks `typeof window` before accessing localStorage
5. **Server-safe**: Safe to call in server components (no-op if not browser)

---

## Integration Checklist

### For Each Tab

**Meu Dia**
- [ ] Import `track`, `save`, `load`, `getCurrentWeekKey`
- [ ] Track: `mood.checkin` on mood selection
- [ ] Track: `planner.item_add` on task add
- [ ] Track: `planner.item_done` on task completion
- [ ] Persist: `planner:YYYY-WW`, `mood:YYYY-WW`

**Cuidar**
- [ ] Import `track`, `saveEntry`, `load`, `getCurrentDateKey`
- [ ] Track: `care.log_add` on diary save
- [ ] Track: `care.view_section` on section open
- [ ] Persist: `diary:YYYY-MM-DD`, `care:child:YYYY-MM-DD`

**Descobrir**
- [ ] Import `track`, `save`, `load`
- [ ] Track: `discover.filter_changed` on filter apply
- [ ] Track: `discover.suggestion_started` on suggestion click
- [ ] Track: `discover.suggestion_saved` on save-for-later
- [ ] Persist: `saved:discover`

**Eu360**
- [ ] Import `track`, `saveEntry`, `load`, `getCurrentDateKey`
- [ ] Track: `eu360.diary_add` on emotion entry
- [ ] Track: `eu360.summary_view` on summary load
- [ ] Persist: `emotions:YYYY-MM-DD`

**Maternar**
- [ ] Import `track`, `trackCardClick`
- [ ] Track: `maternar.page_view` on mount (already done)
- [ ] Track: `maternar.card_click` on card click

---

## Performance Notes

- **Fire-and-forget**: Telemetry never blocks the main thread
- **Async POST**: Telemetry endpoint calls use `void Promise` (detached)
- **Graceful degradation**: Network errors are silently ignored
- **localStorage access**: O(1) for read/write, O(n) for scanning all keys
- **No UI blocking**: All operations wrapped in try/catch

---

## Testing & Debugging

### View All Persisted Data
```javascript
// In browser console
import { exportData } from '@/app/lib/persist'
console.log(exportData())
```

### View Telemetry Events
```javascript
// Events logged to console in dev mode
// Check DevTools Console → Debug Messages
```

### Clear All Data
```javascript
// In browser console
import { clearAll } from '@/app/lib/persist'
clearAll() // Removes all m360: keys
```

---

## Summary

| Feature | Location | Purpose |
|---------|----------|---------|
| `track()` | `telemetry-track.ts` | Main tracking function |
| `trackNavClick()` | `telemetry-track.ts` | Convenience for nav |
| `trackCardClick()` | `telemetry-track.ts` | Convenience for cards |
| `trackFilterChange()` | `telemetry-track.ts` | Convenience for filters |
| `save()` | `persist.ts` | Save value to localStorage |
| `load()` | `persist.ts` | Load value from localStorage |
| `remove()` | `persist.ts` | Delete key from localStorage |
| `appendItem()` | `persist.ts` | Append to list |
| `loadItems()` | `persist.ts` | Load list |
| `saveEntry()` | `persist.ts` | Save timestamped entry |
| `getEntriesByDateRange()` | `persist.ts` | Query by date range |
| `exportData()` | `persist.ts` | Export all m360: data |
| `clearAll()` | `persist.ts` | Clear all m360: keys |
| `getCurrentDateKey()` | `persist.ts` | Get YYYY-MM-DD |
| `getCurrentWeekKey()` | `persist.ts` | Get YYYY-WNN |

---

## Next Steps

1. **Import in components**: Add imports to each tab's Client.tsx
2. **Replace existing calls**: Use new helpers instead of inline localStorage/telemetry
3. **Test in dev**: Verify events appear in console
4. **Test in prod**: Verify POST to /api/telemetry works
5. **Monitor**: Check analytics for event flow
