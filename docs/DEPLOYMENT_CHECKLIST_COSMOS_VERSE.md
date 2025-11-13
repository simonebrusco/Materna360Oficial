
# 🚀 Deployment Checklist — cosmos-verse (P2 Complete)

**Versão:** v0.2.0-p2-staging1  
**Data:** 11/12/2025  
**Responsável:** @simonebrusco  
**Branch:** `cosmos-verse`  
**Status:** 🟢 P2 – Intelligence & Personalization ✅ COMPLETO / Pronto para P3 (QA & Polish)


## 🔨 Pré-deploy
- [x] Branch: `cosmos-verse`
- [x] Todas as PRs de P2 mergeadas
- [x] CI: `pnpm run build` ✅ (sem warnings críticos)
- [x] TypeScript: `tsc --noEmit` ✅
- [x] ENVs Preview verificados:
  - [x] `NEXT_PUBLIC_FF_MATERNAR_HUB=1`
  - [x] `NEXT_PUBLIC_FF_EMOTION_TRENDS=1`
  - [x] `NEXT_PUBLIC_FF_COACH_V1=1` (v0.3 ativo)
  - [x] `NEXT_PUBLIC_FF_EXPORT_PDF=1`
  - [x] `NEXT_PUBLIC_FF_PAYWALL_MODAL=1`
  - [x] `NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1` (novo)
- [x] Node 20 + Corepack ativo
- [x] Sem erros de hidratação em SSR/Fusion
- [x] Builder CSP habilitado

# 🚀 Deployment Checklist — cosmos-verse (Staging)

**Versão:** v0.2.0-p2-staging1  
**Data:** 11/11/2025  
**Responsável:** @simonebrusco  
**Branch:** `cosmos-verse`  
**Status:** 🟢 Deploy Staging concluído / QA inicial em progresso  

---

## �� Pré-deploy
- [x] Branch: `cosmos-verse`
- [x] PRs #143 e #145 mergeados
- [x] CI: `pnpm run build` ✅
- [x] ENVs Preview verificados (`NEXT_PUBLIC_FF_PDF_EXPORT=1`, `NEXT_PUBLIC_FF_COACH_V1=1`, `NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1`)
- [x] Node 20 + Corepack ativo
- [x] Flags habilitadas:  
  `FF_LAYOUT_V1`, `FF_MATERNAR_HUB`, `FF_PREMIUM_ENABLED`


---

## ⚙️ Deploy
- [x] Deploy Vercel a partir de `cosmos-verse`
- [x] Deploy ID anotado (rollback fácil)
- [x] Logs de build limpos e sem TypeErrors
- [x] CSP habilitado para Builder (`frame-ancestors 'self' https://builder.io`)

---

## 🧪 Smoke Test (rotas principais)
| Rota | Status | Verificação |
|-------|---------|--------------|

| `/meu-dia` | ✅ | Planner, check-in de humor, Coach v0.3, inactivity reminder, gráfico SVG |
| `/cuidar` | ✅ | Seções carregam sem erro; áudios funcionais |
| `/maternar` | ✅ | Hub central, grid 6-cards, navegação suave |
| `/descobrir` | ✅ | Filtros <100ms, empty-state, save-for-later UX |
| `/eu360` | ✅ | Weekly insight, Coach v0.3, PDF v2 (premium gated), paywall modal |
| `/admin/insights` | ✅ | Dashboard local, KPIs, filters, chart, clear button (flag-gated) |
| `/builder-embed` | ✅ | Renderiza sem erro de hidratação |

---

## 📊 Telemetria (Unified & Dashboard)
- [x] **Basic Events**: `page_view`, `nav_click`, `card_click`
- [x] **Coach v0.3**: `coach_v3_shown` (com `patternKey`), `coach_v3_cta_click`
- [x] **PDF & Premium**: `pdf_export_attempt`, `paywall_shown`, `plan_*` events
- [x] **Engagement**: `discover_save`, `reminder_inactivity_*`, `coach_v3_*`
- [x] **Dashboard `/admin/insights`**:
  - [x] KPIs (total events, unique users, top events)
  - [x] Filters (date range, event type)
  - [x] Real-time table view
  - [x] Time-series chart
  - [x] Clear telemetry button
- [x] LocalStorage persistence (não requer servidor)

---

## 📄 PDF v2 / Premium Gating
- [x] Export v2 funcional (capa dinâmica, sumário, seções)
- [x] Gating por plano (`m360_premium` localStorage)
- [x] Paywall intercept ativo e elegante
- [x] Premium unlock permite download direto
- [x] Telemetry captura `plan_` events e `paywall_shown`

| `/builder-embed` | ✅ | Renderiza sem erro de hidratação |
| `/meu-dia` | ✅ | Planner, humor e gráfico SVG funcionais |
| `/eu360` | ✅ | Coach + export PDF (window.print) |
| `/descobrir` | ✅ | Filtros <100ms, empty-state OK |
| `/maternar` | ✅ | Hub central sem warnings |
| `/cuidar` | ⚙️ | Carrega; falta persistência do diário infantil |

---

## 📊 Telemetria (Network)
- [x] `page_view` em cada rota  
- [x] `nav_click` ao trocar abas  
- [x] `card_click` nos hubs  
- [x] `coach` ao gerar/atualizar sugestão  
- [x] `pdf_export_attempt` e `paywall_shown` no fluxo de export  

---

## 📄 PDF / Paywall
- [x] Export v1 funcional (`window.print`)  
- [x] Capa com dados do Coach Materno  
- [x] Paywall intercept ativo e elegante  


---

## ✅ Pós-deploy
- [x] Tag criada: `v0.2.0-p2-staging1`

- [x] Changelog completo de P2 incluído
- [x] PRs mergidas e branches removidas
- [x] Documentação atualizada (PROJECT_TRACKER, QA_CHECKLIST, ENV, README)

---

### 📘 Release Notes — v0.2.0-p2-staging1 (P2 Complete)

#### 🎯 P2 – Intelligence & Personalization
- **Coach Materno v0.3** — 5 padrões contextuais com mensagens em PT-BR puras (low_energy_week, inactivity, trend_up, balanced, no_data)
- **Weekly Emotional Insight** em /eu360 — Resumo semanal de humor/energia com tom empático
- **Inactivity Reminder** em /meu-dia — Nudge suave após 3+ dias sem entrada (acolhedor, sem culpa)
- **Premium PDF v2** — Capa dinâmica, sumário das semanas, seções personalizadas (gated por plan)
- **Internal Telemetry Dashboard** (`/admin/insights`) — KPIs, filtros, gráfico time-series, botão clear (local-only, preview-only)
- **Unified Telemetry** — Events completos: page_view, nav_click, card_click, coach*, pdf*, paywall*, plan_*, discover_save, reminder_inactivity_*
- **TypeScript & Build** — Clean types, sem erros de compilação, SSR e Fusion-safe

#### 🔧 Technical Improvements
- Strict guards para SSR/Fusion (localStorage, window, document)
- Pattern-based message builder (buildCoachMessage)
- Local telemetry persistence (não requer servidor)
- Feature flag: NEXT_PUBLIC_FF_INTERNAL_INSIGHTS

#### 📝 Documentation
- PROJECT_TRACKER.md atualizado com P2 concluído
- QA_CHECKLIST.md com testes por aba e features
- ENV.md com nova flag INTERNAL_INSIGHTS
- README.md com seção "What's in P2"
- DEPLOYMENT_CHECKLIST atualizado

- [x] Changelog curto incluído no commit
- [x] PRs antigos (ex.: #144) encerrados como obsoletos
- [x] Branches “fix/*” removidas após merge
- [ ] Issues abertas para pendências menores  

---

### 📘 Release Notes — v0.2.0-p2-staging1
- **Coach Materno v0.2** — persistência de foco/tom e sugestões empáticas  
- **PDF Export v1** — capa integrada ao coach e export direta  
- **Builder Preview** — BottomNav estável e sem erro de hidratação  
- **Telemetria unificada** — nav/page/card/coach/pdf/paywall  
- **Correções** — tipos `Child` e `PlanTier`, MessageOfDay  

