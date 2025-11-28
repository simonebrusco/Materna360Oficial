✅ CHECKLIST VIVO — Materna360

Versão atual: v0.5 — Fases P1–P4 consolidadas
Branch oficial de trabalho: cosmos-verse
Status geral: 🟢 Estável (IA + Layout Premium 2025 ativos)

🧭 1. Mapa das Fases (P1 → P7)

P1 — Fundação do App (CONCLUÍDA)

Base Next.js (App Router)

Abas: Meu Dia, Maternar, Eu360

BottomNav + layout global

Primeiros mini-hubs estruturados (sem IA)

P2 — IA Emocional & Rotina Inteligente (CONCLUÍDA)

/api/ai/emocional

/api/ai/rotina

IA integrada em:

/meu-dia/como-estou-hoje

/meu-dia/rotina-leve

Insight semanal em /eu360

MaternaCore, adapters, rate limit, fallbacks editoriais

Conexão com Planner via usePlannerSavedContents

P3 — Refinamento Premium Inicial (ENCERRADA / ABSORVIDA PELA P4)

Começo da padronização visual

Alguns mini-hubs refinados

Na prática, muito do escopo da P3 foi estendido e concluído dentro da P4.

P4 — Reestrutura Visual 2025 + Planner & Eu360 (ATUAL)

Layout premium 2025 (cores, sombras, spacing, cards)

Planner /meu-dia reposicionado como tela central

/eu360 com wizard + painel da jornada

Hub /maternar como “portal oficial” dos mini-hubs

Revisão geral de tom de voz e hierarquia visual

P5 — Biblioteca & Conteúdos Premium (PRÓXIMA)

Evolução da Biblioteca Materna

Trilhas, filtros, capas, IA de conteúdos/brincadeiras

P6 — Gamificação & Jornada Materna (FUTURO)

Expansão de Minhas Conquistas

Missões, selos, níveis, jornadas suaves

P7 — Onboarding & Personalização Profunda (FUTURO)

Onboarding inteligente

Ativações automáticas de mini-hubs

Recomendações mais profundas baseadas no Eu360

🧩 2. Status por Domínio / Aba
🟣 MEU DIA
Hub / Página	Status	Notas
/meu-dia (Planner)	🟢 Estável	Layout premium 2025, blocos principais ok (calendário, lembretes, atalhos, Hoje por aqui, Inspirações & conteúdos salvos).
/meu-dia/como-estou-hoje	🟢 Estável	IA emocional ativa (dia + semana), TOV alinhado, integra Planner.
/meu-dia/rotina-leve	🟢 Estável	IA de receitas, ideias e inspirações conectada ao Planner. Modelo para outros hubs de IA.
🌸 MATERNAR
Hub / Página	Status	Notas
/maternar (hub principal)	🟡 Bom, mas revisar	Layout premium ativo, mas precisa só conferência fina de espaçamentos e coerência com o Style Guide v0.5.
/cuidar/autocuidado-inteligente	🟡 OK visual	Fluxo funcional, precisa alinhamento fino com layout P4 (spacing, sombras, cards).
/cuidar/cuidar-com-amor	🟡 OK visual	Conteúdo coerente, também precisa ajuste fino visual P4.
/maternar/minhas-conquistas	🟠 Em rascunho	Layout base existe, mas gamificação ainda é muito simples (escopo futuro P6).
/maternar/biblioteca-materna	🟡 Em construção	Layout razoável; falta filtros, capas e integração futura com IA (P5).
💛 EU360
Hub / Página	Status	Notas
/eu360	🟢 Estável	Wizard + painel já estruturados, TOV atualizado, integra IA emocional semanal; ainda pode ganhar refinamentos de UX, mas base está boa.
🤖 3. IA Inteligente — Estado Atual

Entregues (P2):

POST /api/ai/emocional

daily_inspiration, weekly_overview, daily_insight

Integrado com:

/meu-dia/como-estou-hoje

/eu360 (insight semanal)

POST /api/ai/rotina

recipes, quick-ideas

Integrado com /meu-dia/rotina-leve

Núcleo de IA:

app/lib/ai/maternaCore.ts

app/lib/ai/eu360ProfileAdapter.ts

app/lib/ai/profileAdapter.ts

app/lib/ai/rateLimit.ts

Princípios de segurança (mantidos):

Fallback editorial em todos os fluxos

Linguagem sempre acolhedora (seguindo o TOV)

Sem diagnósticos

Sem exposição direta do termo “IA” para a mãe

Próximos passos de IA (P5–P7):

IA de Biblioteca (trilhas, recomendações por idade).

IA de brincadeiras (dentro da Biblioteca / Rotina Leve, quando fizer sentido).

IA de gamificação leve (Minhas Conquistas).

IA de onboarding (P7).

🎨 4. Layout Premium — Auditoria Rápida
Área	Status	Observação
Sistema de cores	🟢 OK	Seguindo Visual Style Guide v0.5 (rosa #FF005E, plum, rosa suave etc.).
Cards & sombras	🟢 OK	SoftCards padronizados; checar só consistência onde houver customização antiga.
Spacing & grids	🟡 A revisar	Planner e mini-hubs principais ok; Cuidar + Biblioteca + Conquistas precisam daquele “acabamento Materna360”.
BottomNav	🟢 OK	Não alterar.
Hero / PageTemplate	🟢 OK	Padrão estabelecido; qualquer nova página deve copiar referências oficiais.
🔐 5. Segurança do Projeto

app/layout.tsx preservado

BottomNav preservado

Estrutura de mini-hubs respeitada

Rotas de IA e adapters estáveis

Feature flags mantidas:

NEXT_PUBLIC_FF_PDF_EXPORT

NEXT_PUBLIC_FF_COACH_V1

NEXT_PUBLIC_FF_INTERNAL_INSIGHTS

NEXT_PUBLIC_FF_EMOTION_TRENDS

Regras de ouro (continuam valendo):

Nada fora de /meu-dia, /maternar, /eu360.

Nada de inventar layout novo.

Nada de trocar cores por conta própria.

Builder só atua dentro dos padrões oficiais.

📌 6. Prioridades Imediatas (P4 ainda em curso)

Ordem segura sugerida:

Revisar visual dos mini-hubs em Cuidar

Alinhar Autocuidado Inteligente e Cuidar com Amor ao layout P4.

Dar uma “amarrada premium” em Maternar (hub principal)

Garantir que o hub esteja com cara de home central organizada.

Ajustes finos em Biblioteca Materna

Layout, estados vazios, microcopy alinhados ao TOV.

Revisar Minhas Conquistas como base da P6

Deixar layout pronto e estável, mesmo que gamificação profunda fique pro futuro.

Limpeza de possíveis restos de layout antigo

Conferir se não há páginas com visual “pré-P4”.

🎯 7. Próximos Marcos por Fase

Fechar P4

Todos os mini-hubs com layout P4

Navegação 100% coerente

Microcopy revisado nas páginas principais

Iniciar P5

Foco total em Biblioteca Materna + conteúdos premium

Estrutura de trilhas e filtros

Preparar terreno da P6

Consolidar base de Minhas Conquistas

Definir modelo de missões/selos
