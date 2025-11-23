# Manual Testing Guide: Telemetry & Persistence

## Quick Start
1. Open app at deployed URL
2. Open DevTools (F12 → Console)
3. Navigate through each tab and perform actions
4. Verify console logs and localStorage updates

## Test Cases

### /meu-dia - Mood Check-in & Planner

#### Test 1: Mood Check-in Telemetry
**Action**: Click any mood pill (e.g., "Muito bem")
**Expected Results**:
- ✅ Console: `[telemetry] mood.checkin { event: 'mood.checkin', tab: 'meu-dia', payload: { value: 4, dayIndex: <0-6> } }`
- ✅ Toast: "Humor registrado! Um passo de cada vez é o suficiente."
- ✅ localStorage `m360:mood:2025-WXX` updated with array containing value at [dayIndex]
- ✅ Sparkline chart updates with new point

#### Test 2: Mood Persistence
**Action**: 
1. Select a mood (e.g., value: 3 at dayIndex: 2)
2. Refresh page (Cmd+R or F5)
3. Check /meu-dia again
**Expected Results**:
- ✅ Mood pill still shows as selected
- ✅ Sparkline still shows 7 points with data point at day 2
- ✅ localStorage key `m360:mood:2025-WXX` has persistent data

#### Test 3: Planner Item Added
**Action**: Click "Adicionar item" in Planner section
1. Fill in "Lavar louça"
2. Click "Salvar"
**Expected Results**:
- ✅ Console: `[telemetry] planner.item_add { event: 'planner.item_add', tab: 'meu-dia', ... }`
- ✅ Toast shows success
- ✅ Item appears in list
- ✅ localStorage `m360:planner:2025-WXX` updated

#### Test 4: Planner Item Completed
**Action**: Click checkbox on a planner item
**Expected Results**:
- ✅ Console: `[telemetry] planner.item_done { event: 'planner.item_done', tab: 'meu-dia', ... }`
- ✅ Item shows as strikethrough
- ✅ localStorage updated with done=true

---

### /descobrir - Filters & Save for Later

#### Test 5: Filter Changed Event
**Action**: 
1. Click a mood filter (e.g., "Ativo")
2. Wait for list to update
**Expected Results**:
- ✅ Console: `[telemetry] discover.filter_changed { event: 'discover.filter_changed', tab: 'descobrir', payload: { filter: "mood", value: "ativo" } }`
- ✅ Suggestion list updates (filters applied)
- ✅ No layout shift (smooth transition)

#### Test 6: Suggestion Saved
**Action**: Click bookmark icon on any suggestion card
**Expected Results**:
- ✅ Console: `[telemetry] discover.suggestion_saved { event: 'discover.suggestion_saved', tab: 'descobrir', payload: { id: "...", isSaved: true } }`
- ✅ Bookmark icon fills with primary color
- ✅ Toast: "Ideia salva com sucesso! Você pode acessá-la mais tarde em 'Salvos'."
- ✅ localStorage `m360:saved:discover` updated with ID array

#### Test 7: Bookmark Toggle
**Action**: Click bookmark icon again to unsave
**Expected Results**:
- ✅ Console: `[telemetry] discover.suggestion_saved { ..., isSaved: false }`
- ✅ Bookmark icon returns to outline
- ✅ No toast this time (toast only on save, not unsave)
- ✅ localStorage updated (ID removed from array)

#### Test 8: Empty State Filter
**Action**: 
1. Set filters that yield no results (e.g., location + time that don't match)
2. Observe empty state
3. Click "Limpar filtros" button
**Expected Results**:
- ✅ Empty state shows: "Nenhum resultado encontrado."
- ✅ CTA button "Limpar filtros" visible
- ✅ Clicking clears all filters
- ✅ List re-renders with all suggestions

---

### /eu360 - Emotional Diary

#### Test 9: Diary Entry Added
**Action**:
1. Type in textarea: "Sinto-me calmo e focado hoje."
2. Set intensity slider to 3 (Feliz)
3. Click "Salvar registro"
**Expected Results**:
- ✅ Console: `[telemetry] eu360.diary_add { event: 'eu360.diary_add', tab: 'eu360', payload: { intensity: 3, chars: 31 } }`
- ✅ Toast: "Diário atualizado! Este é um momento só seu."
- ✅ Textarea clears
- ✅ Slider resets to 2 (Neutro)
- ✅ Entry appears in History section

#### Test 10: Diary Persistence
**Action**:
1. Make 2-3 diary entries with different text and intensity
2. Refresh page
3. Check /eu360 again
**Expected Results**:
- ✅ All entries appear in History (reverse chronological)
- ✅ Each entry shows day label, text preview (60 chars), and intensity dots
- ✅ localStorage `m360:diary:2025-WXX` has all entries

#### Test 11: No Layout Shift
**Action**:
1. Visit /eu360 for first time (no diary data)
2. Observe Skeleton loading on History section
3. Wait for data to load
**Expected Results**:
- ✅ Skeleton shows while loading (gray placeholder boxes)
- ✅ No content shift when real data appears
- ✅ Smooth transition from Skeleton → History list

---

### /cuidar - Quick Child Logs

#### Test 12: Quick Log Entry
**Action**: Click "Completou" in Alimentação group
**Expected Results**:
- ✅ Console: `[telemetry] care.log_add { event: 'care.log_add', tab: 'cuidar', payload: { type: 'alimentacao', value: 'Completou' } }`
- ✅ Toast: "Registro salvo!"
- ✅ Entry appears immediately in Timeline section
- ✅ Timestamp shows formatted time (HH:MM)

#### Test 13: Quick Logs Timeline
**Action**:
1. Tap 5-6 different chips: Alimentação options, Sono options, Humor options
2. Observe Timeline updates
**Expected Results**:
- ✅ Each tap fires `care.log_add` event
- ✅ Each entry appears in Timeline (newest at top)
- ✅ Timeline shows reverse chronological order
- ✅ Each entry: icon (brand colored) + type + value + time

#### Test 14: Quick Logs Persistence by Date
**Action**:
1. Add entries to /cuidar on current date
2. Wait until tomorrow (or change system date)
3. Add different entries
4. Go back to yesterday's log
**Expected Results**:
- ✅ localStorage has separate keys for each date:
  - `m360:care:child:2025-01-14` (yesterday's entries)
  - `m360:care:child:2025-01-15` (today's entries)
- ✅ Timeline shows only today's entries
- ✅ Entries don't bleed between days

#### Test 15: Mobile Responsiveness
**Action**: Test on 360-414px viewport
**Expected Results**:
- ✅ Mood pills wrap horizontally (HScroll)
- ✅ Chip labels abbreviate to 3 chars on small screens
- ✅ No horizontal overflow
- ✅ All taps register (40px+ tap targets)
- ✅ Focus rings visible on all buttons

---

## Browser DevTools Inspection

### Step 1: Open Application → Local Storage
```
Expected keys (with m360: prefix):
- m360:planner:2025-W01
- m360:mood:2025-W01
- m360:diary:2025-W01
- m360:care:child:2025-01-15
- m360:saved:discover
```

### Step 2: Open Console Tab
```javascript
// Filter by: [telemetry]
// You should see events like:
[telemetry] mood.checkin {...}
[telemetry] discover.suggestion_saved {...}
[telemetry] eu360.diary_add {...}
[telemetry] care.log_add {...}
```

### Step 3: Test localStorage Persistence
```javascript
// In Console, run:
JSON.parse(localStorage.getItem('m360:mood:2025-W01'))
// Should return array of mood values

JSON.parse(localStorage.getItem('m360:saved:discover'))
// Should return array of saved suggestion IDs
```

---

## Acceptance Sign-Off Checklist

- [ ] All 7 telemetry events fire with correct payloads (one per action)
- [ ] No duplicate events in console
- [ ] All 5 localStorage keys exist with m360: prefix
- [ ] Data persists after page reload
- [ ] Data persists after browser close/reopen
- [ ] No UI blocking (all interactions feel instant)
- [ ] All color contrast passes AA (4.5:1)
- [ ] All focus rings visible (Cmd+Tab navigation)
- [ ] All toasts appear with correct messages
- [ ] Empty states display correctly
- [ ] Timeline entries update in real-time
- [ ] Mobile responsive at 360px viewport

---

## Troubleshooting

### Telemetry Not Showing in Console
- ✅ Check: Is dev mode? (logs only in dev, not prod)
- ✅ Check: Console filter? (search for "[telemetry]")
- ✅ Check: Did you trigger the action? (click/tap required)
- ✅ Network tab: Look for POST to `/api/telemetry` (fire-and-forget)

### localStorage Not Updating
- ✅ Check: DevTools → Application → Local Storage
- ✅ Check: Is key prefixed with `m360:`?
- ✅ Check: Did page reload happen after save?
- ✅ Check: Browser allows localStorage? (private mode may disable)

### Data Disappearing After Reload
- ✅ Check: Correct key format? (`m360:` prefix required)
- ✅ Check: Same week/day? (keys include YYYY-WW or YYYY-MM-DD)
- ✅ Check: JSON parse error? (check console for errors)

---

## Success Criteria

✅ **Telemetry**: All 7 events fire once per action with correct payloads  
✅ **Persistence**: All 5 keys exist, data survives reload and browser restart  
✅ **Performance**: No UI blocking, all interactions instant  
✅ **Accessibility**: AA contrast, focus visible, keyboard navigable  
