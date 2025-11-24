✅ P2 — IA Emocional & Rotina Inteligente (FECHADO)
Versão: v0.3.3-P2-IA-Emocional
Branch: cosmos-verse
Status: 🟢 Concluído e estável (pnpm run build passando)

Escopo da P2 Emocional

Centralização da IA emocional e de rotina em:

POST /api/ai/emocional

POST /api/ai/rotina

Integração de insights emocionais com:

/meu-dia/como-estou-hoje

/meu-dia/rotina-leve

/eu360

Camada de orquestração da IA:

Núcleo de IA: app/lib/ai/maternaCore.ts

Adapter de perfil Eu360 → IA: app/lib/ai/eu360ProfileAdapter.ts

Loader compartilhado de contexto Materna (profile + child):
app/lib/ai/profileAdapter.ts (loadMaternaContextFromRequest)

Rate limit de IA: app/lib/ai/rateLimit.ts
(usado em /api/ai/emocional com mensagens amigáveis)

Conexão entre IA e Planner via usePlannerSavedContents, sempre com:

origin bem definido por mini-hub

tipos (type) padronizados (note, insight, recipe…)

fallbacks editoriais carinhosos (sem “cara de IA” para a mãe)

/meu-dia/rotina-leve

Objetivo: transformar Rotina Leve em um hub de apoio rápido para o dia, com IA nos bastidores, mas experiência de “conversa com uma amiga”.

✅ Layout premium consolidado:

Hero card: Receitas Inteligentes

Grid 2 colunas: Ideias Rápidas + Inspirações do Dia

Card-resumo final com visão do que foi salvo no Planner

✅ IA de Receitas Inteligentes

Endpoint: POST /api/ai/rotina

feature: 'recipes'

origin: 'rotina-leve'

Usa contexto personalizado vindo do Eu360 (via loadMaternaContextFromRequest)

Fallback seguro com 3 receitas editoriais bem explicadas

Limite diário simples (3 receitas/dia) com mensagem amigável

Salvamento no Planner:

origin: 'rotina-leve'

type: 'recipe'

payload com description, timeLabel, ageLabel, preparation

✅ IA de Ideias Rápidas

Hook: useRotinaAISuggestions
(camada de consumo da IA de “quick-ideas”)

Filtros inteligentes:

tempo disponível

com quem (só eu / eu e meu filho / família toda)

tipo de ideia (brincadeira, organização, autocuidado, receita rápida)

Fallback com lista editorial de ideias quando IA não responde

Salvamento no Planner:

origin: 'rotina-leve'

type: 'insight'

payload com descrição da ideia

✅ IA de Inspirações do Dia

Endpoint: POST /api/ai/emocional

feature: 'daily_inspiration'

origin: 'rotina-leve'

Foco selecionável:

Cansaço, Culpa, Organização, Conexão com o filho

Fallback com:

frase

pequeno cuidado

mini ritual

Salvamento no Planner:

origin: 'rotina-leve'

type: 'insight'

payload: { frase, pequenoCuidado, miniRitual }

✅ Card-resumo conectado ao Planner:

Contagem de receitas salvas

Contagem de inspirações salvas

Exibição da última inspiração salva (frase + cuidado) vinda do Planner

/eu360 — Insight emocional semanal

Objetivo: fazer do Eu360 o painel de visão emocional da mãe, com linguagem acolhedora.

✅ Arquivo: app/(tabs)/eu360/Client.tsx
✅ Mantido padrão Materna360 Premium:

AppShell + PageTemplate + SectionWrapper

ProfileForm intacto (dados da mãe/filhos)

✅ Card “Olhar carinhoso sobre a sua semana”

Endpoint: POST /api/ai/emocional

feature: 'weekly_overview'

origin: 'eu360'

Usa contexto vindo de /api/eu360/profile via:

loadMaternaContextFromRequest → adaptEu360ProfileToMaterna

Estrutura do insight semanal:

title

summary

highlights.bestDay

highlights.toughDays

Personalização leve usando perfil da mãe

Fallback editorial carinhoso (sem mencionar “IA” na cópia)

/meu-dia/como-estou-hoje — Dia + Semana + Insight integrado ao Planner

Objetivo: conectar registros diários com uma visão emocional da semana e um insight diário que pode ir para o Planner.

✅ Card “Meu Humor & Minha Energia”

Persistência diária via:

getBrazilDateKey

save / load

Telemetria:

mood.registered

energy.registered

✅ Card “Como foi meu dia?”

Notas do dia com salvamento local

Salvamento no Planner:

origin: 'como-estou-hoje'

type: 'note'

payload: { text }

Lista de notas de hoje vinda do Planner (getByOrigin('como-estou-hoje'))

✅ Card “Insight do Dia” (IA + Planner)

Endpoint: POST /api/ai/emocional

feature: 'daily_insight'

origin: 'como-estou-hoje'

Estrutura:

title

body

gentleReminder

Botão “Levar este insight para o planner”:

origin: 'como-estou-hoje'

type: 'insight'

payload: { text, gentleReminder }

Fallback com texto editorial acolhedor

Telemetria:

daily_insight.saved

✅ Card “Minha Semana Emocional”

Endpoint: POST /api/ai/emocional

feature: 'weekly_overview'

origin: 'como-estou-hoje'

Estrutura:

summary

highlights.bestDay

highlights.toughDays

UI em 3 partes:

bloco de texto com resumo da semana

card “Quando seus dias fluem melhor”

card “Quando o dia pesa um pouco mais”

Fallback garante texto compassivo quando IA falha

Estado técnico

✅ Build: pnpm run build passando
✅ Arquitetura de IA consolidada em:

app/lib/ai/maternaCore.ts

app/lib/ai/eu360ProfileAdapter.ts

app/lib/ai/profileAdapter.ts

app/lib/ai/rateLimit.ts

✅ APIs de IA atualizadas:

app/api/ai/emocional/route.ts

uso de loadMaternaContextFromRequest

suporte a daily_inspiration, weekly_overview, daily_insight

proteção com rate limit (assertRateLimit) e mensagens amigáveis

app/api/ai/rotina/route.ts

conectada ao núcleo MaternaCore (modos smart-recipes e quick-ideas)

integrada ao contexto Eu360 quando disponível

✅ Hooks integrados ao Planner e IA:

usePlannerSavedContents com origin/type padronizados

useRotinaAISuggestions para Ideias Rápidas

usePrimaryChildAge para regras de idade (ex.: bloqueio de receitas < 6 meses)

✅ Sem mudanças em:

app/layout.tsx

BottomNav

paleta de cores (seguindo Visual Style Guide oficial)

sistema de navegação principal

✅ Todas as chamadas de IA têm:

fallback editorial carinhoso

logs de erro no console (sem travar UX)

não revelam “IA” diretamente na experiência da mãe
