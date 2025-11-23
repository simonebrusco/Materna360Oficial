## ✅ P2 — IA Emocional & Rotina Inteligente (FECHADO)

**Versão:** v0.3.2-P2-IA-Emocional  
**Branch:** `cosmos-verse`  
**Status:** 🟢 Concluído e estável (build passando)

### Escopo da P2 Emocional

- Centralização da IA emocional e de rotina em:
  - `POST /api/ai/emocional`
  - `POST /api/ai/rotina`
- Integração de insights emocionais com:
  - `/meu-dia/como-estou-hoje`
  - `/meu-dia/rotina-leve`
  - `/eu360`
- Conexão entre IA e Planner via `usePlannerSavedContents`, sempre com:
  - `origin` bem definido por mini-hub
  - fallbacks editoriais carinhosos (sem “cara de IA” para a mãe)

---

### /meu-dia/rotina-leve

**Objetivo:** transformar Rotina Leve em um hub de apoio rápido para o dia, com IA nos bastidores, mas experiência de “conversa com uma amiga”.

- ✅ Layout premium consolidado:
  - Hero card: **Receitas Inteligentes**
  - Grid 2 colunas: **Ideias Rápidas** + **Inspirações do Dia**
  - Card-resumo final com visão do que foi salvo no Planner
- ✅ IA de **Receitas Inteligentes**
  - Endpoint: `POST /api/ai/rotina` (`feature: 'recipes'`, `origin: 'rotina-leve'`)
  - Fallback seguro com 3 receitas editoriais bem explicadas
  - Limite diário simples (3 receitas/dia) com mensagem amigável
  - Salvamento no Planner:
    - `origin: 'rotina-leve'`
    - `type: 'recipe'`
- ✅ IA de **Inspirações do Dia**
  - Endpoint: `POST /api/ai/emocional` (`feature: 'daily_inspiration'`, `origin: 'rotina-leve'`)
  - Foco selecionável (Cansaço, Culpa, Organização, Conexão com o filho)
  - Fallback com frase + pequeno cuidado + mini ritual
  - Salvamento no Planner:
    - `origin: 'rotina-leve'`
    - `type: 'insight'`
- ✅ Card-resumo conectado ao Planner:
  - Contagem de receitas salvas
  - Contagem de inspirações salvas
  - Exibição da última inspiração salva

---

### /eu360 — Insight emocional semanal

**Objetivo:** fazer do **EU360** o painel de visão emocional da mãe, com linguagem acolhedora.

- ✅ Arquivo: `app/(tabs)/eu360/Client.tsx`
- ✅ Mantido padrão Materna360 Premium:
  - `AppShell` + `PageTemplate` + `SectionWrapper`
  - `ProfileForm` intacto
- ✅ Card **“Olhar carinhoso sobre a sua semana”**
  - Endpoint: `POST /api/ai/emocional` (`feature: 'weekly_overview'`, `origin: 'eu360'`)
  - Estrutura do insight:
    - `title`
    - `summary`
    - `suggestions: string[]`
  - Personalização leve usando primeiro nome do perfil
  - Fallback editorial carinhoso (sem mencionar “IA” na cópia)

---

### /meu-dia/como-estou-hoje — Dia + Semana + Insight integrado ao Planner

**Objetivo:** conectar registros diários com uma visão emocional da semana e um insight diário que pode ir para o Planner.

- ✅ Card **“Meu Humor & Minha Energia”**
  - Persistência diária via `getBrazilDateKey` + `save/load`
  - Telemetria:
    - `mood.registered`
    - `energy.registered`
- ✅ Card **“Como foi meu dia?”**
  - Notas do dia com salvamento local
  - Salvamento no Planner:
    - `origin: 'como-estou-hoje'`
    - `type: 'note'`
  - Lista das notas de hoje vindas do Planner
- ✅ Card **“Insight do Dia”** (IA + Planner)
  - Endpoint: `POST /api/ai/emocional` (`feature: 'daily_insight'`, `origin: 'como-estou-hoje'`)
  - Estrutura:
    - `title`
    - `body`
    - `gentleReminder`
  - Botão **“Levar este insight para o planner”**:
    - `origin: 'como-estou-hoje'`
    - `type: 'insight'`
    - `payload: { text, gentleReminder }`
  - Fallback com texto editorial acolhedor
  - Telemetria: `daily_insight.saved`
- ✅ Card **“Minha Semana Emocional”**
  - Endpoint: `POST /api/ai/emocional` (`feature: 'weekly_overview'`, `origin: 'como-estou-hoje'`)
  - Estrutura:
    - `summary`
    - `highlights.bestDay`
    - `highlights.toughDays`
  - UI em 3 partes:
    - bloco de texto com resumo da semana
    - card “Quando seus dias fluem melhor”
    - card “Quando o dia pesa um pouco mais”
  - Fallback garantindo texto compassivo quando IA falha

---

### Estado técnico

- ✅ Build: `pnpm run build` passando
- ✅ Sem mudanças em:
  - `layout.tsx`
  - BottomNav
  - paleta de cores
  - sistema de navegação principal
- ✅ Todas as chamadas de IA têm:
  - fallback editorial
  - logs de erro no console (sem travar UX)
  - não revelam “IA” diretamente na experiência da mãe
