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
