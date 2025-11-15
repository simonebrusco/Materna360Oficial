# 🌸 Materna360


## 🚀 Versão Atual — v0.2.0-p2-staging1 (cosmos-verse)
**Status:** 🟢 Estável em Staging / **Fase P2 – Inteligência & Personalização ✅ COMPLETO**
**Main:** v0.2.0-p2

### ✅ P2 Entregas Completas
- ✅ **Coach Materno v0.3** – Mensagens contextuais baseadas em padrões (low_energy_week, inactivity, trend_up, balanced, no_data)
- ✅ **Weekly Emotional Insight** em /eu360 – Resumo semanal com tone empático
- ✅ **Inactivity Reminder** em /meu-dia – Nudge suave para retomar registros (3+ dias)
- ✅ **Premium PDF v2** – Capa dinâmica, sumário, seções semanais (gated por plano)
- ✅ **Internal Telemetry Dashboard** (`/admin/insights`) – KPIs, filtros, gráfico, botão clear (local-only)
- ✅ **Unified Telemetry** – Events completos: page_view, nav_click, card_click, coach*, pdf*, paywall*, plan_*, discover_save, reminder_inactivity_*
- ✅ **TypeScript & Builds** – Sem erros, tipos limpos, compilação passa

### Próximos marcos (P3)
- A11y final (contraste AA, foco visível)
- QA responsivo (tablet ≥768px)
- Edge case testing
- Deploy para produção

## 🚀 Versão Atual — v0.2.0-p2-staging1
**Status:** 🟢 Estável em Staging / Fase P2 – Inteligência & Personalização  

### Principais entregas
- Coach Materno v0.2 (persistência e tom empático)
- PDF Export v1 (capa com dados do coach)
- Telemetria unificada (nav/page/card/coach/pdf/paywall)
- Correções de hidratação e tipos
- Builder Preview estável (`/builder-embed`)

### Próximos marcos
- PDF v2 (capa dinâmica e sumário premium)
- Feature gating real por plano
- Diário da criança persistente (/cuidar)
- QA visual e A11y final


📄 Veja também:
- [`/docs/DEPLOYMENT_CHECKLIST_COSMOS_VERSE.md`](./docs/DEPLOYMENT_CHECKLIST_COSMOS_VERSE.md)
- [`/docs/QA_CHECKLIST.md`](./docs/QA_CHECKLIST.md)

**Materna360** is a mobile-first web application focused on the emotional and organizational well-being of mothers.  
It combines daily planning, emotional tracking, and personalized coaching — all inside a soft, premium digital experience.

---

## 🧭 Project Overview

**Vision:**  
Empower parents — especially mothers — to live with more balance, self-compassion, and connection.  

**Core Tabs:**
| Tab | Purpose |
|------|----------|
| 🩷 **Meu Dia** | Daily planner + mood check-in + recommendations |
| 🌿 **Cuidar** | Health & emotional care for mother and child |
| 🪶 **Maternar** | Central hub connecting all experiences |
| 🎨 **Descobrir** | Educational and playful learning content |
| 💫 **Eu360** | Self-care, reflections, and premium reports |

---

## 🧩 Key Features
- **Soft Luxury Design System** – clean, soft shadows, elegant typography, premium feel
- **Coach Materno v0.3** – Context-aware, pattern-based messages with empathetic tone (5 distinct patterns)
- **Weekly Emotional Insight** – Visual summary of mood/energy trends with personalized guidance
- **Emotion Trends Chart** – SVG visualization of 7-day and 28-day patterns
- **Inactivity Reminders** – Gentle nudge after 3+ days without entries (local-only, non-judgmental)
- **Premium PDF Export v2** – Branded cover, dynamic summary sections, gated by subscription plan
- **Internal Telemetry Dashboard** (`/admin/insights`) – Real-time event analytics, filters, and visualization (Preview-only)
- **Paywall Modal** – Elegant premium upsell for PDF export and advanced features
- **Unified Telemetry System** – Comprehensive analytics across all tabs and user interactions  

---

## 🔧 Tech Stack
- **Next.js 14 / App Router**
- **TypeScript + Tailwind CSS**
- **Lucide Icons** (no emojis)
- **LocalStorage** persistence
- **Vercel Preview Environments**

---

## 📈 Progress Tracking

See the full live development status and roadmap here:  
👉 [**docs/PROJECT_TRACKER.md**](./docs/PROJECT_TRACKER.md)

**Current progress:** 🟢 78% complete  
**Estimated completion:** ~19 working days (~4 weeks)

---

## 🚀 Next Milestones
- PDF Premium v2 (branded cover + summary)
- Internal insights dashboard
- QA polish (A11y + responsiveness)
- Public launch (target: **December 2025**)

---

## 💡 Author & Concept

Developed by **Simone Brusco**  
Pedagogue, mother, and creator of **Clube Nenê Feliz**, bringing emotional awareness and balance into the digital age.  

**"A aventura de ser pai e mãe começa aqui."**



## What's new (P2 – Intelligence & Personalization)
- Premium PDF v2 on /eu360 (cover, dynamic TOC, weekly blocks)
- Real plan gating (free vs premium) with telemetry
- /descobrir: Save for later UX (toast + aria-pressed + icon toggle)
- /cuidar: Child Diary delete button variant fixed (destructive)

