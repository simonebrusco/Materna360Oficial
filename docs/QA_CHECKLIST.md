# 🧪 Materna360 — QA Checklist Oficial (2025)
**Versão:** Março/2025  
**Responsável:** Simone Brusco  
**Aplicável a:** cosmos-verse, PRs do Builder.io e merges para main  

Este é o checklist OFICIAL de QA (Quality Assurance) do Materna360, garantindo que toda entrega mantenha o padrão premium da plataforma.

---

# 🎨 1. QA VISUAL (OBRIGATÓRIO)

### 1.1 Layout Premium (mini-hubs)
- [ ] Hero com label + título curto + subtítulo acolhedor  
- [ ] SectionWrapper centralizado (max-w-3xl)  
- [ ] Grid 2 colunas desktop / 1 coluna mobile  
- [ ] SoftCards com borda 3XL  
- [ ] Sombras leves (shadow-lg ou shadow-[0_6px_22px])  
- [ ] Ícones em ameixa  
- [ ] Tags rosas (#ffd8e6 + #ff005e)  
- [ ] Nenhum card antigo ou desalinhado  

### 1.2 Responsividade
- [ ] Mobile: tudo em uma coluna, bem espaçado  
- [ ] Maternar: grid 2x2 no mobile  
- [ ] Desktop: cards centralizados e alinhados  
- [ ] Footer premium funcionando em ambas as views  

### 1.3 Tipografia
- [ ] Títulos H1: text-3xl md:text-4xl  
- [ ] Títulos H3: text-base font-semibold  
- [ ] Microcopy: text-sm text-gray-600  
- [ ] Nenhum fragmento com fonte antiga  

---

# 🧠 2. QA DE INTELIGÊNCIA (IA)

### 2.1 Sugestões inteligentes
- [ ] Ideias rápidas retornam sugestões  
- [ ] Inspirações funcionando  
- [ ] Sugestões de leveza carregam sem erro  

### 2.2 Rotina Leve — Receitas
- [ ] Inputs funcionam  
- [ ] Botão “Gerar” responde  
- [ ] Modal de receitas abre  
- [ ] Salvar no planner funciona  

---

# 📘 3. QA FUNCIONAL

### 3.1 Navegação
- [ ] Todas as rotas abrem  
- [ ] Nenhum 404  
- [ ] Footer navega corretamente  

### 3.2 Planner
- [ ] Prioridades do dia  
- [ ] Rotina  
- [ ] Lembretes  
- [ ] Conteúdos salvos aparecem  

### 3.3 Como Estou Hoje
- [ ] Humor salva  
- [ ] Energia salva  
- [ ] Resumo emocional aparece  

### 3.4 Minhas Conquistas
- [ ] Modal de nova conquista funciona  
- [ ] Memórias da semana aparecem  
- [ ] Zero emojis  

### 3.5 Biblioteca Materna
- [ ] Filtros funcionam  
- [ ] Cards abrem  
- [ ] Layout premium íntegro  

---

# 🔥 4. QA DE CÓDIGO (DEV)

### 4.1 Check técnico
- [ ] `pnpm typecheck` sem erros  
- [ ] `pnpm lint` sem warnings graves  
- [ ] `pnpm build` compila sem falhas  

### 4.2 Guardrails
- [ ] Nenhum arquivo crítico alterado:  
  - app/layout.tsx  
  - BottomNav.tsx  
  - PageHeader.tsx  
  - SoftCard.tsx  
  - AppIcon.tsx  
  - app/api/*  
  - telemetry.ts  

### 4.3 Classes Tailwind
- [ ] Não existem estilos inline  
- [ ] Nenhum valor hardcoded de cor fora do DS  

---

# 🌸 5. QA DE EXPERIÊNCIA (CX)

### 5.1 Tom de Voz
- [ ] Frases curtas  
- [ ] Acolhedoras  
- [ ] Sem julgamento  
- [ ] Zero imposição (“deveria”, “precisa”, “correto”)  

### 5.2 Microcopy
- [ ] Mensagens suaves e humanas  
- [ ] Nada técnico demais  
- [ ] Nada médico demais  

### 5.3 Emoções da mãe
- [ ] Nenhuma interface que gere pressão  
- [ ] Nenhuma mensagem que cause culpa  

---

# 📦 6. QA FINAL — Pré-PR

Antes de subir PR do Builder ou do dev:

- [ ] Tudo acima marcado como OK  
- [ ] Print mental do layout comparado ao padrão  
- [ ] Nenhuma seção antiga sobrando  
- [ ] Cards alinhados e sem overflow  
- [ ] Testado no mobile e desktop  
- [ ] Sem caracteres quebrados (“􀀀􀀀”)  
- [ ] Saudação “bom dia / boa tarde / boa noite” funcionando  

---

# 🎉 Conclusão

Este checklist mantém o Materna360:

✔ Coerente  
✔ Premium  
✔ Acolhedor  
✔ Inteligente  
✔ Seguro para deploy  

Use SEMPRE antes de aprovar PRs ou enviar páginas pelo Builder.
