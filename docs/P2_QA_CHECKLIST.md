# P2 QA Checklist

## Build & Type Safety

- [ ] ✅ `pnpm i --frozen-lockfile` — dependencies install cleanly
- [ ] ✅ `pnpm exec tsc --noEmit` — 0 TypeScript errors
- [ ] ✅ `pnpm run build` — production build succeeds
- [ ] ✅ Emoji checker: non-blocking warnings only (no emoji in UI headings)
- [ ] ✅ All routes compile without errors

---

## A) Discover Smart Filters

### Visual & Interaction Tests (Mobile 360–414px)

- [ ] Load `/descobrir` → see full catalog (10 items) displayed by default
- [ ] See 4 filter sections:
  - [ ] "Quanto tempo você tem agora?" (Time: 5/15/30 min, Depois)
  - [ ] "Onde você está?" (Location: Em casa, Ao ar livre)
  - [ ] "Como você está agora?" (Mood: Calma, Foco, Leve, Energia)
- [ ] **Time Filter → 5 min:**
  - [ ] Click "5 min" pill
  - [ ] List re-filters: only show items with `durationMin ≤ 5`
  - [ ] Items > 5 min show "Salvar para depois" instead of "Começar agora"
  - [ ] No full page reload (smooth client-side update)
  - [ ] Active filter pill appears at top with "✕" close button
- [ ] **Location Filter → Ao ar livre:**
  - [ ] Click "Ao ar livre" pill
  - [ ] Outdoor activities move to top of list
  - [ ] No full page reload
  - [ ] Active filter pill appears at top
- [ ] **Mood Filter → Calma:**
  - [ ] Click "Calma" pill
  - [ ] Low-energy activities prioritized
  - [ ] No full page reload
  - [ ] Active filter pill appears at top
- [ ] **Multiple Filters Active:**
  - [ ] Apply 2–3 filters simultaneously
  - [ ] All active filter pills display in a row
  - [ ] Each pill has a "✕" close button (removes individual filter)
  - [ ] "Limpar tudo" button visible (removes all filters at once)
  - [ ] List re-ranks correctly for combined filters
- [ ] **Clear All Filters:**
  - [ ] Click "Limpar tudo"
  - [ ] All filter pills disappear
  - [ ] Full catalog (10 items) visible again
  - [ ] No full page reload
- [ ] **Empty State:**
  - [ ] Apply filters that result in 0 items
  - [ ] "Nenhuma ideia encontrada" message appears
  - [ ] "Limpar filtros" button visible (not "Clear All")
  - [ ] Click "Limpar filtros"
  - [ ] Empty state closes; full catalog visible again
- [ ] **No Filter State:**
  - [ ] Refresh page with no filters active
  - [ ] See all 10 items
  - [ ] No filter pills at top (clean state)

### CTA & Copy Tests

- [ ] **One Primary CTA per Card:**
  - [ ] Items ≤ time window: single "Começar agora" button
  - [ ] Items > time window: single "Salvar para depois" button
  - [ ] Never see both buttons on same card
  - [ ] "Detalhes" is a secondary link (not a button)
- [ ] **Copy is PT-BR:**
  - [ ] All headings, pill labels, empty state copy in Portuguese
  - [ ] No English text in UI
- [ ] **Button States:**
  - [ ] "Começar agora" is clickable, shows hover state
  - [ ] "Salvar para depois" is clickable, shows hover state
  - [ ] "Detalhes" link is styled as link (no button appearance)

### Telemetry & Console

- [ ] Open DevTools Console
- [ ] Click a filter pill
  - [ ] See console log: `[telemetry] discover.filter_changed { filterType: "..." }`
- [ ] Click "Começar agora"
  - [ ] See console log: `[telemetry] discover.suggestion_started { suggestionId: "..." }`
- [ ] Click "Salvar para depois"
  - [ ] See console log: `[telemetry] discover.suggestion_saved { suggestionId: "..." }`

---

## B) Eu360 Plan Card & Feature Gates

### Plan Card Tests (Mobile 360–414px)

- [ ] Load `/eu360` → scroll to "Seu Plano" section
- [ ] **Free Plan Display:**
  - [ ] See "Plano Gratuito" header with place icon (teal color)
  - [ ] Badge: "Limites: 3 ideias/dia, 1 jornada ativa" (subtle red text)
  - [ ] Benefits list (3 items):
    - [ ] ✓ 3 ideias por dia
    - [ ] ✓ 1 jornada ativa
    - [ ] ✓ Registrar humor diário
  - [ ] Each benefit has checkmark icon (primary color)
  - [ ] Primary CTA: "Conheça os planos" button (full width on mobile)
  - [ ] Button is clickable → navigates to `/planos`
- [ ] **Card Styling:**
  - [ ] Rounded corners (2xl)
  - [ ] White background with subtle border
  - [ ] Neutral shadow (not pink)
  - [ ] Responsive padding (p-5 mobile, p-6+ desktop)

### Feature Gate Tests (Mobile 360–414px)

- [ ] Scroll to "Exportar Relatório" section
- [ ] **On Free Plan:**
  - [ ] Card content is blurred/dimmed (opacity-60 or backdrop-blur)
  - [ ] Overlay appears with crown icon (brand color)
  - [ ] Overlay text: "Exportar em PDF" (feature label)
  - [ ] Overlay subtitle: "Recurso do plano Plus ou Premium"
  - [ ] Overlay button: "Conheça os planos" (clickable, goes to /planos)
  - [ ] Overlay is centered and readable (good contrast)
  - [ ] No interaction with blurred content behind overlay
- [ ] **Change Plan to Plus (mock data):**
  - [ ] Gate overlay disappears
  - [ ] Full card content visible (not blurred)
  - [ ] "Exportar PDF desta semana" button visible and clickable
- [ ] **Change Plan to Premium (mock data):**
  - [ ] Same as Plus (gate removed, full content visible)

### No Breaking Changes

- [ ] All existing sections still render (Conquistas, Gratidão, etc.)
- [ ] No layout breaks or overflow
- [ ] Navigation to other tabs still works
- [ ] Back-end calls not affected (gates are UI-only)

---

## C) Eu360 Weekly Summary 2×2 Grid

### Tile Rendering (Mobile 360–414px)

- [ ] Scroll to "Resumo da Semana" section
- [ ] **Grid Layout:**
  - [ ] 2 columns on mobile (wraps to 4 rows for 4 tiles)
  - [ ] No horizontal scroll at 360px
  - [ ] No horizontal scroll at 414px
  - [ ] Tiles are equal width
  - [ ] Consistent gap/spacing between tiles
- [ ] **Each Tile Content:**
  - [ ] **Humor Tile:**
    - [ ] Title: "Humor"
    - [ ] Icon: heart (brand color)
    - [ ] Stat: "5/7" (days logged)
    - [ ] Sparkline: 7-day trend line
  - [ ] **Checklist Tile:**
    - [ ] Title: "Checklist"
    - [ ] Icon: star (brand color)
    - [ ] Stat: "18/24" (items completed)
    - [ ] Sparkline: 7-day trend line
  - [ ] **Planner Tile:**
    - [ ] Title: "Planner"
    - [ ] Icon: place (brand color)
    - [ ] Stat: "6/7" (days planned)
    - [ ] Sparkline: 7-day trend line
  - [ ] **Achievements Tile:**
    - [ ] Title: "Conquistas"
    - [ ] Icon: crown (brand color)
    - [ ] Stat: "3/12" (unlocked)
    - [ ] Sparkline: 7-day trend line

### Sparklines

- [ ] Each sparkline is a simple line chart (SVG path, no external lib)
- [ ] Line is smooth and visible
- [ ] Start and end points have small circles
- [ ] Line color is primary (brand color)
- [ ] Line width is consistent
- [ ] No overflow outside tile bounds
- [ ] Responsive to tile width (scales with tile)

### Positive Reinforcement Copy

- [ ] Below grid, see a box with background color (primary/5)
- [ ] **Main message:** "Você manteve 5 dias de humor registrado — ótimo!"
  - [ ] Specific and personalized (not generic)
  - [ ] Uses emoji (✨) if intentional
  - [ ] PT-BR wording
- [ ] **Secondary message:** "Continue assim para desbloquear novas conquistas..."
  - [ ] Encouraging and forward-looking
  - [ ] Smaller font than main message
  - [ ] Gray text (support-2 color)

### Optional Detail Link

- [ ] See "Ver detalhes completos →" link below reinforcement copy (if `onViewDetails` provided)
- [ ] Link is subtle (secondary text color, underline on hover)
- [ ] Clickable (fires action or navigates)

### Loading & Empty States (Future)

- [ ] When live data wired: show Skeleton cards initially
  - [ ] Gray placeholder bars (height: 32px or similar)
  - [ ] 4 skeleton tiles visible
  - [ ] Smooth fade-in when data loads
- [ ] When no data: show Empty state
  - [ ] Icon (heart or sparkles)
  - [ ] "Comece sua semana" heading
  - [ ] Subtitle: "Registre humor, atividades..."
  - [ ] "Começar agora" button (navigates to /meu-dia)

---

## Regression Tests

- [ ] **Existing Toasts:**
  - [ ] On any core action ("Salvar", "Criar Nota", "Concluir checklist"), toast appears
  - [ ] Toast text is visible and brief
  - [ ] Toast auto-dismisses after 3–5 seconds
  - [ ] No overlap with bottom nav
- [ ] **Navigation:**
  - [ ] Bottom nav tabs still navigate correctly (/, /meu-dia, /cuidar, /descobrir, /eu360, /planos)
  - [ ] Tab bar shows active route highlighted
  - [ ] No "flashing" or double navigation
- [ ] **Other Tabs:**
  - [ ] /meu-dia loads and renders correctly
  - [ ] /cuidar loads and renders correctly
  - [ ] /planos loads and renders correctly
  - [ ] No console errors on any tab
- [ ] **Accessibility:**
  - [ ] Filter pills have aria-label and aria-pressed states
  - [ ] Locked gate overlay is announced (aria-label on overlay or button)
  - [ ] Icons are aria-hidden when decorative
  - [ ] Form fields (if any) have proper labels
  - [ ] Keyboard navigation works (Tab, Enter, Escape)

---

## Lighthouse Mobile Quick Check

Run Lighthouse (DevTools → Lighthouse → Mobile, Performance focus):

- [ ] **CLS (Cumulative Layout Shift):** < 0.1 (no shifting tiles or buttons)
- [ ] **LCP (Largest Contentful Paint):** < 2.5s (images/content loads fast)
- [ ] **FID (First Input Delay):** < 100ms (buttons respond quickly)
- [ ] **Performance Score:** ≥ 80 (no regression from baseline)

---

## Emoji & Copy Audit

- [ ] **UI Headings:** No emoji in headings (all use Lucide icons)
- [ ] **Body/Reinforcement Copy:** Emoji intentional and limited (e.g., ✨ in reinforcement)
- [ ] **PT-BR:** All labels, buttons, messages in Portuguese
- [ ] **Icon Consistency:** All icons via AppIcon component (not mixed with emoji)

---

## Sign-Off Criteria

✅ All checkboxes above should be checked before merging.

If any item fails:
1. Note the failure (e.g., "Sparkline rendering broken on Android")
2. File a bug or comment in PR
3. Attempt quick fix OR defer to follow-up issue

**Release Decision:**
- If all checks pass → Ready to merge into `cosmos-verse`
- If minor issues (e.g., copy typo, icon spacing) → Fix before merge
- If major blocker (e.g., TypeError, layout overflow) → Do not merge; request changes

