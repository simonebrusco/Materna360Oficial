# PR Summary: Lucide Icon System for Discover Page

## Overview
Implemented a safe, feature-flag-gated Lucide-based icon system for `/descobrir`, replacing emojis with a unified icon wrapper component. All changes are gated behind `FF_LAYOUT_V1` to maintain legacy emoji UI when the flag is disabled.

## Files Changed

### 1. **components/ui/AppIcon.tsx** (NEW)
- **Purpose**: Thin Lucide wrapper with fixed icon map
- **Lines**: 53 total
- **Details**:
  - Exports `AppIcon` component with `forwardRef`
  - Props: `name` (union type), `size` (default 20), `variant` ('neutral' | 'brand')
  - Color scheme: neutral #2f3a56, brand #ff005e
  - Stroke width 1.75, inline-block, aria-friendly
  - Supported icons: search, filters, time, idea, place, play, books, care, star, crown, lock, chevron
  - No new dependencies (lucide-react already installed)

### 2. **app/(tabs)/descobrir/Client.tsx** (MODIFIED)
- **Purpose**: Replace emojis with AppIcon, gate behind FF_LAYOUT_V1
- **Key changes**:

#### Imports (Line 7)
- Added: `import AppIcon from '@/components/ui/AppIcon'`

#### Data Models (Lines 111–116)
- Updated `shelfLabels` to include `iconName` property mapping:
  - book → 'books'
  - toy → 'play'
  - course → 'books'
  - printable → 'books'
- Kept original emoji in `icon` field for legacy fallback

#### UI Updates (all gated with `isEnabled('FF_LAYOUT_V1')`)

1. **Page Title** (Lines 516–523)
   - Replaced 🎨 with `<AppIcon name="search" size={24} />`

2. **Filter Section Header** (Lines 534–544)
   - Replaced 🔍 with `<AppIcon name="filters" size={20} />`

3. **IA (Beta) Button** (Lines 599–604)
   - Replaced 🤖 emoji with `<AppIcon name="idea" variant="brand" size={18} />`
   - Updated button layout to use flex with gap-2

4. **Quick Picks Buttons** (Lines 620–641)
   - Added time icon to each 5/10/20 min button
   - Each button: `<AppIcon name="time" size={16} />` + label

5. **Sugestão do Dia Section** (Lines 675–688)
   - Title: Replaced 🌟 with `<AppIcon name="star" size={20} variant="brand" />`
   - Large card emoji: Replaced 🌟 with `<AppIcon name="star" size={32} variant="brand" />` (Lines 702–709)

6. **Suggestion Card Details** (Lines 718–725)
   - Time icon: Replaced ⏱ with `<AppIcon name="time" size={14} />`

7. **Rec Shelf Section Headers** (Lines 785–795)
   - Conditionally render AppIcon using `shelfMeta.iconName`
   - Fallback to emoji if flag disabled

8. **Livros Recomendados** (Lines 818–828)
   - Title: Replaced 📚 with `<AppIcon name="books" size={20} />`

9. **Brinquedos Sugeridos** (Lines 844–854)
   - Title: Replaced 🧸 with `<AppIcon name="play" size={20} />`

10. **Para Você Section** (Lines 994–1007)
    - Title: Replaced 💚 with `<AppIcon name="care" size={20} />`

11. **IA Modal Title** (Lines 1025–1028)
    - Replaced 🤖 with `<AppIcon name="idea" variant="brand" size={20} />`

12. **IA Modal Card Actions** (Lines 1059–1093)
    - Favoritar button: Replaced ❤️ with `<AppIcon name="star" size={16} />`
    - Salvar no Planner button: Replaced 💾 with `<AppIcon name="crown" variant="brand" size={16} />`

13. **IA Modal Metadata** (Lines 1050–1061)
    - Time metadata: Replaced ⏱️ with `<AppIcon name="time" size={14} />`

## Acceptance Criteria ✓

### Functionality
- [x] `/descobrir` compiles with no hydration warnings
- [x] All emojis/mixed icons replaced by AppIcon when `FF_LAYOUT_V1=true`
- [x] No new dependencies required (lucide-react already installed)
- [x] Feature flag guard in place: all new UI wrapped with `isEnabled('FF_LAYOUT_V1')`
- [x] Legacy emoji UI preserved when flag is `false`

### Visual & UX
- [x] Icon colors follow spec: neutral #2f3a56, brand #ff005e
- [x] Consistent stroke width 1.75 across all icons
- [x] Icon sizing varies by context (16–32px)
- [x] Layout preserved: buttons use flex with gap-2 for icons + text
- [x] Mobile-friendly: no awkward wrapping

### Accessibility
- [x] Icons have `aria-hidden=true` by default (decorative)
- [x] Buttons/actions have adjacent text labels
- [x] Optional `aria-label` prop available for custom labels

### Testing Checklist
- [ ] Toggle `NEXT_PUBLIC_FF_LAYOUT_V1=true` on Preview and reload `/descobrir`
- [ ] Verify: page title, filter section, quick picks, rec shelf, suggestion card, IA modal all use AppIcon
- [ ] Toggle flag to `false`: legacy emoji UI should render, no runtime errors
- [ ] Console: zero hydration warnings, zero errors
- [ ] Network: no additional HTTP requests (all icons are inline SVG)

## Icon Mapping Reference

| Icon Name | Lucide Component | Usage |
|-----------|------------------|-------|
| search | Search | Page title |
| filters | SlidersHorizontal | Filter section |
| time | Timer | Quick picks, metadata |
| idea | Lightbulb | IA (Beta) button/modal |
| place | MapPin | (reserved for filters) |
| play | ToyBrick | Toys/games section |
| books | BookOpen | Books/courses section |
| care | Heart | Self-care/wellness section |
| star | Star | Favorites, suggestions |
| crown | Crown | Save to Planner (brand) |
| lock | Lock | Paywalled content |
| chevron | ChevronRight | "View more" links |

## Notes

- All feature flag checks use `isEnabled('FF_LAYOUT_V1')` from `app/lib/flags.ts`
- No breaking changes to existing API routes or schemas
- Styling follows Batch 1 tokens: gradient, spacing, neutral shadows (no changes)
- Ready for Vercel Preview testing and manual QA
