export type OrgTip = {
  id: string
  icon: string
  title: string
  subtitle: string
  duration: string
  category: 'Tempo & Rotina' | 'Casa fluida' | 'Energia & Pausas' | 'Relações & Rede' | 'Mental Clarity'
  steps: string[]
  testId: string
}

export const ORG_TIPS = [
  {
    id: 'ritual-de-manha-leve',
    icon: '🫖',
    title: 'Ritual de manhã leve',
    subtitle: '3–5 min para começar com carinho',
    duration: '3–5 min',
    category: 'Tempo & Rotina',
    steps: [
      'Prepare uma água ou chá.',
      'Faça 3 respirações profundas.',
      'Defina uma intenção simples para o dia.',
      'Arrume algo por 1 minuto.',
      'Sorria para você.',
    ],
    testId: 'org-tip-ritual-manha',
  },
  {
    id: 'dia-das-micro-tarefas',
    icon: '🗂',
    title: 'Dia das micro-tarefas',
    subtitle: 'Limpe pendências em 10 min',
    duration: '10 min',
    category: 'Tempo & Rotina',
    steps: [
      'Liste 3 tarefas de até 3 min.',
      'Inicie um timer de 10 min.',
      'Faça uma por vez.',
      'Pare quando o timer acabar.',
      'Celebre o avanço.',
    ],
    testId: 'org-tip-micro-tarefas',
  },
  {
    id: 'reuniao-ativa-5-min',
    icon: '🧠',
    title: 'Reunião ativa de 5 min',
    subtitle: 'Organize a cabeça rápido',
    duration: '5 min',
    category: 'Mental Clarity',
    steps: [
      'Descarregue ideias num papel.',
      'Agrupe por tema.',
      'Escolha a próxima ação.',
      'Anote onde e quando fará.',
    ],
    testId: 'org-tip-reuniao-ativa',
  },
  {
    id: 'rede-de-apoio-ativa',
    icon: '✉️',
    title: 'Rede de apoio ativa',
    subtitle: 'Peça ajuda com leveza',
    duration: '2–3 min',
    category: 'Relações & Rede',
    steps: [
      'Pense em 1 pessoa segura.',
      'Escreva um pedido concreto.',
      'Envie agora com carinho.',
    ],
    testId: 'org-tip-rede-apoio',
  },
  {
    id: 'noite-serena',
    icon: '🌙',
    title: 'Noite serena',
    subtitle: 'Descanso antes do sono',
    duration: '15–30 min',
    category: 'Energia & Pausas',
    steps: [
      'Acenda luz suave.',
      'Banho quente ou rosto lavado.',
      'Checklist simples (berço/bolsa).',
      'Alongue ombros/pescoço.',
    ],
    testId: 'org-tip-noite-serena',
  },
  {
    id: 'cesto-salva-sala',
    icon: '🧺',
    title: 'Cesto salva-sala',
    subtitle: 'Casa fluida em 4 min',
    duration: '4 min',
    category: 'Casa fluida',
    steps: [
      'Pegue um cesto.',
      'Recolha itens da sala.',
      'Devolva depois com calma.',
    ],
    testId: 'org-tip-cesto-sala',
  },
  {
    id: 'pomodoro-do-cuidado',
    icon: '⏰',
    title: 'Bloco pomodoro do cuidado',
    subtitle: '15 min pra você',
    duration: '15 min',
    category: 'Energia & Pausas',
    steps: [
      '10 min foco em você.',
      '5 min pausa consciente.',
      'Registre no planner.',
    ],
    testId: 'org-tip-pomodoro-cuidado',
  },
  {
    id: 'estoque-do-basico',
    icon: '📦',
    title: 'Estoque do básico',
    subtitle: 'Zero estresse com faltas',
    duration: '10 min',
    category: 'Casa fluida',
    steps: [
      'Liste “sempre ter”.',
      'Verifique fraldas/lencinhos.',
      'Garanta água/café/frutas.',
    ],
    testId: 'org-tip-estoque-basico',
  },
  {
    id: 'lista-unica-semana',
    icon: '📝',
    title: 'Lista única da semana',
    subtitle: 'Tudo em um lugar',
    duration: '5–10 min',
    category: 'Tempo & Rotina',
    steps: [
      'Crie 3 seções: Casa/Trabalho/Você.',
      '1 ação por seção/dia.',
      'Marque feito ao concluir.',
    ],
    testId: 'org-tip-lista-unica',
  },
  {
    id: 'notas-para-o-futuro-eu',
    icon: '💌',
    title: 'Notas para o futuro eu',
    subtitle: 'Auto-apoio gentil',
    duration: '3 min',
    category: 'Mental Clarity',
    steps: [
      'Escreva 2 frases de carinho.',
      '1 lembrete prático da semana.',
    ],
    testId: 'org-tip-notas-futuro',
  },
  {
    id: 'apps-modo-foco',
    icon: '📱',
    title: 'Apps no modo foco',
    subtitle: 'Menos distração',
    duration: '4 min',
    category: 'Mental Clarity',
    steps: [
      'Crie perfil “Mãe em pausa”.',
      'Silencie 3 apps por padrão.',
    ],
    testId: 'org-tip-apps-foco',
  },
  {
    id: 'kits-de-lanches',
    icon: '🍽',
    title: 'Kits de lanches prontos',
    subtitle: 'Ganho de tempo',
    duration: '8–10 min',
    category: 'Casa fluida',
    steps: [
      'Monte 3 kits: fruta + oleaginosa + água.',
      'Deixe na geladeira/bolsa.',
    ],
    testId: 'org-tip-kits-lanches',
  },
] satisfies OrgTip[]
