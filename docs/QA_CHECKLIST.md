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
- [x] Build sem warnings críticos
- [x] Sem erros de hidratação
- [x] Tempo de filtro (/descobrir) < 100ms
- [ ] Responsividade tablet (≥768px)

---

✅ **Resultado esperado:**  
App estável em Staging, pronto para QA final e início da Fase P3 (Premium).
