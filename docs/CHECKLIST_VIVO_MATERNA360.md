# ✅ CHECKLIST VIVO — Materna360

Versão alvo: **FASE 2 — IA Inteligente & Personalização (Fev–Abr/2025)**  
Branch de trabalho: **cosmos-verse**  
PR atual: **feat/p2-inteligencia-cosmos-verse**  
Status geral: 🟢 Base estável / IA em progresso com segurança

---

## 1. BASE TÉCNICA & AMBIENTE

- ✅ App Router estável (rotas principais confirmadas)
  - /meu-dia/como-estou-hoje  
  - /meu-dia/rotina-leve  
  - /cuidar/autocuidado-inteligente  
  - /cuidar/cuidar-com-amor  
  - /maternar/minhas-conquistas  
  - /maternar/biblioteca-materna  
  - /eu360

- ✅ Layout premium padronizado (PageTemplate + SoftCard + MotivationalFooter)
- ✅ Cores e tipografia seguindo Visual Style Guide
- ✅ Nada de mudanças em:
  - layout.tsx  
  - BottomNav  
  - Sistema de cores da marca  

---

## 2. IA & ENDPOINTS /api/ai/*

### 2.1 Arquitetura de IA

- ✅ Documento de arquitetura:
  - `docs/IA_ARCH_MAP_P2.md`  
  - Mapeia:
    - /api/ai/emocional → insights emocionais (dia, semana, Eu360)  
    - /api/ai/rotina → rotina leve, receitas, ideias rápidas  

- ✅ Módulo central de handlers:
  - `lib/ai/handlers.ts`
  - Responsabilidades:
    - Orquestrar chamadas de IA
    - Normalizar respostas
    - Garantir fallback seguro (mock) se falhar

### 2.2 Endpoints

- ✅ `/api/ai/rotina` (POST)
  - `feature: 'recipes'` → receitas inteligentes
  - `feature: 'quick_ideas'` → ideias rápidas
  - Contexto:
    - origin: 'rotina-leve'
    - filtros simples (tempoDisponivel, comQuem, tipoIdeia)

- ✅ `/api/ai/emocional` (POST)
  - `feature: 'daily_insight'` → insight do dia (como-estou-hoje)
  - `feature: 'weekly_overview'` → leitura emocional da semana
  - Pensado para:
    - Como Estou Hoje (dia + semana)
    - Weekly Emotional Insight em /eu360 (próximo passo)

---

## 3. MINI-HUBS & FLUXOS INTELIGENTES

### 3.1 /meu-dia/rotina-leve

- ✅ Layout premium padronizado
  - Hero card: **Receitas Inteligentes**
  - Grid 2x2: **Ideias Rápidas** + **Inspirações do Dia**
  - MotivationalFooter no final

- ✅ Integrações com Planner
  - Receitas:
    - `origin: 'rotina-leve'`
    - `type: 'recipe'`
    - payload: título, descrição, tempo, faixa etária, preparo
  - Ideias rápidas:
    - `origin: 'rotina-leve'`
    - `type: 'insight'`
    - payload: descrição
  - Inspirações:
    - `origin: 'rotina-leve'`
    - `type: 'insight'`
    - payload: frase, pequeno cuidado, mini-ritual

- ✅ Inteligência ligada (com fallback)
  - Botão **“Gerar receitas”**
    - Chama `/api/ai/rotina` com `feature: 'recipes'`
    - Se falhar → `mockGenerateRecipes()`
    - Limite diário de 3 sugestões (contador de plano)
  - Botão **“Gerar ideias”**
    - Chama `/api/ai/rotina` com `feature: 'quick_ideas'`
    - Usa filtros:
      - tempoDisponivel (5, 10, 20, 30+)
      - comQuem (só eu, eu e meu filho, família toda)
      - tipoIdeia (brincadeira, organização, autocuidado, receita-rapida)
    - Se falhar → `mockGenerateIdeas()`

- ✅ Experiência para a mãe **sem aparecer “IA”**
  - Textos humanizados, tom de amiga
  - IA fica nos bastidores

- ✅ Tratamento de erros
  - `toast.success`, `toast.info`, `toast.danger`
  - Logs `[Rotina Leve] ...`
  - Nunca quebra tela se falhar

### 3.2 /meu-dia/como-estou-hoje

- ✅ Layout premium com:
  - Card 1: **Meu Humor & Minha Energia**
  - Card 2: **Como foi meu dia?**
  - Card 3: **Insight do Dia**
  - Bloco “Semana” com:
    - **Minha Semana Emocional** (leitura + placeholder gráfico)
    - **Sugestões pensadas para você esta semana** (card estático)

- ✅ Persistência local do dia
  - `getBrazilDateKey()` para chave por dia
  - `save` / `load` para:
    - humor
    - energy
    - notes

- ✅ Integração com Planner
  - Ao salvar notas:
    - `origin: 'como-estou-hoje'`
    - `type: 'note'`
    - `payload.text`
  - Histórico do dia:
    - `getByOrigin('como-estou-hoje')` filtrando `type === 'note'`

- ✅ IA — Insight do Dia (comportamento atual)
  - Botão **“Gerar insight do dia”**
  - Chama `/api/ai/emocional` com:
    - `feature: 'daily_insight'`
    - humor selecionado
    - energia selecionada
    - notas do dia (quando houver)
  - Se a API falhar:
    - Fallback com texto carinhoso padrão
    - `toast.info` explicando de forma leve
  - Não aparece “IA” na UI — apenas “Insight do Dia”

- ✅ IA — Minha Semana Emocional
  - Botão **“Gerar leitura da semana”**
  - Chama `/api/ai/emocional` com:
    - `feature: 'weekly_overview'`
    - humor/energia atuais como contexto simples (v1)
  - Exibe texto-resumo dentro do card “Minha Semana Emocional”
  - Se a API falhar:
    - Fallback com reflexão acolhedora sobre altos e baixos da semana
    - `toast.info` avisando com tom de cuidado
  - Gráfico ainda é placeholder visual (sem dados reais) — **intencional em P2**

---

## 4. PLANNER & CONEXÕES ENTRE MINI-HUBS

- ✅ Hook centralizado:
  - `usePlannerSavedContents`
  - Usado em:
    - /meu-dia/como-estou-hoje
    - /meu-dia/rotina-leve
    - (outros mini-hubs seguem o mesmo padrão)

- ✅ Origem sempre marcada:
  - `'como-estou-hoje'`
  - `'rotina-leve'`
  - Facilita insights futuros em /eu360

- 🚧 Próximos passos P2:
  - Conectar insights emocionais agregados ao /eu360
  - Produzir recomendações cruzadas Planner ↔ Emoções

---

## 5. QA & DEPLOY

- ✅ Build passando (`pnpm run build`)
- ✅ /meu-dia/rotina-leve:
  - IA + fallback funcionando
  - Limite diário respeitado
- ✅ /meu-dia/como-estou-hoje:
  - Persistência diária funcionando
  - Insight do dia via API + fallback
  - Leitura da semana via API + fallback

- ⏳ QA visual adicional:
  - Conferir em mobile e desktop:
    - espaçamentos
    - sombras
    - consistência de textos e microcopys

---

## 6. PRÓXIMOS PASSOS DA FASE 2 (IA)

Ordem sugerida (sempre passo-a-passo, com build verde entre um e outro):

1. **Documentar rapidamente no IA_ARCH_MAP_P2** o uso de:
   - `feature: 'daily_insight'`
   - `feature: 'weekly_overview'`
   - Origem: `/meu-dia/como-estou-hoje`  
   _(se ainda não estiver descrito)_

2. **Levar essa inteligência emocional para o /eu360**  
   - Reusar `/api/ai/emocional`  
   - Criar um “Weekly Emotional Insight” mais completo usando:
     - humores do período
     - energias registradas
     - itens salvos no planner (v2)

3. **Rodada de QA visual com foco em “produto pronto”**  
   - Pequenos ajustes finos de layout  
   - Microcopy consistente com o Tone of Voice Materna360  
