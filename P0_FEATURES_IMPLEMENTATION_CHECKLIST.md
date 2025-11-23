# P0 Features Implementation - Checklist & Progress

## Overview
Implementation of essential P0 features for all 5 main tabs with local persistence (m360: prefix) and telemetry.

## Progress Status

### ✅ COMPLETED
1. **app/hooks/useLocalStorage.ts** - Created
   - `useLocalStorage(key, initialValue)` - returns [storedValue, setValue, isLoaded]
   - `clearLocalStorageKey(key)` - helper to delete
   - `getAllLocalStorageByPrefix(prefix)` - query helper
   - All keys prefixed with `m360:` automatically

### ⏳ TODO - Components to Create

**Step 1: Core Components**
- [ ] `components/blocks/MoodSelector.tsx` (reusable 5-mood selector)
  - Moods: Triste, Neutra, Leve, Feliz, Exausta
  - Props: `selectedMood?, onMoodSelect, disabled?`
  - Styling: HScroll, soft buttons, primary color when selected
  
- [ ] `components/blocks/QuickChildDiary.tsx` (3-tap interface)
  - Tab 1: Food (Bem/Normal/Pouco)
  - Tab 2: Sleep (Noite completa/Interrompido/Péssimo)
  - Tab 3: Mood (5 moods via MoodSelector)
  - Store: `m360:diary:YYYY-MM-DD`
  - Toast: "Diário atualizado"

- [ ] `components/blocks/EmotionalDiary.tsx` (diary with intensity)
  - Text input: "Como você está se sentindo?"
  - Intensity: 0-4 scale with dots/slider
  - Show past 7 days
  - Store: `m360:emotions:YYYY-MM-DD`

- [ ] `components/blocks/OnboardingOverlay.tsx` (profile completion)
  - Check: `if (!profile.name)`
  - Title: "Complete seu perfil"
  - CTA: "Completar agora" → `/eu360#profile-form`
  - Store dismiss: `m360:onboarding-dismissed`

**Step 2: Tab Updates**

- [ ] **meu-dia/Client.tsx**
  - Add notes persistence (m360:notes:*)
  - Add mood check-in toast feedback
  - Add weekly sparkline stub (7-day placeholder chart)
  - Wire CheckInCard to localStorage

- [ ] **cuidar/Client.tsx**
  - Replace "Diário da criança" EmptyState → QuickChildDiary
  - Replace "Check-in de bem-estar" EmptyState → MoodSelector
  - Add timeline: Show last 7 days with chips
  - Styling: Use Card, category chips with icons

- [ ] **descobrir/Client.tsx**
  - Render suggestion cards from filteredSuggestions
  - Card layout: Consistent aspect ratio (use PageGrid 2-3 cols)
  - "Save for later" button on each card → localStorage m360:saved-suggestions:*
  - Empty state: "Nenhuma sugestão encontrada. Ajuste os filtros."
  - "Clear filters" button visible in empty state

- [ ] **eu360/Client.tsx**
  - Add EmotionalDiary component (above Gratitude section)
  - Wrap WeeklySummary with Skeleton component
  - State: `const [isLoadedSummary, setIsLoadedSummary] = useState(true)`
  - No layout shift: Set min-h on container

- [ ] **maternar/Client.tsx**
  - Add OnboardingOverlay at component top
  - Pass profile.name to overlay
  - Add cardClick handler: `trackTelemetry('maternar.card_click', {card: name})`
  - Update CardHub to call callback on click

### Telemetry Events to Track
- `meu-dia.mood_selected` - when mood selected
- `meu-dia.note_added` - when note saved
- `cuidar.diary_saved` - when quick diary saved
- `descobrir.suggestion_saved` - when saved for later
- `descobrir.filter_changed` - when filter applied (already in code)
- `eu360.emotion_logged` - when emotional diary saved
- `maternar.page_view` - ✅ already implemented
- `maternar.card_click` - need to add

### Local Storage Keys (m360: prefix)
```
m360:notes:* → array of notes
m360:planner:* → planner data (existing?)
m360:diary:YYYY-MM-DD → {food, sleep, mood, timestamp}
m360:emotions:YYYY-MM-DD → {text, intensity, timestamp}
m360:saved-suggestions:* → Set<string> of saved item IDs
m360:onboarding-dismissed → boolean
```

### Components to Reuse
- `CheckInCard` - has 5 moods + quote loading (extract mood logic)
- `FamilyPlanner` - already in meu-dia
- `WeeklySummary` - already in eu360 (wrap with Skeleton)
- `Card` - SoftCard alias for all card containers
- `PageGrid` - responsive grid (1-2-3 cols)
- `FilterPill` - already in descobrir
- `EmptyState` - for no results
- `Skeleton` - for loading state
- `Button` - primary/secondary actions
- `AppIcon` - Lucide icons only

### Design Guidelines
- All components use Soft Luxury tokens (rounded-[var(--radius-card)], border-white/60, shadow tokens)
- No custom emojis in headings (use AppIcon)
- Mobile first (360px+)
- Responsive typography (clamp values)
- pb-24 safe area on page wrappers (already in place)
- Toast feedback for actions via useToast hook

### Testing Checklist
- [ ] All localStorage keys persist correctly with m360: prefix
- [ ] Telemetry events fire on correct actions
- [ ] Toast feedback shows on save actions
- [ ] No layout shift on skeleton loading
- [ ] Mobile responsive (360px+)
- [ ] Onboarding shows only once (dismiss logic)
- [ ] Filter changes <100ms (descobrir)
- [ ] All Lucide icons (no emojis in UI headings)

## Implementation Order (Recommended)
1. Create MoodSelector.tsx
2. Create QuickChildDiary.tsx
3. Create EmotionalDiary.tsx
4. Create OnboardingOverlay.tsx
5. Update meu-dia/Client.tsx
6. Update cuidar/Client.tsx
7. Update descobrir/Client.tsx
8. Update eu360/Client.tsx
9. Update maternar/Client.tsx

## Files Modified So Far
- ✅ app/hooks/useLocalStorage.ts (created)

## Memory References
- mem-3c4e02: Implementation plan with file list
- mem-bbf8e0: Detailed component specifications
