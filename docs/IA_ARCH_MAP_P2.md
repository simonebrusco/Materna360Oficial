**Fase 2 — IA Inteligente & Personalização (Fev–Abr/2025)**

## 1. Visão Geral

A Fase 2 tem como objetivo construir uma camada de IA centralizada, segura e consistente, conectando os mini-hubs e o Planner sem alterar o layout premium nem a arquitetura base.

Nesta fase, toda IA do Materna360 deve:

- Passar por rotas centralizadas em `/api/ai/*`
- Respeitar o Tom de Voz Materna360
- Evitar diagnósticos, linguagem médica ou prescrições
- Entregar respostas curtas, acolhedoras e acionáveis
- Integrar-se, quando fizer sentido, ao Planner e/ou insights emocionais

Este documento define:

- A arquitetura de IA (endpoints e contratos)
- O mapa de mini-hubs → IA
- As regras de segurança e tom de voz
- Como a IA conversa com o Planner e com os insights.

---

## 2. Princípios da Camada de IA

1. **Centralização**
   - Nenhum componente de UI conversa diretamente com provedores de IA.
   - Toda chamada passa por `/api/ai/*` + serviços dedicados em `lib/ai/*`.

2. **Isolamento de Layout**
   - Os endpoints de IA não alteram layout, rotas ou Design System.
   - Apenas devolvem dados; a UI continua seguindo o padrão Materna360 Premium.

3. **Gentileza Antes de Inteligência**
   - A IA nunca “manda”, sempre sugere.
   - Linguagem sem culpa, sem julgamento e sem “receitas mágicas”.

4. **Segurança & Limites**
   - Sem diagnósticos médicos, psicológicos ou psiquiátricos.
   - Sem recomendação de medicamento, dosagem ou tratamento.
   - Sempre com reforço de que não substitui profissionais.

5. **Conexão com o Planner**
   - Quando fizer sentido, a IA pode sugerir pequenas tarefas, lembretes de autocuidado ou registros no Planner.
   - Quem decide registrar é sempre a mãe (ação explícita na UI).

---

## 3. Mapa de Endpoints `/api/ai/*`

Endpoints principais da Fase 2:

1. `/api/ai/rotina`  
2. `/api/ai/emocional`  
3. `/api/ai/autocuidado`  
4. `/api/ai/biblioteca`  
5. `/api/ai/planner`  

Cada endpoint vai seguir o mesmo contrato base e especializações leves por tipo.

### 3.1. `/api/ai/rotina`

**Objetivo**  
Gerar ideias rápidas, receitas inteligentes e inspirações para o mini-hub **Rotina Leve**, com foco em praticidade e leveza no dia a dia.

**Consumidores**
- `/meu-dia/rotina-leve`
  - Ideias Rápidas
  - Receitas Inteligentes
  - Inspirações do Dia

**Request (exemplo)**

```json
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

json
Copiar código
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
