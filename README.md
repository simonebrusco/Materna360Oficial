# 🌸 Materna360 — App Premium de Parentalidade Inteligente  
**Versão Oficial do README · Março/2025**

**Branch ativa:** `cosmos-verse`  
**Produção:** Vercel  
**Status atual:** 🟢 Estável · **Fase 3: Inteligência + Layout Premium Consolidado + Mini-Hubs Inteligentes**

---

# 🧭 Visão Geral

O **Materna360** é um web app premium criado para apoiar mães reais na rotina, nas emoções e na organização da vida familiar.  
Ele combina:

- 🌿 Mini-hubs temáticos inteligentes  
- 🧠 IA aplicada (brincadeiras, receitas, insights emocionais)  
- 📘 Conteúdos educativos (PDFs, trilhas, guias)  
- ✨ Design system premium  
- 🎮 Gamificação leve  
- 💗 Tom acolhedor e seguro  

Todo o projeto é estruturado para entregar **clareza, leveza e orientação**, sem julgamentos.

---

# 🏛 Arquitetura Principal

Baseado em **Next.js 14 (App Router)** com:

- React + TypeScript  
- Tailwind CSS (Design System Materna360)  
- Camada de IA via API Routes  
- Vercel (deploy, preview, produção)  
- Builder.io para edição controlada de telas  
- Telemetria unificada  
- Persistência local (atual) → migração opcional para DB no futuro  

📌 **System Design completo**:  
`docs/SYSTEM_DESIGN_v0.4.pdf`  
:contentReference[oaicite:0]{index=0}

---

# 🧩 Estrutura das Abas do App

O Materna360 tem **3 eixos principais**:

| Aba | Função |
|-----|--------|
| **Meu Dia** | Planner, Rotina Leve, Como Estou Hoje |
| **Maternar** | Mini-hubs principais |
| **Eu360** | Perfil completo da mãe + dados-chave |

As abas **Cuidar** e **Descobrir** existem apenas como **rotas técnicas legadas** (não criar nada novo nelas).

---

# 🧱 Mini-Hubs Oficiais

### **1. Meu Dia**
- `/meu-dia/rotina-leve` – Organização do dia  
- `/meu-dia/como-estou-hoje` – Humor & energia  
- `/meu-dia/minhas-conquistas` – Gamificação leve  
- `/meu-dia` – Planner premium  

### **2. Maternar**
- `/maternar/cuidar-com-amor`  
- `/cuidar/meu-bem-estar` (Autocuidado Inteligente)  
- `/maternar/biblioteca-materna`  
- `/maternar/minhas-conquistas`  
- `/maternar/materna-plus` (assinatura futura)

### **3. Eu360**
- `/eu360` – Formulário premium + figurinha + dados de personalização  

📌 **Matriz completa do que vai para onde**:  
`docs/MINI_HUB_MATRIX.pdf`

---

# 🎨 Design System Premium

Todos os mini-hubs seguem o **Materna360 Premium Layout**, composto por:

- `<PageTemplate>`  
- `<SectionWrapper>`  
- Grid 1x1 (mobile) / 2x2 (desktop)  
- SoftCards (bordas 3XL, sombras leves)  
- Ícones em ameixa  
- Tags em rosa  
- Tom de voz materno, curto, acolhedor  

📌 **Guia visual oficial**:  
`docs/VISUAL_STYLE_GUIDE.pdf`  
📌 **Copy e microcopy**:  
`docs/COPY_PLAYBOOK.pdf`  
📌 **Tone of Voice**:  
`docs/TONE_OF_VOICE_MASTER_GUIDE.pdf`  

---

# 🤖 Inteligência (IA)

### IA implementada / simulada:
- Sugestões de planejamento (Rotina Leve)  
- Ideias rápidas com contexto  
- Recomendações de leveza  

### IA em desenvolvimento:
- Brincadeiras personalizadas  
- Receitas inteligentes por ingredientes  
- Insights emocionais semanais  
- Desenvolvimento infantil guiado

### IA & Personalização

Todos os endpoints de IA do Materna360 (ex.: `/api/ai/rotina`, `/api/ai/emocional`, etc.)
devem seguir as regras descritas em:

- `docs/AI_PERSONALIZATION_MODEL.md`

Esse documento define o tom de voz, regras de segurança emocional e formatos de resposta.


📌 **System Design — Camada de IA**  
`docs/SYSTEM_DESIGN_v0.4.pdf`  
:contentReference[oaicite:1]{index=1}

---

# 🎮 Gamificação

O app possui:

- Selos  
- XP diário  
- Missões leves  
- Progresso mensal  
- Medalhas futuras (Fase 4)  

Documento oficial:  
`docs/MINI_HUB_MATRIX.pdf`

---

# 📚 Biblioteca Materna

A Biblioteca reúne:

- PDFs  
- E-books  
- Guias educativos  
- Trilhas de desenvolvimento  
- Conteúdos filtrados por idade, tema e formato  

**20 novos PDFs** estão planejados para Fase 3.

---

# 🧪 Telemetria & Observabilidade

Telemetria ativa para:

- page_view  
- nav_click  
- card_click  
- coach_*  
- pdf_*  
- plan_*  
- emotion_trend  
- inactivity_*  

Painel interno:  
`/admin/insights` (somente local)

---

# 🛠 Como Contribuir (DEV & Builder)

Guia completo de contribuição:  
`docs/CONTRIBUTING_GUIDE.pdf`  
:contentReference[oaicite:2]{index=2}

Regra de ouro:  
> **Nunca criar novos layouts. Sempre copiar o layout oficial do mini-hub.**

### Arquivos proibidos de alterar:
- `app/layout.tsx`  
- `BottomNav.tsx`  
- `PageHeader.tsx`  
- `SoftCard.tsx`  
- `AppIcon.tsx`  
- `lib/telemetry.ts`  
- `app/api/*`  

### Comandos
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build

markdown
Copiar código

---

# 🗂 Documentação Interna (Kit Materna360)

Todos os documentos internos estão na pasta `/docs`:

- **Product Strategy One-Pager**  
- **Macro Fases**  
- **Mini-Hub Matrix**  
- **Tone of Voice Master Guide**  
- **Visual Style Guide**  
- **Copy Playbook & Layout System**  
- **System Design v0.4**  
- **Builder Guidelines**  
- **Builder Prompt Template**  
- **Contributing Guide**  
- **Checklist Vivo**  
- **Experience Playbook** (CX + UX)

---

# 📈 Roadmap 2025

De acordo com o documento de Macro Fases:

| Fase | Período | Foco |
|------|---------|------|
| **Fase 1** | Fev–Mar | Layout Premium + Mini-Hubs |
| **Fase 2** | Mar–Abr | IA Inteligente |
| **Fase 3** | Abr–Jun | Biblioteca + Conteúdos |
| **Fase 4** | Jun–Ago | Gamificação Avançada |
| **Fase 5** | Set–Dez | Onboarding + Materna+ + Marketing |

---

# 📌 Status Atual (Março/2025)

- Layout Premium → **98% pronto**  
- Hub Maternar → **pronto e refinado**  
- Mini-Hubs → **todos estruturados**  
- Planner → aguardando polimento final  
- Formulário Eu360 → layout premium pendente  
- IA → em fase de integração  
- Biblioteca → pronta para receber PDFs  
- Materna+ → aguardando estruturação de planos  
- Footer Premium → pronto  
- Telemetria → unificada  
- Código → limpo e estável  

---

# 💗 Criadora

**Simone Brusco**  
Pedagoga, mãe e idealizadora do Materna360.  
_"A aventura de ser pai e mãe começa aqui."_

---

# 📝 Observação Final

Este README reflete:

- Arquitetura real  
- Documentação oficial  
- Fase atual de desenvolvimento  
- Padrões de escrita e design Materna360  
- Segurança no desenvolvimento  
- Direção futura do app  

Qualquer alteração deve respeitar o **Kit Interno Materna360**.

