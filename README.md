🌸 Materna360

Ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil — feito para mães que buscam equilíbrio, leveza e conexão.

/meu-dia
 · /cuidar
 · /descobrir
 · /eu360

🏡 Visão Geral

O Materna360 combina tecnologia, autocuidado e parentalidade consciente numa experiência integrada e acolhedora.
Ajuda mães a organizarem a rotina, cuidarem de si mesmas e acompanharem o crescimento dos filhos com propósito.

🧭 Abas do Produto
🏡 Meu Dia (/meu-dia)

Saudação dinâmica e Mensagem do Dia

Mood (check-in rápido)

Atividade do Dia (destaque)

Acessos rápidos

Planner (chips: +Brincadeira, +Receita, +Livro, +Brinquedo, +Recomendação)

Recomendações do dia

Checklist (duplicar ontem/amanhã, limpar)

🌿 Cuidar (/cuidar)

Mindfulness (áudios), Respiração guiada

Jornadas (7 dias) com progresso

Dicas de organização (presets e filtros)

Para Você (Autocuidado, Receitas, Sono)

Profissionais de apoio (lista compacta + filtros)

🧸 Descobrir (/descobrir)

Filtros Inteligentes (Idade/Local/Tempo/Energia) + pílulas ativas

Sugestão do Dia (destaque) com CTAs

Livros (grid 2 col)

Brinquedos (grid 2 col)

IA de Ideias (Beta) com quotas por plano

💛 Eu360 (/eu360)

Perfil + Seu Plano (Free/Plus/Premium)

KPIs (Humor, Pausas, Gratidões, Dias com Planner)

Humor da Semana

Conquistas (gamificação)

Gratidão

Resumo da Semana (4 pilares + tendência)

Exportar Semana (PDF) (Plus+)

🎨 Identidade Visual (Soft Luxury)

Cores:
Primária #ff005e · Secundária #ffd8e6 · Títulos #2f3a56 · Texto #545454 · Preto #000 · Branco #fff

Gradiente Global (anti-faixas):
linear-gradient(180deg, #FFE5EF 0%, #FFFFFF 64%)

Sombra padrão (cards):
0 8px 28px rgba(47,58,86,.08), inset 0 0 0 1px rgba(47,58,86,.04)

Tipografia: Poppins (títulos), Quicksand (texto)

Ícones: Lucide (evitar emoji em títulos de UI)

Acessibilidade: contraste AA, foco visível, alvos ≥44px, ARIA em ícones

Safe-area: pb-24 no container principal (nav flutuante não cobre CTAs)

🛠️ Stack
Camada	Tecnologia
Frontend	Next.js 14 · React 18 · TypeScript · Tailwind
CMS & UI	Builder.io (Fusion Space)
Backend / Dados	Supabase (Auth, Tables, RLS, Storage, Edge)
Deploy	Vercel (Preview + Production)
Ícones	Lucide React
Fontes	Poppins · Quicksand
📁 Estrutura de Pastas
app/
  (tabs)/
    meu-dia/  cuidar/  descobrir/  eu360/
  api/
    report/weekly-pdf/route.ts
components/
  common/  ui/  features/
lib/
  api.ts
  telemetry.ts
  supabase.ts
  flags.ts
styles/
  globals.css  tokens.css
types/
  api.d.ts
supabase/
  seed.sql


Observação: manter 1 fonte de tokens (cores/gradiente/sombras) em styles/tokens.css.

✅ Requisitos

Node 20.19.0
Use nvm use ou volta pin node@20.19.0

PNPM (recomendado) ou NPM

⚙️ Variáveis de Ambiente

Crie .env.local a partir de .env.example.

Nome	Descrição
NEXT_PUBLIC_SUPABASE_URL	URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY	Chave pública Supabase
SUPABASE_SERVICE_ROLE	Chave privada (server-side)
NEXT_PUBLIC_SUPABASE_EDGE_URL	Base das Edge Functions
NEXT_PUBLIC_BUILDER_API_KEY	Chave pública Builder.io
NEXT_PUBLIC_APP_ENV	development | preview | production
NEXT_PUBLIC_CHECKOUT_PLUS_URL	Link de checkout Plus
NEXT_PUBLIC_CHECKOUT_PREMIUM_URL	Link de checkout Premium
🧰 Scripts
# instalar
pnpm install

# dev
pnpm dev

# build + typecheck + lint (CI)
pnpm typecheck && pnpm lint && pnpm build

# start (produção local)
pnpm start


(se usar npm, troque pnpm por npm run onde aplicável)

🗃️ Dados & Seeds (mínimo)

Tabelas principais: profiles, children, moods, checklist_items, planner_items, activities_log, achievements, achievements_user, gratitudes, telemetry_events, catalog_ideas, catalog_books, catalog_toys, plans, subscriptions

RLS: tudo por auth.uid() exceto telemetry_events (apenas via service role/Edge)

Seed local/staging:

psql < supabase/seed.sql

🔌 RPCs (Edge) & Rotas

Edge RPCs: v1/award-xp, v1/planner-upsert, v1/checklist-batch, v1/gratitude-add, v1/profile-upsert, v1/ideas-generate, v1/plan-feature-check, v1/telemetry

PDF: /api/report/weekly-pdf (server-side, gate Plus)

Idempotency-Key: obrigatório em mutações (evita XP duplicado)

🧩 Planos & Gates

Free: IA 3/dia; 1 Jornada; sem PDF

Plus: IA 10/dia; até 3 Jornadas; PDF on

Premium: IA ilimitada (com throttle); todas Jornadas; insights avançados

UI e servidor devem validar gates (não apenas a UI)

🎮 Gamificação (server-side)

XP por ação com limite diário (cap) e por tipo

award-xp calcula XP, streak e conquistas (cliente não calcula)

Conquistas com 3 estados; XP bônus único ao desbloquear

🔒 Privacidade & Telemetria

Nunca enviar PII sensível em eventos (sem textos de gratidão, nomes de crianças)

Telemetria mínima por aba, via Edge, com retenção definida

Cookies/localStorage documentados

🧪 QA Rápido (smoke)

Gradiente sem “faixas” em todas as abas

Nav inferior não cobre CTA final (pb-24)

“Atividade do Dia” aparece uma única vez em Meu Dia

Filtros inteligentes em Descobrir + pílulas ativas

“Para Você” está em Cuidar (não em Descobrir)

Toasts de XP só após sucesso do servidor

IA de Ideias respeita quotas por plano

PDF (Plus) baixa e abre; bloqueado em Free

🚀 Deploy (Vercel)

Branches: PRs abrem Preview Deploy; produção só via main verde

Env por ambiente: defina todas as variáveis nas 3 targets (Dev/Preview/Prod)

Checks de CI: typecheck + lint + build devem passar antes de promover

Rollback: mantenha tag do último deploy verde (retorno em 1 clique)

🤝 Contribuição

Feature branches: feature/<nome> + PR

Commits claros e pequenos

Antes de abrir PR: pnpm typecheck && pnpm lint && pnpm build

Notas Importantes

Design tokens centralizados: não sobrescrever sombra/gradiente localmente

Ícones: usar Lucide; emojis só no conteúdo, não em títulos

A11y: contraste AA e foco visível são obrigatórios

Estabilidade > novidade: recurso experimental atrás de feature flag

Licença

Definir.
