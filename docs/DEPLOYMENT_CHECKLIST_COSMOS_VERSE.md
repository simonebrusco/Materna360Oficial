# 🚀 Materna360 — Deployment Checklist (cosmos-verse → main)
**Versão:** Março/2025  
**Ambiente:** cosmos-verse (dev) → main (prod)  
**Responsável:** Simone Brusco  
**Status:** Oficial

Este checklist garante que NENHUMA alteração crítica do Materna360 chegue ao main sem passar por auditoria visual, técnica e funcional, mantendo o padrão premium e a estabilidade do app.

---

# 🧱 1. Pré-Deploy — Verificações Obrigatórias

### ✔ 1.1 Build
- [ ] `pnpm install` sem warnings críticos  
- [ ] `pnpm typecheck` sem erros  
- [ ] `pnpm build` concluído com sucesso  
- [ ] Sem mensagens de hidratação suspeitas  

### ✔ 1.2 Telemetria
- [ ] Nenhum evento foi removido  
- [ ] `page_view` funcionando  
- [ ] `nav_click` funcionando  
- [ ] `card_click` funcionando  
- [ ] Eventos especiais funcionando:  
  - [ ] `coach_*`  
  - [ ] `emotion_trend`  
  - [ ] `pdf_*`  
  - [ ] `plan_*`  

### ✔ 1.3 Rotas
Todas as rotas precisam abrir **sem erro 404**:

| Rota | Status |
|------|--------|
| /meu-dia | [ ] |
| /meu-dia/rotina-leve | [ ] |
| /meu-dia/como-estou-hoje | [ ] |
| /maternar | [ ] |
| /maternar/cuidar-com-amor | [ ] |
| /maternar/minhas-conquistas | [ ] |
| /maternar/biblioteca-materna | [ ] |
| /cuidar/meu-bem-estar | [ ] |
| /eu360 | [ ] |
| /admin/insights (preview-only) | [ ] |

---

# 🎨 2. Padrão Visual Premium (QA Rápido)

### ✔ 2.1 Hero (PageTemplate)
- [ ] Label em CAPS  
- [ ] Título curto  
- [ ] Subtítulo acolhedor  

### ✔ 2.2 Grid
- [ ] 1 coluna no mobile  
- [ ] 2 colunas no desktop  

### ✔ 2.3 SoftCards
- [ ] Bordas 3XL  
- [ ] Sombras leves  
- [ ] Ícones em ameixa  
- [ ] Tags rosas  
- [ ] Nenhum card com layout antigo  

---

# 🧩 3. Mini-Hubs — Validação Completa

### ✔ Rotina Leve
- [ ] Inputs funcionando  
- [ ] Botões padrão (finos e suaves)  
- [ ] Salvar no planner funcionando  

### ✔ Como Estou Hoje
- [ ] Humor e energia registrando  
- [ ] Resumo inteligente carregando  
- [ ] Sem duplicação  

### ✔ Autocuidado Inteligente
- [ ] Blocos organizados  
- [ ] Nada de emojis  
- [ ] Botões do novo padrão  

### ✔ Cuidar com Amor
- [ ] Tags corretas  
- [ ] Cards limpos  
- [ ] Fluxos não duplicados  

### ✔ Minhas Conquistas
- [ ] Modal funcionando  
- [ ] Estrutura de gamificação estável  

### ✔ Biblioteca Materna
- [ ] Cards carregam corretamente  
- [ ] Filtros estáveis  
- [ ] Layout premium aplicado  

---

# 🧠 4. Inteligência (IA)

- [ ] Ideias rápidas funcionando  
- [ ] Inspirações funcionando  
- [ ] Sugestões de leveza funcionando  
- [ ] Nenhum endpoint retornando erro  

---

# 🔒 5. Segurança & Guardrails

- [ ] Nenhum arquivo proibido alterado:  
  - `app/layout.tsx`  
  - `BottomNav.tsx`  
  - `PageHeader.tsx`  
  - `SoftCard.tsx`  
  - `telemetry.ts`  
  - `app/api/*`  

- [ ] Nenhuma cor fora do Design System  
- [ ] Nenhum emoji adicionado  

---

# 🔍 6. Testes de Responsividade

### Mobile:
- [ ] Todos os mini-hubs abrem  
- [ ] 2x2 no Maternar  
- [ ] Footer premium renderiza correto  

### Desktop:
- [ ] Grids centralizados  
- [ ] Cards alinhados  
- [ ] Espaçamentos corretos  

---

# 🧪 7. Testes cruzados de navegação

- [ ] Ir e voltar entre mini-hubs não quebra layout  
- [ ] Abrir modais e fechar sem erro  
- [ ] Navegar via footer funcionando  

---

# ⛳ 8. Deploy para Main

Quando estiver **tudo verde**:

1. [ ] Abrir PR cosmos-verse → main  
2. [ ] Revisar diffs  
3. [ ] Merge manual  
4. [ ] Verificar build do Vercel (Preview + Production)  
5. [ ] Testar todas as rotas na produção  
6. [ ] Atualizar CHECKLIST VIVO  

---

# 🎉 Conclusão

Este checklist mantém o Materna360:

✔ Premium  
✔ Estável  
✔ Coerente  
✔ Seguro  
✔ Pronto para escalar  

Sempre execute este checklist **antes de qualquer merge para main**.
