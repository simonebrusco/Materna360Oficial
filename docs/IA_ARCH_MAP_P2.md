🌸 Materna360 — IA ARCH MAP — P2

Fase 2 — IA Inteligente & Personalização (Fev–Abr/2025)

1. Visão Geral

A Fase 2 tem como objetivo construir uma camada de IA centralizada, segura e consistente, conectando os mini-hubs e o Planner sem alterar o layout premium nem a arquitetura base.

Nesta fase, toda IA do Materna360 deve:

Passar por rotas centralizadas em /api/ai/*

Respeitar o Tom de Voz Materna360

Evitar diagnósticos, linguagem médica ou prescrições

Entregar respostas curtas, acolhedoras e acionáveis

Integrar-se, quando fizer sentido, ao Planner e/ou insights emocionais

Este documento define:

A arquitetura de IA (endpoints e contratos)

O mapa de mini-hubs → IA

As regras de segurança e tom de voz

Como a IA conversa com o Planner e com os insights.

2. Princípios da Camada de IA

Centralização

Nenhum componente de UI conversa diretamente com provedores de IA.

Toda chamada passa por /api/ai/* + serviços dedicados em lib/ai/*.

Isolamento de Layout

Os endpoints de IA não alteram layout, rotas ou Design System.

Apenas devolvem dados; a UI continua seguindo o padrão Materna360 Premium.

Gentileza Antes de Inteligência

A IA nunca “manda”, sempre sugere.

Linguagem sem culpa, sem julgamento e sem “receitas mágicas”.

Segurança & Limites

Sem diagnósticos médicos, psicológicos ou psiquiátricos.

Sem recomendação de medicamento, dosagem ou tratamento.

Sempre com reforço de que não substitui profissionais.

Conexão com o Planner

Quando fizer sentido, a IA pode sugerir:

pequenas tarefas

lembretes de autocuidado

registros no Planner

Mas quem decide registrar é sempre a mãe (ação explícita no UI).

3. Mapa de Endpoints /api/ai/*

Endpoints principais da Fase 2:

/api/ai/rotina

/api/ai/emocional

/api/ai/autocuidado

/api/ai/biblioteca

/api/ai/planner

3.1. /api/ai/rotina

Objetivo
Gerar ideias rápidas, receitas inteligentes e inspirações para o mini-hub Rotina Leve, com foco em praticidade e leveza no dia a dia.

Consumidores

Rota /meu-dia/rotina-leve

Seções:

Ideias Rápidas

Receitas Inteligentes

Inspirações do Dia

Request (exemplo)

{
  "userId": "optional",
  "locale": "pt-BR",
  "mode": "ideias_rapidas | receitas | inspiracoes",
  "dayContext": {
    "weekday": "quarta-feira",
    "timeOfDay": "noite",
    "energyLevel": "baixa",
    "hasKids": true
  },
  "preferences": {
    "quickMeals": true,
    "lowBudget": false
  }
}


Response (formato base)

{
  "version": "p2",
  "type": "rotina",
  "tone": "materna360",
  "title": "Sugestões para deixar sua rotina mais leve",
  "body": "Aqui vão algumas ideias simples para hoje...",
  "items": [
    {
      "id": "idea_1",
      "label": "Ideia rápida",
      "text": "Reserve 5 minutos para respirar e listar apenas 1 tarefa essencial para hoje."
    }
  ],
  "plannerSuggestions": [
    {
      "id": "planner_1",
      "label": "Adicionar ao Planner",
      "text": "5 minutos de pausa consciente"
    }
  ],
  "meta": {
    "source": "ai",
    "safety": "ok"
  }
}

3.2. /api/ai/emocional

Objetivo
Gerar insights emocionais leves a partir dos registros de humor/energia do mini-hub Como Estou Hoje e apoiar resumos semanais (Weekly Emotional Insight).

Consumidores

/meu-dia/como-estou-hoje

/eu360 (insights consolidados futuros)

Weekly Emotional Insight (já existente)

Request (exemplo)

{
  "userId": "optional",
  "locale": "pt-BR",
  "moodEntries": [
    {
      "date": "2025-03-10",
      "mood": "ansiosa",
      "energy": "baixa"
    }
  ],
  "timeRange": "last_7_days"
}


Response

{
  "version": "p2",
  "type": "emocional",
  "tone": "materna360",
  "title": "Um olhar gentil sobre a sua semana",
  "body": "Percebi que nos últimos dias você tem se sentido mais cansada...",
  "highlights": [
    {
      "label": "Padrão observado",
      "text": "Muitos dias com energia baixa no fim da tarde."
    },
    {
      "label": "Convite",
      "text": "Talvez valha experimentar um pequeno momento de pausa só para você."
    }
  ],
  "actions": [
    {
      "id": "selfcare_break",
      "label": "Ver ideias de autocuidado",
      "target": "/cuidar/meu-bem-estar"
    }
  ],
  "meta": {
    "disclaimer": "Este conteúdo é informativo e não substitui acompanhamento profissional.",
    "safety": "ok"
  }
}

3.3. /api/ai/autocuidado

Objetivo
Gerar sugestões de autocuidado inteligente para o mini-hub Meu Bem-Estar (/cuidar/meu-bem-estar), conectando com o estado emocional e a rotina.

Consumidores

/cuidar/meu-bem-estar

Request

{
  "userId": "optional",
  "locale": "pt-BR",
  "context": {
    "timeAvailableMinutes": 10,
    "energyLevel": "baixa",
    "kidsAgeRange": "0-6",
    "location": "casa"
  }
}


Response

{
  "version": "p2",
  "type": "autocuidado",
  "tone": "materna360",
  "title": "Um cuidado rápido só para você",
  "body": "Mesmo com pouco tempo, você merece um respiro.",
  "items": [
    {
      "id": "selfcare_1",
      "text": "Coloque uma música tranquila, respire fundo por 2 minutos e alongue os ombros."
    }
  ],
  "plannerSuggestions": [
    {
      "id": "planner_selfcare",
      "text": "2 minutos de pausa com música",
      "tag": "autocuidado"
    }
  ],
  "meta": {
    "safety": "ok"
  }
}

3.4. /api/ai/biblioteca

Objetivo
Apoiar o mini-hub Biblioteca Materna (/maternar/biblioteca-materna) com:

recomendações de conteúdos

trilhas temáticas

resumos amigáveis de temas complexos (sempre sem postura médica/dogmática)

Consumidores

/maternar/biblioteca-materna

Request

{
  "userId": "optional",
  "locale": "pt-BR",
  "query": "birras em crianças de 3 anos",
  "filters": {
    "theme": "comportamento",
    "format": ["artigo", "checklist"]
  }
}


Response

{
  "version": "p2",
  "type": "biblioteca",
  "tone": "materna360",
  "title": "Conteúdos para te ajudar com as birras",
  "body": "Separei alguns materiais que podem deixar esse tema mais leve.",
  "resources": [
    {
      "id": "res_1",
      "title": "Por que as birras acontecem?",
      "summary": "Um artigo curto explicando o que está por trás das birras, sem culpas nem rótulos.",
      "url": "/maternar/biblioteca-materna/birras-por-que-acontecem"
    }
  ],
  "meta": {
    "safety": "ok"
  }
}

3.5. /api/ai/planner

Objetivo
Conectar insights e IA com o Planner, sugerindo pequenas ações que podem ser salvas pela usuária (sem criar nada automaticamente).

Consumidores

/meu-dia (Planner)

mini-hubs que enviam sugestões (Rotina Leve, Autocuidado, Como Estou Hoje)

Request

{
  "userId": "optional",
  "locale": "pt-BR",
  "sources": [
    "rotina",
    "emocional",
    "autocuidado"
  ],
  "dayContext": {
    "date": "2025-03-10",
    "weekday": "segunda-feira"
  }
}


Response

{
  "version": "p2",
  "type": "planner",
  "tone": "materna360",
  "title": "Pequenas ideias para o seu dia",
  "body": "Se fizer sentido para você, aqui vão algumas sugestões para hoje.",
  "plannerSuggestions": [
    {
      "id": "ps_1",
      "text": "Separar 5 minutos à noite para registrar um momento bom do dia.",
      "category": "bem-estar"
    }
  ],
  "meta": {
    "safety": "ok"
  }
}

4. Contrato Genérico de IA

Para manter tudo organizado, todos os endpoints devem seguir um contrato base:

4.1. Request base
type BaseAIRequest = {
  userId?: string | null
  locale: 'pt-BR'
  // campo específico por endpoint:
  context?: Record<string, unknown>
}

4.2. Response base
type BaseAIResponse = {
  version: 'p2'
  type: 'rotina' | 'emocional' | 'autocuidado' | 'biblioteca' | 'planner'
  tone: 'materna360'
  title: string
  body: string
  meta?: {
    safety: 'ok' | 'blocked'
    disclaimer?: string
  }
}


Cada endpoint estende esse contrato com campos específicos (items, resources, plannerSuggestions, etc.).

5. Regras de Segurança & Tom de Voz
5.1. Regras negativas (NUNCA fazer)

❌ Diagnosticar TDAH, depressão, ansiedade ou qualquer condição.

❌ Indicar medicamentos, dosagens ou tratamentos.

❌ Pressionar a mãe a “dar conta de tudo”.

❌ Usar frases de culpa ou julgamento.

❌ Prometer resultados garantidos.

5.2. Regras positivas (SEMPRE fazer)

✅ Validar o cansaço e as emoções da mãe.

✅ Reforçar que ela não precisa ser perfeita.

✅ Trazer sugestões simples, realistas e pequenas.

✅ Usar o tom acolhedor Materna360 (leve, empático, prático).

✅ Lembrar que não substitui orientação profissional quando o tema encostar em saúde.

6. Integração com Mini-Hubs & Planner
6.1. Rotina Leve → IA → Planner

Usuária abre Rotina Leve

Front chama /api/ai/rotina com o contexto do dia

Exibe ideias/receitas/inspirações em cards

Ao clicar em “Adicionar ao Planner”:

front grava via usePlannerSavedContents

nenhuma escrita é feita automaticamente pela IA

6.2. Como Estou Hoje → IA Emocional

Usuária preenche humor/energia

Front salva no storage/BD

Front pode chamar /api/ai/emocional:

para gerar insight imediato

ou para montar resumo semanal na aba /eu360 / insight semanal

6.3. Autocuidado & Biblioteca

Autocuidado chama /api/ai/autocuidado com tempo disponível + energia.

Biblioteca chama /api/ai/biblioteca com tema e filtros, não substituindo o conteúdo editorial curado, mas ajudando a priorizar e organizar.

7. Telemetria & Observabilidade (resumo)

Toda chamada de IA deve:

registrar evento em telemetry (ex.: ai_rotina_called, ai_emocional_insight_viewed)

nunca incluir dados sensíveis (sem texto livre de diário completo, por exemplo, apenas resumos/indicadores)

8. Roadmap P2 — Passos Técnicos

Passo 1 — PR de Estrutura (sem lógica de IA)

Criar diretório app/api/ai/*

Criar arquivos vazios com POST retornando JSON estático:

/rotina

/emocional

/autocuidado

/biblioteca

/planner

Garantir que pnpm typecheck, pnpm lint, pnpm build passam.

Passo 2 — Serviços Internos lib/ai/*

Criar contratos de BaseAIRequest e BaseAIResponse

Criar funções stub (sem chamar modelo ainda), retornando mocks.

Passo 3 — Conectar primeiro mini-hub (Rotina Leve)

Usar /api/ai/rotina com dados estáticos/mocks

Validar UX, tom de voz e integração com Planner.

Passo 4 — Expandir para os outros endpoints

Emocional → insights semanais

Autocuidado → sugestões práticas

Biblioteca → recomendações

Planner → sugestões integradas
