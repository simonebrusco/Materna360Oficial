# 🌸 Materna360

> Um ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil — feito para mães que buscam equilíbrio, leveza e conexão.

<!-- PR #120: cosmos-verse → stabilize/layout-v1 (Feedback Kit + Layout V1) -->

---

## 🏡 Visão Geral

O **Materna360** é um aplicativo web e mobile que combina **tecnologia, autocuidado e parentalidade consciente** em uma experiência integrada e acolhedora.  
Ele auxilia mães a organizarem sua rotina, cuidarem de si mesmas e acompanharem o crescimento de seus filhos com propósito.

---

## 🧩 Estrutura do Produto

### 🏡 **Meu Dia** (`/meu-dia`)
- Saudação dinâmica e mensagem de hoje  
- Planner da família (abas Casa | Filhos | Eu)  
- Rotina, checklist e notas rápidas  
- Registro de momentos com os filhos  
- Toasts e selos de conquistas  

### 🌿 **Cuidar** (`/cuidar`)
- Meditações, respiração guiada e pílulas positivas  
- Dicas de organização e autocuidado  
- Profissionais de apoio e mentoria via WhatsApp  

### 🧸 **Descobrir** (`/descobrir`)
- Sugestões de atividades e brincadeiras por idade/local  
- Filtros inteligentes e IA de ideias  
- Recomendações de livros e produtos afiliados  

### 💛 **Eu360** (`/eu360`)
- Check-in emocional e humor da semana  
- Gratidão e conquistas (gamificação)  
- Resumo de autocuidado e progresso  

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-------------|
| **Frontend** | Next.js 14 · React 18 · TypeScript |
| **Estilo** | Tailwind CSS · Design System Soft Luxury |
| **CMS & UI** | Builder.io (Fusion Space) |
| **Backend / Banco** | Supabase (Auth, Tables, Policies, RLS) |
| **Infra / Deploy** | Vercel (Preview + Production) |
| **Ícones** | Lucide React |
| **Fonte** | Poppins · Quicksand |

---

## 🎨 Identidade Visual

| Elemento | Cor |
|-----------|------|
| Primária | `#ff005e` |
| Secundária | `#ffd8e6` |
| Apoio 1 | `#2f3a56` |
| Apoio 2 | `#545454` |
| Preto | `#000000` |
| Branco | `#ffffff` |

> Estilo **Soft Luxury** — cartões brancos, sombras suaves e tipografia fluida.

---

## 📁 Estrutura de Pastas
app/
meu-dia/
rotina/
momentos/
atividade/
planner/
checklist/
cuidar/
meditar/
respirar/
alegrar/
mentoria/
descobrir/
eu360/
components/
ui/ (Card, Button, Toast, Progress, Avatar...)
blocks/ (MensagemDoDia, Planner, CheckIn, AudioCard...)
lib/
supabase.ts
storage.ts
gamification.ts
flags.ts
styles/
globals.css


---

## ⚙️ Variáveis de Ambiente

| Nome | Descrição |
|------|------------|
| `NEXT_PUBLIC_BUILDER_API_KEY` | Chave pública do Builder.io (Fusion Space) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE` | Chave privada (opcional, server-side) |
| `NEXT_PUBLIC_APP_ENV` | Ambiente (`development` | `preview` | `production`) |

---

## 🚀 Deploy

1. **Clone o projeto:**
   ```bash
   git clone https://github.com/<seu-usuario>/materna360.git
   cd materna360
   
<!-- noop: enable Update PR -->


Instale as dependências:

> Dica: execute `nvm use` (ou `volta pin node@20.19.0`) para garantir Node 20.19.0 antes de instalar.

npm install


Rode o ambiente local:

npm run dev
