# 🚀 Deployment Checklist — cosmos-verse (P2 Complete)

**Versão:** v0.2.0-p2-staging1
**Data:** 11/12/2025
**Responsável:** @simonebrusco
**Branch:** `cosmos-verse`
**Status:** 🟢 P2 – Intelligence & Personalization ✅ COMPLETO / Pronto para P3 (QA & Polish)  

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

---

## ✅ Pós-deploy
- [x] Tag criada: `v0.2.0-p2-staging1`
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
