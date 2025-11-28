🌸 Materna360 — README Oficial (v0.5 · 2025)

O Materna360 é um web app premium que ajuda mães a viverem dias mais leves, organizados e emocionalmente claros — com apoio gentil, IA segura e uma experiência visual impecável.

O projeto combina:

Next.js App Router

React + TypeScript

Tailwind CSS (Design System Materna360)

Layout Premium 2025

Mini-Hubs especializados

Planner inteligente

IA emocional & IA de rotina

Vercel (deploy, edge, preview)

Builder.io (edição visual controlada)

Este README resume como o projeto funciona, como contribuir e onde estão os documentos oficiais.

🧭 Rotas principais (BottomNav)

O app é dividido em 3 eixos:

1. /meu-dia — Planner diário + IA emocional

Planner leve

Como Estou Hoje (IA)

Rotina Leve (IA)

Inspirações & conteúdos salvos

2. /maternar — Hub central da maternidade

Acesso aos mini-hubs:

Autocuidado Inteligente

Cuidar com Amor

Biblioteca Materna

Minhas Conquistas

Aprender Brincando (futuro)

Materna+ (futuro)

3. /eu360 — Perfil e personalização

Wizard do perfil

Jornada emocional

Insight semanal por IA

🧩 Mini-Hubs existentes
Mini-Hub	Rota	Status
Rotina Leve	/meu-dia/rotina-leve	IA ativa + Planner integrado
Como Estou Hoje	/meu-dia/como-estou-hoje	IA emocional completa
Autocuidado Inteligente	/cuidar/meu-bem-estar	Layout premium
Cuidar com Amor	/cuidar/cuidar-com-amor	Coerente e estável
Biblioteca Materna	/maternar/biblioteca-materna	Em expansão (P5)
Minhas Conquistas	/maternar/minhas-conquistas	Em rascunho (P6)
Meu Perfil	/eu360	Wizard e painel integrados à IA
🤖 IA integrada (P2 concluída)

As rotas atuais:

POST /api/ai/emocional
POST /api/ai/rotina


IA utilizada para:

Humor do dia

Energia

Insight semanal

Inspirações do dia

Receitas Inteligentes

Ideias rápidas

Com fallbacks editoriais, tom acolhedor e linguagem Materna360.

🎨 Design System — Materna360 Premium

Elementos fundamentais:

Paleta oficial 2025 (rosa #FF005E, plum, rosa neve, branco)

SoftCards

PageTemplate e SectionWrapper

Grids 1×2 (mobile → desktop)

Sombras suaves

Radius 3XL

Texto em Poppins

Zero CSS fora do Tailwind

Referência completa:
📎 Visual Style Guide (v0.5)

🔐 Segurança do projeto

Nunca alterar sem motivo forte:

app/layout.tsx

components/common/BottomNav.tsx

components/common/PageHeader.tsx

components/ui/SoftCard.tsx

components/ui/AppIcon.tsx

lib/ai/*

lib/telemetry.ts

Feature Flags oficiais:

NEXT_PUBLIC_FF_PDF_EXPORT
NEXT_PUBLIC_FF_COACH_V1
NEXT_PUBLIC_FF_INTERNAL_INSIGHTS
NEXT_PUBLIC_FF_EMOTION_TRENDS

🛠️ Fluxo de contribuição
Branch oficial de trabalho:

cosmos-verse

Regras:

Sempre criar branches de feature a partir de cosmos-verse.

Implementar mudanças seguindo layout premium.

Rodar:

pnpm typecheck
pnpm lint


Testar rotas manualmente.

Abrir PR contra cosmos-verse.

PRs grandes → não são permitidos. Dividir em partes.

📚 Documentação Oficial

Todos os documentos essenciais ficam na pasta /docs.

🔹 Arquitetura

System Design — v0.5

🔹 Design & Experiência

Visual Style Guide — v0.5

Tone of Voice — v0.5

🔹 Produto & Mini-Hubs

Mini-Hub Matrix — v0.5

Macro Roadmap — 2025

🔹 Engenharia & Processo

Contributing Guide — v0.5

Checklist Vivo — v0.5

📈 Roadmap 2025 (macro)

P4 — Finalização do layout premium (em andamento)

P5 — Biblioteca Materna + trilhas + IA de conteúdos

P6 — Gamificação e Jornada Materna

P7 — Onboarding inteligente + personalização profunda

💛 Filosofia Materna360

Se uma mudança é boa tecnicamente, mas não acolhe a mãe,
então ela não pertence ao Materna360.

Aqui, a experiência é sempre:

leve

calma

humana

prática

emocionalmente segura

visualmente premium
