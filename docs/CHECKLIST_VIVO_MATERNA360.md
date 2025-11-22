# ✅ CHECKLIST VIVO — Materna360

Versão alvo: **FASE 2 — IA Inteligente & Personalização (Fev–Abr/2025)**  
Branch de trabalho: **cosmos-verse**  
PR atual: **feat/p2-inteligencia-cosmos-verse**  
Status geral: 🟢 Base estável / IA iniciada com segurança

---

## 1. BASE TÉCNICA & AMBIENTE

- ✅ App Router estável (rotas principais confirmadas)
  - /meu-dia/como-estou-hoje  
  - /meu-dia/rotina-leve  
  - /cuidar/autocuidado-inteligente  
  - /cuidar/cuidar-com-amor  
  - /maternar/minhas-conquistas  
  - /maternar/biblioteca-materna  
  - /eu360

- ✅ Layout premium padronizado (PageTemplate + SoftCard + MotivationalFooter)
- ✅ Cores e tipografia seguindo Visual Style Guide
- ✅ Nada de mudanças em:
  - layout.tsx  
  - BottomNav  
  - Sistema de cores da marca  

---

## 2. IA & ENDPOINTS /api/ai/*

### 2.1 Arquitetura de IA

- ✅ Criado documento de arquitetura:
  - `docs/IA_ARCH_MAP_P2.md`  
  - Mapeia:
    - /api/ai/emocional → insights emocionais, semana, Eu360  
    - /api/ai/rotina → rotina leve, receitas, ideias rápidas  

- ✅ Criado módulo central de handlers:
  - `lib/ai/handlers.ts`
  - Responsabilidades:
    - Orquestrar chamadas de IA (OpenAI / provedor)
    - Normalizar respostas
    - Garantir fallback seguro (mock) se falhar

### 2.2 Endpoints

- ✅ `/api/ai/rotina` (POST)
  - `feature: 'recipes'` → receitas inteligentes
  - `feature: 'quick_ideas'` → ideias rápidas
  - Contexto:
    - origin: 'rotina-leve'
    - idadeReferenciaMeses (quando necessário)
    - filtros simples (tempoDisponivel, comQuem, tipoIdeia)

- ✅ `/api/ai/emocional` (POST)
  - Estrutura inicial criada
  - Pensado para:
    - Insight do dia (Como Estou Hoje)
    - Semana emocional
    - Weekly Emotional Insight em /eu360
  - ⚠️ Ainda não conectado à UI (placeholder estático em uso)

---

## 3. MINI-HUBS & FLUXOS INTELIGENTES

### 3.1 /meu-dia/rotina-leve

- ✅ Layout premium padronizado
  - Hero card: **Receitas Inteligentes**
  - Grid 2x2: **Ideias Rápidas** + **Inspirações do Dia**
  - MotivationalFooter no final

- ✅ Integrações com Planner
  - Receitas:
    - `origin: 'rotina-leve'`
    - `type: 'recipe'`
    - payload com título, descrição, tempo, faixa etária, preparo
  - Ideias rápidas:
    - `origin: 'rotina-leve'`
    - `type: 'insight'`
    - payload com descrição da ideia
  - Inspirações:
    - `origin: 'rotina-leve'`
    - `type: 'insight'`
    - payload com frase, pequeno cuidado, mini-ritual

- ✅ Inteligência ligada em produção (com fallback)
  - Botão **“Gerar receitas”**
    - Chama `/api/ai/rotina` com `feature: 'recipes'`
    - Se falhar → `mockGenerateRecipes()`
    - Limite diário de 3 sugestões (contador de plano)
  - Botão **“Gerar ideias”**
    - Chama `/api/ai/rotina` com `feature: 'quick_ideas'`
    - Usa filtros:
      - tempoDisponivel (5, 10, 20, 30+)
      - comQuem (só eu, eu e meu filho, família toda)
      - tipoIdeia (brincadeira, organização, autocuidado, receita-rapida)
    - Se falhar → `mockGenerateIdeas()`

- ✅ Experiência para a mãe **sem aparecer “IA”**
  - Textos humanizados, com tom de amiga
  - IA escondida atrás dos botões – foco na experiência, não na tecnologia

- ✅ Tratamento de erros
  - `toast.success`, `toast.info`, `toast.danger`
  - Logs no console com prefixo `[Rotina Leve] ...`
  - Nunca quebra tela se IA falhar (sempre tem fallback)

### 3.2 /meu-dia/como-estou-hoje

- ✅ Layout premium aplicado com:
  - Card 1: **Meu Humor & Minha Energia**
  - Card 2: **Como foi meu dia?**
  - Card 3: **Insight do Dia (IA)** (ainda estático)
  - Bloco “Semana” com:
    - Minha Semana Emocional (placeholder de gráfico)
    - Sugestões pensadas para você esta semana (card estático)

- ✅ Persistência local do dia
  - Usa `getBrazilDateKey()` para chavear por dia
  - Campos persistidos com `save` / `load`:
    - humor
    - energy
    - notes

- ✅ Integração com Planner
  - Ao salvar notas:
    - `origin: 'como-estou-hoje'`
    - `type: 'note'`
    - `payload.text`
  - Histórico do dia exibido no próprio card:
    - `getByOrigin('como-estou-hoje')` filtrando `type === 'note'`

- ⚠️ Ainda pendente (P2):
  - Conectar “Insight do Dia (IA)” à `/api/ai/emocional`
  - Conectar “Minha Semana Emocional” à mesma API

---

## 4. PLANNER & CONEXÕES ENTRE MINI-HUBS

- ✅ Hook centralizado:
  - `usePlannerSavedContents`
  - Usado em:
    - /meu-dia/como-estou-hoje
    - /meu-dia/rotina-leve
    - (outros mini-hubs seguem)
- ✅ Origem sempre marcada:
  - `'como-estou-hoje'`
  - `'rotina-leve'`
  - Facilita insights posteriores em /eu360

- 🚧 Próximos passos P2:
  - Conectar insights emocionais ao Planner:
    - mapear humores/energias da semana
    - gerar sugestões de bem-estar baseadas em padrões

---

## 5. QA & DEPLOY

- ✅ Build passando (`pnpm run build`)
- ✅ Rotina Leve:
  - Sem erros de sintaxe ou tipagem
  - Fallback mock funcionando
  - Limite de plano respeitado
- ✅ Como Estou Hoje:
  - Persistência diária testada
  - Integração com Planner testada

- ⏳ QA visual adicional:
  - Testar em mobile e desktop:
    - /meu-dia/rotina-leve
    - /meu-dia/como-estou-hoje
   
 ## 6. PRÓXIMOS PASSOS DA FASE 2 (IA)

1. **Insight do Dia (Como Estou Hoje) conectado à `/api/ai/emocional`** ✅ FEITO
   - Botão “Gerar insight do dia” usando IA com fallback seguro
   - Texto humanizado, sem aparecer “IA” na interface

2. Conectar Minha Semana Emocional / Eu360 à `/api/ai/emocional` ⏳
3. Aprimorar mensagens de plano/limites ⏳
4. Rodada de QA visual focada em “sensação de produto pronto” ⏳

---

## 6. PRÓXIMOS PASSOS DA FASE 2 (IA)

Ordem sugerida (micro-passos, sempre com build verde entre eles):

1. **Conectar Insight do Dia (Como Estou Hoje) à `/api/ai/emocional`**
   - Remover texto estático
   - Chamar endpoint com humor + energia + contexto do dia
   - Fallback para texto padrão se IA falhar

2. **Conectar Minha Semana Emocional / Eu360 à `/api/ai/emocional`**
   - Ler registros de humor/energia da semana
   - Mandar resumo para endpoint
   - Renderizar resumo empático no padrão Materna360

3. **Aprimorar mensagens de plano/limites**
   - Garantir textos humanizados quando bater limite diário
   - Manter tom de amiga, nunca “sistema frio”

4. **Rodada de QA visual focada em “sensação de produto pronto”**
   - Revisar espaçamentos, bordas, sombras
   - Conferir consistência de títulos, subtítulos e microcopy

---
