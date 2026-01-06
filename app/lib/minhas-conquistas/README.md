# Minhas Conquistas — Guardrails (P34.4)

Este diretório existe para centralizar a lógica e reduzir regressão em `Minhas Conquistas` sem alterar layout.

## Princípio (Governança)

Selos são **símbolos narrativos de reconhecimento**, não performáticos.

- Não criam hábito
- Não medem progresso
- Não geram metas
- Não incentivam uso recorrente
- Não criam comparação
- Não geram urgência

Pergunta gate: **“Isso reconhece sem cobrar?”**

## Fontes de Selos (duas camadas)

### 1) Selos narrativos (Minhas Conquistas)
- Fonte: `catalog.ts`
- Regra: `minPoints` contra `mj_points_total`
- Estados:
  - Bloqueado (silencioso)
  - Em construção (resumo do próximo marco)
  - Reconhecido (sem celebração)

### 2) Selos comportamentais (infra P34.1)
- Fonte: `app/lib/badges.ts` (`computeBadges()`)
- Adaptador: `behaviorBadges.ts`
- Importante:
  - **Só aparecem quando já desbloqueados**
  - Sempre status `Reconhecido`
  - Não possuem progresso, não possuem “faltam X”, não possuem barra

## Arquivos canônicos

- `catalog.ts`  
  Catálogo narrativo (texto/ícone/minPoints). Alterações aqui são conteúdo, não layout.

- `storage.ts`  
  Leitura de storage e helpers de datas (sem side effects).

- `state.ts`  
  Regras de estado e contagem:
  - `computeNarrativeState(totalPoints)`
  - `computeCounts(...)`
  - `statusForBadge(...)`

- `behaviorBadges.ts`  
  Adaptador dos badges do app (`computeBadges`) para o formato do grid existente.

## Guardrails técnicos (não negociar)

- Não introduzir novas rotas, CTAs ou navegação.
- Não conectar com Meu Dia para criar metas/streaks.
- Não criar tracking novo para selos.
- Não alterar grid ou hierarquia de componentes na página.
- Selos comportamentais não podem virar “segunda progressão”.

## Nota sobre contagem no Resumo

O Resumo exibe “Reconhecidas: X de Y” apenas como **informação**, sem meta.

- X = narrativos reconhecidos + comportamentais presentes
- Y = narrativos existentes + comportamentais presentes (no momento)

Isso evita inflar metas e evita “pendência”.
