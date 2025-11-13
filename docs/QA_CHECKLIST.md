
# 🧩 QA Checklist — Materna360 P2 (v0.2.0-p2-staging1)

**Data:** 11/12/2025
**Ambiente:** Vercel (Staging) & Fusion Preview
**Branch:** `cosmos-verse`
**Status:** P2 – Intelligence & Personalization ✅ Complete

---

## 📱 Per-Tab Smoke Tests

### Meu Dia
- [x] Planner loads and is interactive
- [x] Mood check-in form works (1–5 scale)
- [x] Emotion trend chart renders (SVG, 7d/28d toggle)
- [x] Inactivity reminder appears after 3+ days without entry
- [x] Coach Materno v0.3 card displays with pattern-specific message
- [x] Tone, tags, and CTA buttons are functional
- [x] Navigation to other tabs doesn't lose planner state

### Cuidar
- [x] Page loads without hydration errors
- [x] Section cards display (appointments, audio, diary)
- [x] Audio playback works (sample mindfulness content)
- [x] Navigation back to other tabs smooth

### Maternar (Hub)
- [x] 6-card grid displays correctly
- [x] Cards link to respective tabs
- [x] No duplicate navigation on first load

### Descobrir
- [x] Content grid loads with filters (age, category)
- [x] Filter performance < 100ms
- [x] Empty state displays when no results
- [x] Save-for-later toggle works with visual feedback

### Eu360
- [x] Weekly emotional summary displays
- [x] Coach v0.3 card shows with correct pattern message
- [x] PDF export button visible (paywall if non-premium)
- [x] Paywall modal intercepts export on free plan
- [x] Premium unlock (if set) allows PDF download
- [x] All tabs accessible via BottomNav

---

## 🎯 P2 Feature Tests

### Coach Materno v0.3
- [x] **Pattern Detection & Messages**
  - [x] `low_energy_week` – Shows when avg mood/energy < 2
  - [x] `inactivity` – Shows after 3+ days without entry
  - [x] `trend_up` – Shows when second half of week > first half
  - [x] `balanced` – Shows for stable weeks (default)
  - [x] `no_data` – Shows for new users or very few entries
- [x] **Message Content** – All Portuguese copy matches source (title, body with 2 paragraphs, tone, tags)
- [x] **Telemetry** – `coach_v3_shown` and `coach_v3_cta_click` include `patternKey`

### Weekly Emotional Insight
- [x] Summary card displays in /eu360
- [x] Shows mood/energy averages for the week
- [x] Tone and messaging match weekly pattern

### Inactivity Reminder
- [x] Reminder appears after 3+ days without entry in /meu-dia
- [x] "Recomeçar" (Restart) button works
- [x] Dismiss button hides reminder (session-scoped)
- [x] Gentle, non-judgmental copy

### Premium PDF v2
- [x] Export button shows "Baixar Relatório" in /eu360/export
- [x] Paywall modal appears for non-premium users
- [x] Premium users can download without paywall
- [x] PDF includes cover, summary sections, and weekly data

### Telemetry Events
- [x] `page_view` – Fires on tab navigation
- [x] `nav_click` – Fires on BottomNav clicks
- [x] `card_click` – Fires on card interactions
- [x] `coach_v3_shown` – Fires when Coach v0.3 loads
- [x] `coach_v3_cta_click` – Fires on CTA button clicks (includes `patternKey`)
- [x] `pdf_export_attempt` – Fires when export is clicked
- [x] `paywall_shown` – Fires when paywall modal appears
- [x] Plan-related events – Fire on plan selection/upgrade attempts

---

## 📊 Internal Telemetry Dashboard (/admin/insights)

### Access & Flag
- [x] Flag-gated by `NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1`
- [x] Accessible at `/admin/insights` in Preview
- [x] Local-only (no server sync)

### KPIs Section
- [x] Total events count displays
- [x] Unique users count displays
- [x] Top events list (by frequency)
- [x] Correct data sourced from localStorage

### Filters
- [x] Date range picker (start/end)
- [x] Event type dropdown (page_view, nav_click, card_click, coach*, pdf*, paywall*, etc.)
- [x] Filters apply to table and chart
- [x] Filter reset button works

### Data Table
- [x] Displays all matching events
- [x] Columns: timestamp, event type, tab, details
- [x] Sortable by timestamp and event type
- [x] Pagination or scroll for large datasets

### Time-Series Chart
- [x] Shows events over time (24h view default)
- [x] Chart responds to date filter changes
- [x] Legend shows event type breakdown
- [x] No console errors during render

### Clear Telemetry
- [x] "Clear All" button empties localStorage telemetry
- [x] Confirmation dialog before clearing
- [x] Dashboard resets after clear

---

## ♿ Acessibilidade (A11y)
- [ ] Contraste AA em todas as cores (especialmente secundária #ffd8e6)
- [ ] Foco visível em botões e links (outline or ring)
- [ ] aria-labels em ícones e BottomNav
- [ ] Tab order lógica em formulários e modals

# 🧩 QA Checklist — Materna360 (Staging v0.2.0-p2)

**Data:** 11/11/2025  
**Ambiente:** Vercel (Staging)  
**Branch:** `cosmos-verse`  

---

## 📱 Visual (360–414px)
- [x] Tipografia `.m360-*` consistente
- [x] Grids sem cortes ou overflow
- [x] BottomNav fixo e responsivo
- [ ] Teste contraste AA / foco visível

---

## 🧭 Funcional
- [x] Navegação 5 abas (sem full reload)
- [x] Planner diário + check-in de humor
- [x] Coach Materno (persistência de foco e tom)
- [x] Export PDF v1 (capa com dados reais)
- [x] Paywall modal suave
- [ ] Salvar para depois (/descobrir) com feedback visual
- [ ] Diário da criança (/cuidar) persistente

---

## ♿ Acessibilidade (A11y)
- [ ] Contraste AA (revisar cor secundária)
- [ ] Foco visível em botões interativos
- [ ] aria-labels em ícones e BottomNav

---

## 📊 Telemetria
- [x] `page_view` nas rotas principais
- [x] `nav_click` ao trocar abas
- [x] `card_click` em cards dos hubs
- [x] `coach` (gerar/responder)
- [x] `pdf_export_attempt` e `paywall_shown`
- [ ] Dashboard /admin/insights (em desenvolvimento)


---

## 🧰 Não-funcional

- [x] Build sem warnings críticos (`pnpm build` completa)
- [x] Sem erros de hidratação em SSR/Fusion
- [x] TypeScript clean (`tsc --noEmit` passa)
- [x] Tempo de filtro (/descobrir) < 100ms
- [x] LocalStorage persistence (mood checkins, telemetry)

- [x] Build sem warnings críticos
- [x] Sem erros de hidratação
- [x] Tempo de filtro (/descobrir) < 100ms

- [ ] Responsividade tablet (≥768px)

---


## 🚀 Como Testar em Preview

### 1. Acessar o Preview
```
https://materna360-staging.vercel.app
```

### 2. Testar Coach v0.3 Patterns
- Abra DevTools → Aplicativo → LocalStorage
- Busque por `m360_mood_checkins`
- Adicione entradas com baixo mood/energy para `low_energy_week`
- Aguarde 3 dias sem entrada para `inactivity`
- Adicione tendência crescente para `trend_up`
- Observe as mensagens na seção Coach

### 3. Verificar Telemetria em /admin/insights
- Navegue para `/admin/insights`
- Confirme que `NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1`
- Interaja com o app (navegação, coach, export, etc.)
- Veja eventos aparecerem em tempo real na tabela e gráfico

### 4. Testar Premium Gating
- Tire a flag `m360_premium` do localStorage (se definida)
- Clique em "Baixar Relatório" em /eu360
- Veja o paywall modal aparecer
- Defina `localStorage.setItem('m360_premium','1')`
- Clique novamente em "Baixar Relatório" → PDF deve fazer download

---

✅ **Resultado esperado:**
Todas as features de P2 funcionando, telemetria capturando eventos, A11y e responsividade prontas para P3.

✅ **Resultado esperado:**  
App estável em Staging, pronto para QA final e início da Fase P3 (Premium).

