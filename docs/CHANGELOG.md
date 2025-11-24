✅ CHANGELOG — P2 IA Emocional & Rotina Inteligente

Versão: v0.3.3-P2
Branch: cosmos-verse
Status: Concluído e estável

🎯 1. APIs & Núcleo de IA
📌 Criado / Atualizado
app/api/ai/emocional/route.ts

Suporte às features:

daily_inspiration

weekly_overview

daily_insight

Integração direta com:

loadMaternaContextFromRequest

assertRateLimit

callMaternaAI(mode: 'daily-inspiration')

Adicionados fallbacks editoriais carinhosos.

Headers no-store aplicados a todas as respostas.

Tratamento de erro + mensagens seguras.

app/api/ai/rotina/route.ts

Suporte aos modos:

recipes

quick-ideas

Integração total com contexto Eu360.

Fallbacks editoriais seguros.

🧠 2. Estrutura de IA
📌 Criado
app/lib/ai/eu360ProfileAdapter.ts

Adaptador completo entre /api/eu360/profile e MaternaCore.

Conversão para:

MaternaProfile

MaternaChildProfile

Seleção automática da criança principal.

Normalização de arrays, faixas etárias e campos opcionais.

Totalmente puro (sem efeitos colaterais).

📌 Criado
app/lib/ai/profileAdapter.ts

Interface unificada para carregamento de contexto Materna via Request.

Conecta:

cookies

Eu360

adaptador de perfil

📌 Criado
app/lib/ai/rateLimit.ts

Rate limit seguro por rotas.

Suporte a janelas configuráveis (ms).

Fallback editorial e status 429 seguro.

Correção do @ts-expect-error inválido (build fix).

📚 3. Hooks
📌 Atualizado
usePlannerSavedContents

Integração direta com mini-hubs:

rotina-leve

como-estou-hoje

Garantia de persistência limpa por dateKey.

Normalização de origin e type.

📌 Criado
usePrimaryChildAge

Determina idade principal da criança via contexto Eu360.

Usado para receitas (< 6 meses).

📌 Atualizado
useRotinaAISuggestions

Devolve ideias rápidas via IA.

Controlado e seguro, sem chamadas automáticas.

🧩 4. Páginas & Funcionalidades
📌 Atualizado
app/(tabs)/meu-dia/rotina-leve/Client.tsx

Nova arquitetura UI:

Receitas Inteligentes

Ideias Rápidas

Inspirações do Dia

Resumo conectado ao Planner

Integração total com:

IA Rotina (recipes, quick-ideas)

IA Emocional (daily_inspiration)

Filtros inteligentes

Regras de idade (<6 meses bloqueia receitas).

Salvamento no Planner:

recipe

insight

📌 Atualizado
app/(tabs)/meu-dia/como-estou-hoje/Client.tsx

Insight diário via IA

Insight semanal via IA

Persistência de humor, energia e notas

Salvamento de:

note

insight

UI premium finalizada

📌 Atualizado
app/(tabs)/eu360/Client.tsx

Card de Visão Emocional Semanal

Integração com IA semanal

Linguagem carinhosa + layout premium

🧪 5. Estabilidade Técnica

Build passando (pnpm run build)

Sem regressões visuais

Sem alterações em:

layout.tsx

BottomNav

Visual Style System

Paleta de cores

Navegação

Todas as APIs com:

logs controlados

comportamento previsível

fallbacks editoriais

sem revelar IA

✔️ 6. Conclusão da P2

A fase P2 está 100% concluída, com:

IA emocional

IA de rotina

integração com Planner

integração com Eu360

layout premium preservado

UX com linguagem acolhedora

arquitetura segura e estável
