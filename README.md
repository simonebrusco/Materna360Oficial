# 🌸 Materna360

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
- **Soft Luxury Design System** – clean, soft shadows, elegant typography  
- **Coach Materno (v0.2)** – empathetic, tone-adaptive guidance with weekly focus  
- **Emotion Trends** – visual history of mood and energy  
- **PDF Export (v1)** – printable emotional and planner summary  
- **Paywall Modal** – gentle premium upsell for export and advanced insights  
- **Telemetry System** – unified analytics for navigation, mood, and premium actions  

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
