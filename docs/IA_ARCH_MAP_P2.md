# 🌸 Materna360 — IA Architecture Map (P2 – IA Inteligente & Personalização)

Fase atual: **P2 — IA Inteligente & Personalização (Fev–Abr/2025)**  
Objetivo: Conectar mini-hubs, Planner e visão 360 por meio de IA segura, empática e alinhada ao layout premium.

---

## 1. Visão Geral

Toda a inteligência da Fase 2 é centralizada em rotas:

- `POST /api/ai/rotina` → suporte prático ao dia a dia (Rotina Leve)
- `POST /api/ai/emocional` → leitura emocional (dia, semana, visão 360)

Princípios:

- IA sempre em **segundo plano** — a mãe interage com textos humanizados, não com termos técnicos.
- Layout **Materna360 Premium** intocável: PageTemplate + SoftCard + MotivationalFooter.
- Sempre com **fallback**: se a IA falhar, a experiência continua com textos padrão acolhedores.
- Nenhum dado sensível é exposto. Tudo fica encapsulado em camadas internas.

---

## 2. Módulo Central de IA

### 2.1 Arquivo principal

- `lib/ai/handlers.ts`

Responsabilidades:

- Implementar funções de alto nível para cada tipo de inteligência:
  - Rotina (receitas, ideias rápidas)
  - Emoções (insight do dia, leitura da semana, visão 360)
- Padronizar o formato de resposta:
  - `insight: string`
  - `weeklyInsight: string`
  - `items: [...]` (quando necessário)
- Garantir:
  - Try/catch sempre
  - Logs claros (`[AI] ...`)
  - Fallback seguro quando o provedor de IA falhar  
    (UI nunca quebra, apenas mostra textos base).

---

## 3. Endpoint `/api/ai/rotina`

### 3.1 Caminho

- Arquivo: `app/api/ai/rotina/route.ts`
- Método: `POST`

### 3.2 Payload de entrada

```jsonc
{
  "feature": "recipes" | "quick_ideas",
  "origin": "rotina-leve",
  "tempoDisponivel": "5" | "10" | "20" | "30+",
  "comQuem": "so-eu" | "eu-e-meu-filho" | "familia-toda",
  "tipoIdeia": "brincadeira" | "organizacao" | "autocuidado" | "receita-rapida",
  "context": {
    "idadeReferenciaMeses": number | null
  }
}
3.3 Resposta esperada
Para feature: "recipes"
jsonc
Copiar código
{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "string",
      "description": "string",
      "timeLabel": "string",
      "ageLabel": "string",
      "preparation": "string"
    }
  ]
}
Para feature: "quick_ideas"
jsonc
Copiar código
{
  "ideas": [
    {
      "id": "idea-1",
      "text": "string"
    }
  ]
}
3.4 Uso atual no app
Tela: /meu-dia/rotina-leve

Receitas Inteligentes

Botão “Gerar receitas”

Chama POST /api/ai/rotina com:

feature: "recipes"

origin: "rotina-leve"

Se a IA falhar:

UI usa mockGenerateRecipes() (3 sugestões padrão)

Mensagem empática via toast.info ou toast.danger

Integração com Planner:

origin: "rotina-leve"

type: "recipe"

payload com:

description

timeLabel

ageLabel

preparation

Ideias Rápidas

Botão “Gerar ideias”

Chama POST /api/ai/rotina com:

feature: "quick_ideas"

filtros:

tempoDisponivel

comQuem

tipoIdeia

Se a IA falhar:

UI usa mockGenerateIdeas()

Integração com Planner:

origin: "rotina-leve"

type: "insight"

payload.description com texto completo da sugestão.

4. Endpoint /api/ai/emocional
4.1 Caminho
Arquivo: app/api/ai/emocional/route.ts

Método: POST

4.2 Features implementadas na P2
feature: "daily_insight" → Insight do Dia

feature: "weekly_overview" → Leitura da Semana

(Reservado para P2 avançada / P3)

feature: "eu360_summary" → visão emocional consolidada

4.3 Payloads
4.3.1 feature: "daily_insight"
Usado para gerar o Insight do Dia em /meu-dia/como-estou-hoje.

jsonc
Copiar código
{
  "feature": "daily_insight",
  "origin": "como-estou-hoje",
  "humor": "Muito bem" | "Bem" | "Neutro" | "Cansada" | "Exausta" | null,
  "energy": "Alta" | "Média" | "Baixa" | null,
  "notes": "string (notas livres da mãe)" // opcional
}
Resposta esperada:

jsonc
Copiar código
{
  "insight": "string"
}
Uso na UI:

Card “Insight do Dia”:

Se sucesso:

Mostra data.insight

Se erro:

Usa fallback:

Mensagem carinhosa padrão

toast.info('Geramos uma sugestão especial pra você ✨')

Não aparece a palavra “IA” para a mãe.

4.3.2 feature: "weekly_overview"
Usado para gerar a leitura da semana no card “Minha Semana Emocional” em /meu-dia/como-estou-hoje.

Versão atual (v1 simplificada):

jsonc
Copiar código
{
  "feature": "weekly_overview",
  "origin": "como-estou-hoje",
  "humor": "Muito bem" | "Bem" | "Neutro" | "Cansada" | "Exausta" | null,
  "energy": "Alta" | "Média" | "Baixa" | null
}
Observação: na P2, estamos passando apenas o estado atual como “amostra” da semana.
Em versões futuras, isso será alimentado por um histórico real de registros.

Resposta esperada:

jsonc
Copiar código
{
  "weeklyInsight": "string",
  // fallback: também aceitamos "insight" como chave
  "insight": "string (opcional)"
}
Uso na UI:

Card “Minha Semana Emocional”:

Placeholder visual: gráfico vazio + texto explicando que aparecerá com registros.

Botão “Gerar leitura da semana”:

Chama /api/ai/emocional com feature: "weekly_overview".

Se sucesso:

Mostra data.weeklyInsight (ou data.insight).

Se erro:

Usa fallback:

Mensagem acolhedora sobre altos e baixos da semana.

toast.info('Trouxemos uma reflexão carinhosa sobre a sua semana ✨').

5. Telas que atualmente usam IA (P2)
5.1 /meu-dia/rotina-leve
Blocos inteligentes:

Receitas Inteligentes

Endpoint: /api/ai/rotina + feature: "recipes"

Integração com Planner: origin: "rotina-leve", type: "recipe".

Ideias Rápidas

Endpoint: /api/ai/rotina + feature: "quick_ideas"

Integração com Planner: origin: "rotina-leve", type: "insight".

Inspirações do Dia

Ainda usando mocks locais.

Preparado para futura ligação com /api/ai/emocional (frases + pequenos rituais).

5.2 /meu-dia/como-estou-hoje
Blocos com IA:

Insight do Dia

Endpoint: /api/ai/emocional

feature: "daily_insight"

Inputs:

humor selecionado

energia selecionada

notas do dia (texto livre, opcional)

Comportamento:

Botão “Gerar insight do dia”

Mensagens empáticas (loading, sucesso, fallback)

Nada de termo “IA” na interface.

Minha Semana Emocional

Endpoint: /api/ai/emocional

feature: "weekly_overview"

Inputs:

humor atual

energia atual

Comportamento:

Botão “Gerar leitura da semana”

Mostra resumo emocional no card, abaixo do placeholder de gráfico.

Fallback acolhedor em caso de erro.

Sugestões pensadas para você esta semana

Conteúdo ainda estático (cards fixos).

Preparado para futura evolução:

Pegar contexto da semana + Planner

Virar sugestões dinâmicas.

6. Próximos Passos de IA (dentro da P2)
Aprimorar o contexto do weekly_overview

Em vez de usar só o estado atual, passar:

Resumo de humores da semana (ex.: contagem por dia).

Resumo de energias (alta/média/baixa ao longo da semana).

Fonte de dados:

Persistência local (chaves como-estou-hoje:YYYY-MM-DD:humor/energy).

Futuro: consolidação em camadas internas.

Levar /api/ai/emocional para o /eu360

Criar feature: "eu360_summary":

Entradas possíveis:

Distribuição de humores e energias no período.

Contagem de itens no Planner por origem (como-estou-hoje, rotina-leve, etc.).

Saída:

Texto-resumo em 2–3 parágrafos empáticos.

UI:

Usar card premium em /eu360 com tom de “leitura da sua fase atual”.

Planejar evolução das Inspirações do Dia

Conectar inspirações com:

estados emocionais mais frequentes

tipo de desafios relatados nas notas

Endpoint provável:

/api/ai/emocional com uma nova feature, ex.: "mini_ritual".

QA e guardrails

Garantir que toda resposta de IA:

seja sempre recapada por textos empáticos.

nunca exponha linguagem técnica (“modelo”, “prompt”, etc.).

Manter fallback sempre presente:

sem IA → experiência continua acolhedora.
