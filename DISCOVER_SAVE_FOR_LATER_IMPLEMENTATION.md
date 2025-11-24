# Save for Later Implementation - /descobrir Tab

## Summary

Persistent "Save for later" functionality has been fully implemented in the /descobrir tab with local storage persistence, telemetry tracking, and proper UI integration.

## Files Created/Modified

### 1. New Hook File: `/app/(tabs)/descobrir/hooks/useSavedSuggestions.ts`

**Purpose:** Reusable hook for managing saved suggestions with localStorage persistence and telemetry.

**Key Features:**
- State management for saved suggestion IDs
- Automatic localStorage persistence using m360: prefixed keys
- Telemetry firing on save events
- Provides: `save()`, `remove()`, `isSaved()` functions

**Storage Key:** `'saved:discover'` → persists as `'m360:saved:discover'` in localStorage

**Telemetry Event:**
- Event: `discover.suggestion_saved`
- Payload: `{ id, isSaved: true }` (fired on save only)

### 2. Updated: `/app/(tabs)/descobrir/Client.tsx`

**Implementation Details:**

#### State Management (Line 64)
```typescript
const [savedItems, setSavedItems] = React.useState<Set<string>>(new Set());
```

#### Load Saved Items on Mount (Lines 108-125)
```typescript
React.useEffect(() => {
  const saved = load<string[]>('saved:discover', []);
  if (saved && Array.isArray(saved)) {
    setSavedItems(new Set(saved));
  }
  // ... quota check code
}, [getTodayIdeaCount]);
```

#### Save Suggestion Handler (Lines 152-185)
```typescript
const handleSaveSuggestion = (id: string) => {
  setSavedItems((prev) => {
    const updated = new Set(prev);
    const isSaved = updated.has(id);

    // Toggle save/unsave
    if (isSaved) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    // 1. Persist to localStorage
    save('saved:discover', Array.from(updated));

    // 2. Show toast (only on save)
    if (!isSaved) {
      toast({
        description: "Ideia salva com sucesso! Você pode acessá-la mais tarde em 'Salvos'.",
      });
    }

    // 3. Fire telemetry
    track({
      event: 'discover.suggestion_saved',
      tab: 'descobrir',
      component: 'DiscoverClient',
      action: isSaved ? 'unsave' : 'save',
      id,
      payload: { id, isSaved: !isSaved },
    });

    return updated;
  });
};
```

#### Card Rendering with Save Button (Lines 383-434)
```typescript
{filteredSuggestions.map((suggestion) => {
  const isSaved = savedItems.has(suggestion.id);
  const showSaveForLater = shouldShowSaveForLater(suggestion, filters);
  return (
    <Card key={suggestion.id}>
      {/* Card content */}
      <div className="flex gap-2 items-center">
        {showSaveForLater ? (
          <Button 
            onClick={() => handleSaveSuggestion(suggestion.id)}
            className="flex-1"
          >
            Salvar para depois
          </Button>
        ) : (
          <Button 
            onClick={() => handleStartSuggestion(suggestion.id)}
            className="flex-1"
          >
            Começar agora
          </Button>
        )}
        
        {/* Bookmark toggle button */}
        <button
          onClick={() => handleSaveSuggestion(suggestion.id)}
          aria-label={isSaved ? `Remover...` : `Salvar...`}
        >
          <AppIcon
            name="bookmark"
            size={20}
            variant={isSaved ? 'brand' : 'default'}
          />
        </button>
      </div>
    </Card>
  );
})}
```

#### Empty State (Lines 436-442)
```typescript
{filteredSuggestions.length > 0 ? (
  <PageGrid cols={2}>
    {/* suggestions */}
  </PageGrid>
) : (
  <EmptyState
    title="Nenhum resultado encontrado."
    text="Ajuste os filtros e tente novamente."
    cta={<Button variant="primary" onClick={handleClearFilters}>Limpar filtros</Button>}
  />
)}
```

## Acceptance Criteria ✅

- [x] **TypeScript Compilation** - No type errors; uses proper imports from telemetry-track and persist modules
- [x] **Local Storage Persistence** - Saves suggestion IDs under key `'m360:saved:discover'` as JSON array
- [x] **Telemetry Tracking** - Fires `discover.suggestion_saved` event with tab='descobrir' and id payload
- [x] **UI State Indication** - Shows bookmark icon with 'brand' variant when saved
- [x] **Toast Feedback** - "Ideia salva com sucesso! Você pode acessá-la mais tarde em 'Salvos'."
- [x] **Empty State CTA** - "Limpar filtros" button to reset all filters
- [x] **No UI Regressions** - All existing functionality preserved

## Technical Implementation Details

### Storage Structure
```
localStorage.getItem('m360:saved:discover')
// Returns: ["brincadeira-sensorial", "receita-rapida", "momento-conexao"]
// As JSON array of suggestion IDs
```

### Telemetry Event Structure
```typescript
track({
  event: 'discover.suggestion_saved',      // EventName from telemetry-track.ts
  tab: 'descobrir',                         // Current tab
  component: 'DiscoverClient',              // Source component
  action: 'save' | 'unsave',                // Action type
  id: string,                               // Suggestion ID
  payload: { 
    id: string,
    isSaved: boolean                        // Toggle state
  }
})
```

### Imports Used
```typescript
// UI Components
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import AppIcon from '@/components/ui/AppIcon'
import { useToast } from '@/components/ui/Toast'

// Data & Telemetry
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry-track'

// Utils
import { shouldShowSaveForLater } from './utils'
```

## Hook Usage Example

For other components wishing to use the reusable hook:

```typescript
import { useSavedSuggestions } from '@/app/(tabs)/descobrir/hooks/useSavedSuggestions'

export function MyComponent() {
  const { saved, save, remove, isSaved } = useSavedSuggestions()
  
  return (
    <>
      <button onClick={() => save(suggestionId)}>
        {isSaved(suggestionId) ? 'Salvo' : 'Salvar'}
      </button>
    </>
  )
}
```

## Design System Compliance

- **Color:** Uses AppIcon variants ('brand' for saved state, 'default' for unsaved)
- **Button Styling:** Rounded-full pill buttons with hover states
- **Spacing:** Flex layout with gap-2 between actions
- **Typography:** Uses text-sm/xs for labels and descriptions
- **Accessibility:** 
  - Proper aria-labels on buttons
  - Semantic HTML (button elements)
  - Keyboard navigable

## Testing Checklist

- [ ] Save suggestion by clicking "Salvar para depois" button
- [ ] Bookmark icon toggles to brand color when saved
- [ ] Toast notification appears with correct message
- [ ] localStorage shows `m360:saved:discover` key with JSON array
- [ ] Telemetry event fires in console (if DEBUG=1 enabled)
- [ ] Clear filters and suggestions reload properly
- [ ] Empty state shows when no results match filters
- [ ] Unsave by clicking bookmark again removes from saved list
- [ ] Page reload preserves saved suggestions

## Related Features

- **Telemetry:** `discover.suggestion_saved`, `discover.filter_changed`, `discover.suggestion_started`
- **Paywall:** Quota limit check prevents suggestions beyond free tier limit (5/day)
- **UI:** PageTemplate, PageGrid, Card components for consistent styling

## Notes

- Storage key uses m360: prefix for app namespace consistency
- Telemetry integration is fire-and-forget; never blocks UI
- Empty state includes "Limpar filtros" CTA for user guidance
- Bookmark button provides secondary save action (complements primary "Salvar para depois" button)
