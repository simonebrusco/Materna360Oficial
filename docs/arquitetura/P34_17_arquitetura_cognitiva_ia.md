Materna360 · ADM-FIRST · ANTI-IMPROVISO

Projeto: Materna360
Fase: 2 — Conteúdo Vivo + IA Guiada
Status: ✅ CONCLUÍDA
Dependências:

P34.ADM.1 — Base Curada e ADM MVP (🔒 baseline congelado)

P34.ADM.2 — Expansão Editorial (🔒 encerrada)

1. OBJETIVO DESTE DOCUMENTO

Este documento define, de forma formal, inequívoca e auditável,
como a IA do Materna360 funciona, pensa e se limita, garantindo que:

a IA nunca volte a ser criadora de conteúdo

o ADM permaneça como fonte única de verdade

qualquer executor futuro consiga entender o sistema sem interpretação

a experiência emocional da mãe seja protegida estruturalmente

📌 Este documento não autoriza criação de código novo.
📌 Ele define modelo mental, contratos e limites.

2. REGRA-MÃE (ABSOLUTA · NÃO NEGOCIÁVEL)

No Materna360:

A IA não é fonte primária de conteúdo

A IA não improvisa

A IA não cria ideias do zero

A IA não resolve lacunas editoriais

O ADM é a fonte única de verdade

A IA pode atuar exclusivamente como camada de:

seleção

adaptação leve de linguagem

ordenação

priorização

⛔ Qualquer violação desta regra caracteriza erro de arquitetura.

3. MODELO COGNITIVO DA IA
“Como a IA pensa no Materna360”

A IA do Materna360 não pensa criativamente.
Ela opera como um motor de decisão editorial assistida, seguindo sempre o mesmo fluxo.

3.1 Fluxo Cognitivo em 4 Etapas

1️⃣ Leitura de contexto
A IA recebe apenas:

estado do hub

contexto mínimo do momento (tempo, foco, idade, data)

lista curada vinda do ADM (IDs + metadados)

➡️ A IA nunca recebe liberdade para imaginar opções fora dessa lista.

2️⃣ Seleção controlada

filtra o pool permitido

respeita avoidIds

respeita exaustão (exhausted)

escolhe 1 a 3 itens, conforme o bloco

➡️ A IA decide entre opções existentes, não cria novas.

3️⃣ Adaptação leve
A IA pode:

ajustar tom

suavizar linguagem

contextualizar para “hoje”

➡️ A IA não altera significado, não cria passos, não expande escopo.

4️⃣ Entrega segura
A IA devolve:

conteúdo selecionado

metadados claros (source, pickedId, exhausted, fallback)

➡️ A resposta nunca é vazia e nunca quebra a UX.

3.2 Frase-âncora

“A IA do Materna360 escolhe bem entre conteúdos existentes.
Ela não inventa.”

4. COMPORTAMENTO QUANDO NÃO HÁ CONTEÚDO ADM

Quando o ADM não possui conteúdo elegível, a IA não cria nada.

4.1 Pool vazio

A IA entra em fallback humano

Não força sugestão

Não cria conteúdo genérico

Exemplo:

“Hoje está tudo bem manter as coisas simples.”

4.2 Pool exaurido (exhausted:true)

A IA não recicla conteúdo

A exaustão é tratada como estado saudável

Exemplo:

“Você já explorou tudo o que tínhamos por aqui hoje. Amanhã surgem novas possibilidades.”

4.3 Contexto insuficiente

A IA aplica defaults seguros

Não bloqueia fluxo

Não pede mais dados

4.4 Erro técnico real

Erro não vaza para a usuária

Mensagem sempre humana e neutra

Logs ficam apenas para observabilidade

5. ANTI-REPETIÇÃO ESTRUTURAL (NÃO HEURÍSTICA)

A repetição não é evitada pela IA.
Ela é evitada pela arquitetura.

5.1 Pilares estruturais

IDs estáveis para todo conteúdo ADM

Pool determinístico filtrado antes da IA

avoidIds explícito

Exaustão declarada (exhausted:true)

Variação apenas por nonce, sem criar conteúdo

5.2 O que NÃO existe (por decisão consciente)

memória heurística da IA

embeddings para evitar repetição

“conteúdo parecido”

reescrita criativa

5.3 Frase-âncora

“No Materna360, a IA não evita repetição.
A arquitetura impede que ela exista.”

6. LIMITE MÁXIMO DE DECISÃO DA IA

A IA nunca decide o que existe.
Ela decide apenas o que usar agora, dentro do conjunto autorizado.

6.1 Hierarquia de decisão

Proibido

criar ideias

criar textos base

criar planos inéditos

alterar significado

Permitido

escolher entre opções existentes

ordenar

adaptar tom

6.2 Frase-âncora

“A IA do Materna360 decide entre opções.
Ela nunca decide opções.”

7. PROTEÇÃO DO ESTADO EMOCIONAL DA MÃE

O cuidado emocional é estrutural, não retórico.

A IA:

não cria obrigação

entrega sempre algo pequeno

permite sair sem custo emocional

usa fallback permissivo

nunca se posiciona como autoridade moral

Frase-âncora

“A IA do Materna360 ajuda sem exigir.”

8. COMPORTAMENTO APÓS DIAS SEM USO

A ausência não é um evento.

a IA não reage ao tempo fora

não menciona ausência

não tenta recuperar engajamento

cada retorno começa do zero

Frase-âncora

“No Materna360, a ausência não deixa marcas.”

9. TABELA-RESUMO POR HUB (MODELO)
Hub	Fonte primária	Autonomia da IA	Fallback
Meu Filho	ADM	Seleção + tom	Humano
Meu Dia Leve	ADM	Seleção + tom	Humano
Cuidar de Mim	IA controlada	Baixa	Limite diário
10. CRITÉRIO DE ENCERRAMENTO DA P34.17

A P34.17 é considerada ENCERRADA porque:

a IA é compreensível

a IA é previsível

o ADM saiu reforçado

não há risco de regressão criativa

qualquer executor consegue seguir sem dúvidas

11. REGRA DE CONTINUIDADE

Qualquer novo conteúdo → P34.ADM.3+

Qualquer ajuste técnico → nova P específica

Nunca reabrir P34.ADM.1 ou P34.ADM.2

📌 STATUS FINAL

P34.17 — Arquitetura Cognitiva da IA:
✅ CONCLUÍDA · DOCUMENTADA · GOVERNÁVEL
