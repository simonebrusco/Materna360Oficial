# Materna360 — Messaging Guide (pt-BR)

**Tom**: acolhedor, claro, premium. Frases curtas. Sem emoji. Use sujeito oculto quando possível.

---

## Toasts — Regras Gerais

### Padrão por Tipo
- **success** (2–6 palavras): "Item adicionado.", "Ideia salva."
- **info/default** (curto): "Salvo para depois.", "Preferências atualizadas."
- **warning** (conselho): "Verifique sua conexão.", "Tente novamente mais tarde."
- **danger** (erro claro): "Não foi possível salvar.", "Falha ao carregar dados."

### Duração Recomendada
- success: 2500ms
- default: 3000ms
- warning: 4000ms
- danger: 5000ms

---

## Padrões por Feature

### Meu Dia
| Ação | Tipo | Mensagem |
|------|------|----------|
| Adição de tarefa | success | "Item adicionado." |
| Conclusão de tarefa | success | "Tarefa concluída." |
| Lembrete criado | success | "Lembrete criado." |
| Lembrete removido | info | "Lembrete removido." |
| Humor registrado | success | "Humor registrado!" |
| Nota salva | success | "Nota salva." |

### Descobrir
| Ação | Tipo | Mensagem |
|------|------|----------|
| Ideia salva | success | "Ideia salva." |
| Ideia removida de salvos | info | "Removido dos salvos." |
| Filtros redefinidos | info | "Filtros redefinidos." |
| Sugestão gerada | success | "Ideia gerada." |

### Cuidar
| Ação | Tipo | Mensagem |
|------|------|----------|
| Consulta/Vacina adicionada | success | "Registro criado." |
| Edição de registro | info | "Registro atualizado." |
| Erro ao salvar | danger | "Não foi possível salvar." |
| Diário da criança atualizado | success | "Diário atualizado." |
| Atividade recomendada | success | "Atividade adicionada." |

### Eu360
| Ação | Tipo | Mensagem |
|------|------|----------|
| Diário emocional enviado | success | "Registro salvo." |
| Insight indisponível | warning | "Sem dados suficientes." |
| Gratidão registrada | success | "Gratidão registrada." |
| Perfil atualizado | success | "Perfil atualizado." |

### Maternar (Hub)
| Ação | Tipo | Mensagem |
|------|------|----------|
| Atalho acionado | info | "Abrindo seção…" |
| Sem conteúdo disponível | warning | "Nada por aqui ainda." |
| Carregando conteúdo | info | "Aguarde um momento." |

---

## Microcopy — Títulos & Subtítulos

### Títulos de Seção (PageH1/SectionH2)
- "Bem-vinda ao Maternar"
- "Seu dia, no seu ritmo"
- "Cuidar também é um gesto de amor"
- "Descubra o que inspira o desenvolvimento do seu filho"
- "Como você está hoje?"

### Títulos de Cards/Blocos (BlockH3)
- "Destaques do dia"
- "Continue de onde parou"
- "Próximos cuidados"
- "Lembretes"
- "Como você está neste momento?"
- "Diário da criança"
- "Suas conquistas"
- "Humor da semana"

### Subtítulos & Descrições Curtas
- "Registre alimentação, sono e humor em tempo real"
- "Atividades, brincadeiras e ideias pensadas para fortalecer o vínculo"
- "Um espaço para se observar, respirar e celebrar suas pequenas conquistas"
- "Aqui começa o seu centro de equilíbrio"

---

## Erros — Mensagens Claras & Construtivas

| Situação | Mensagem | Tipo |
|----------|----------|------|
| Falha de conexão | "Verifique sua conexão. Tente novamente." | danger |
| Carregamento falhou | "Falha ao carregar dados." | danger |
| Permissão negada | "Você não tem acesso a este conteúdo." | warning |
| Campo obrigatório em branco | "Preencha todos os campos obrigatórios." | warning |
| Quota de plano atingida | "Você atingiu o limite do seu plano." | warning |

---

## Padrões de Call-to-Action (CTAs)

### Primários (Buttons)
- "Acessar →"
- "Continuar"
- "Salvar"
- "Registrar"
- "Confirmar"

### Secundários/Ghost
- "Ver depois"
- "Cancelar"
- "Voltar"
- "Limpar filtros"

### Links de Upgrade
- "Conheça os planos"
- "Ver planos →"
- "Desbloquear recurso"

---

## Guia Rápido de Seleção

### Quando usar cada tipo de toast:

**Success (verde/confirmação)**
- Usuário completou uma ação com sucesso
- Algo foi salvo, criado ou deletado
- Duração: 2500ms

**Default/Info (neutro)**
- Feedback de ação sem confirmação forte
- Status de processo
- Notificação leve
- Duração: 3000ms

**Warning (amarelo/aviso)**
- Possível problema em breve
- Conselho/sugestão
- Conectividade ou performance
- Duração: 4000ms

**Danger (vermelho/erro)**
- Falha clara
- Algo não funcionou
- Ação não pode ser completada
- Duração: 5000ms

---

## Princípios Gerais

1. **Concisão**: Máximo 2 linhas. Se precisar de mais, use um modal.
2. **Ação**: Cada mensagem confirma ou adverte sobre uma ação específica.
3. **Tom**: Quente, profissional, sem jargão técnico.
4. **Sem emojis**: Use ícones Lucide quando necessário (designado no código).
5. **Sujeito oculto**: Preferir "Salvo." em vez de "Seu item foi salvo."
6. **Português claro**: Evitar abrasileirismos excessivos; manter elegância.

---

**Última atualização**: Aplicável a todos os componentes de Toast, Button, Card e microcopy da aplicação.
