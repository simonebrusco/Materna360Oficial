✅ CHECKLIST VIVO — Materna360
v0.3.3 — P2 Concluída • P3 em Execução
Branch oficial: cosmos-verse
Status: 🟢 Estável e avançando

🔥 P2 — IA Emocional & Rotina Inteligente — FINALIZADA
📌 Escopo entregue com sucesso
🔧 Endpoints de IA


POST /api/ai/emocional


POST /api/ai/rotina


🧠 IA Integrada aos Mini-Hubs


/meu-dia/como-estou-hoje


/meu-dia/rotina-leve


/eu360


🧩 Núcleo da IA consolidado


app/lib/ai/maternaCore.ts


app/lib/ai/eu360ProfileAdapter.ts


app/lib/ai/profileAdapter.ts ← agora corrigido e sem conflitos


app/lib/ai/rateLimit.ts


📌 Rotina Leve — Estado Final P2
Layout Premium entegue
✔ Hero: Receitas Inteligentes
✔ Grid 2 colunas: Ideias Rápidas + Inspirações do Dia
✔ Card-resumo conectado ao Planner
IA de Receitas Inteligentes


Limite diário (3/dia)


Fallback seguro


Salvamento no Planner com payload completo


IA de Ideias Rápidas


Hook oficial: useRotinaAISuggestions


Filtros: tempo, companhia, tipo de ideia


Fallback editorial


Salvamento no Planner (type: insight)


IA de Inspirações do Dia


Foco: Cansaço, Culpa, Organização, Conexão


Payload: frase + pequeno cuidado + mini ritual


Salvamento no Planner


📌 Como estou hoje — Estado Final P2


Humor & Energia salvos por dia


Insight do dia via IA


Semana emocional via IA


Integração completa com Planner


📌 Eu360 — Insight emocional semanal


IA integrada


Copy premium e acolhedora


Integração com perfil real (Eu360 → MaternaCore)


🧪 Status técnico P2


pnpm run build passando


APIs 100% funcionais


UX estável


Fallbacks editoriais em todos os fluxos


Zero regressões no layout principal



🚧 P3 — Finalização Premium & Coerência Global
(Em andamento agora — abril/2025)
🎯 Objetivo
Deixar o Materna360 100% coerente, premium e pronto para a Fase 3 (Biblioteca Materna + Conteúdos Premium).
📦 Escopo oficial P3
1) Polimento Visual Global


Spacing unificado


Radius 24–28px


Bordas #ffd8e6


Sombras premium


Gradientes oficiais


Correção de inconsistências visuais entre hubs


2) Sistema de Botões — Unificação total


primary: #ff005e


secondary: borda #ffd8e6


radius: 999px


shadow: leve


Remover variantes antigas


Padronizar microcopy dos CTAs


3) Microcopy Premium


Hero, subtítulos, textos de apoio


TOV acolhedor, gentil e maternal


Revisão completa das frases do MotivationalFooter


4) Revisão Mobile Premium


Ajuste dos grids


Revisão de colunas 360px / 390px / 414px


Conferir cards sem quebra


5) P3 — Ajuste nos Mini-Hubs
Meu Dia


Rotina Leve (80% pronto → revisar spacing e mobile)


Como Estou Hoje (90% pronto → revisar botões e microcopy)


Cuidar


Deixar Autocuidado Inteligente e Cuidar com Amor no mesmo nível da UX de Meu Dia


Descobrir


Revisão dos cards da biblioteca


Preparar para Fase 3 (conteúdos PDF + artigos premium)


Eu360


Revisão dos inputs + labels


Cards de insight semanal no padrão final


6) Footer motivacional


Revisar todas as frases


Alinhar com routeKey


Aplicar TOV oficial


7) Revisão final + Build


pnpm build


Revisão no Vercel Preview


PR Final → Merge para main



🔥 Tudo acima está limpo, consolidado e sem conflitos.
Se quiser, posso agora:
✅ transformar isso em PDF oficial
✅ preparar a versão para colar na PR
✅ gerar uma mensagem para enviar ao time
Ou seguimos para os próximos arquivos com conflito?
---

# P33.10 — Polimento-PreMonetizacao (ATUALIZAÇÃO FACTUAL — via terminal)

## ✅ Executado nesta P33.10 (commits)
- ✅ Fix anchor do Mindfulness For Moms (href) + refresh lockfile + nvmrc
  - commit: "P33.10: fix Mindfulness anchor + refresh lockfile + nvmrc"
- ✅ Remover pnpm-lock.yaml e impor npm como packageManager (evitar lockfile duplo)
  - commit: beee5257 "chore: remove pnpm lockfile + enforce npm packageManager"
- ✅ Portalizar AppointmentModal para corrigir stacking/z-index (modal no fundo)
  - commit: e0e1de47 "P33.10: portalize AppointmentModal to fix z-index stacking"
  - ✅ Planner: busy-guard + estado ocupado (anti clique duplo) + fix missing useRef import
    - commit: dd645925 "P33.10: add busy guard + fix missing useRef import in WeeklyPlannerCore"
  - ✅ Planner: remover símbolos/emoji do WeeklyPlannerCore (lint warning)
    - commit: 1ff736f6 "P33.10: remove emoji symbols from WeeklyPlannerCore"
  - ✅ Planner: corrigir parsing de dateKey no calendário (evitar shift por timezone)
    - commit: f8269b69 "P33.10: fix planner calendar dateKey parsing (avoid timezone shift)"
  - ✅ Microcopy: "sem cobrança" → "sem autocobrança" (evitar ambiguidade com pagamento)
    - commit: d1902933 "P33.10: microcopy sem cobrança -> sem autocobrança (avoid payment ambiguity)"

## ✅ Diagnóstico recebido (feedback externo dev) — itens a corrigir
1) Ações sem feedback visual (risco de clique duplo / usuário não sabe se disparou)
2) Microcopy ambígua: "sem cobrança" pode ser interpretada como "sem pagamento"
3) Modal/janela de agendamento aparecia no fundo (corrigido via portal/z-index)
4) Componente de calendário não funciona corretamente (planner)
5) E-mails automáticos do Supabase caindo em spam (infra/DNS/SMTP)
6) App cai direto no login sem contextualização (necessidade de landing/welcome)

## 🔜 Plano de execução dentro da P33.10 (ordem segura)
A) Feedback visual/loading/disabled nos fluxos críticos (Planner + ações async)
   - aplicar guards contra clique duplo + estado "salvando..."
   - aplicar toast/snackbar quando fizer sentido
   - checkpoints: npm run -s lint ; npm run -s build
B) Calendário do Planner (WeeklyPlannerCore) — diagnosticar e corrigir comportamento
   - checkpoints: npm run -s lint ; npm run -s build
C) Microcopy "sem cobrança" → trocar para "sem autocobrança" ou "sem pressão" (onde aplicável)
   - checkpoints: npm run -s lint
D) Landing/welcome mínima antes do login (rota pública /)
   - checkpoints: npm run -s lint ; npm run -s build
E) Supabase e-mails no spam — registrar procedimento e requisitos (SPF/DKIM/DMARC/SMTP)
   - item de infra: depende de DNS/provedor (fora do repo), mas checklist e passos ficam documentados aqui

## 🧪 Checkpoints obrigatórios (após cada patch)
- npm run -s lint
- npm run -s build
- git status -sb

