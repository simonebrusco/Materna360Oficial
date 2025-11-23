export interface OrgTip {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  details: string;
}

export const ORGTIPS_CATALOG: OrgTip[] = [
  {
    id: 'tip-1',
    title: 'Sistema de Cores para a Rotina',
    summary: 'Organize tarefas diárias com cores para cada membro da família.',
    tags: ['Rotina', 'Casa'],
    details: 'Utilize um calendário ou quadro com cores diferentes para cada pessoa da família. Isso ajuda todos a ver rapidamente o que está acontecendo cada dia e reduz a necessidade de avisos constantes.',
  },
  {
    id: 'tip-2',
    title: 'Gaveta de Emergência para Crianças',
    summary: 'Prepare uma caixa com atividades rápidas para momentos difíceis.',
    tags: ['Casa', 'Autocuidado'],
    details: 'Mantenha uma gaveta com atividades simples, adesivos, cores e pequenos brinquedos. Quando uma criança está entediada ou difícil, você tem algo rápido à mão sem estragar sua rotina.',
  },
  {
    id: 'tip-3',
    title: 'Zona de Transição no Retorno da Escola',
    summary: 'Crie um ritual simples para a criança se acalmar ao chegar em casa.',
    tags: ['Rotina', 'Casa', 'Estudos'],
    details: 'Prepare um espaço com almofadas, água e um tempo silencioso. Isto permite que a criança se descomprima antes de começar tarefas de casa ou brincadeiras ativas.',
  },
  {
    id: 'tip-4',
    title: 'Checklist de Malas Reutilizável',
    summary: 'Crie um checklist laminado para idas à escola, praia ou viagens.',
    tags: ['Casa', 'Estudos'],
    details: 'Imprima e lamine uma lista de itens essenciais. Use marcador de quadro branco para marcar cada viagem. Isso reduz stress e garante que você não esquece nada.',
  },
  {
    id: 'tip-5',
    title: 'Estação de Lanche Autossuficiente',
    summary: 'Organize um espaço onde crianças podem pegar lanches sozinhas.',
    tags: ['Rotina', 'Casa', 'Autocuidado'],
    details: 'Coloque copos, pratos pequenos e opções de lanche (frutas, biscoitos) em uma prateleira baixa. Isto desenvolve independência e reduz pedidos constantes.',
  },
  {
    id: 'tip-6',
    title: 'Cronômetro Visual para Crianças',
    summary: 'Use um cronômetro colorido para tornar transições menos traumáticas.',
    tags: ['Rotina', 'Autocuidado'],
    details: 'Um cronômetro visual mostra o tempo passando. Use-o para tarefas como "deixe de brincar em 5 minutos" ou "temos 10 minutos para nos arrumar".',
  },
  {
    id: 'tip-7',
    title: 'Quadro de Responsabilidades por Idade',
    summary: 'Atribua tarefas simples que a criança pode fazer de forma independente.',
    tags: ['Estudos', 'Casa', 'Autocuidado'],
    details: 'Crianças a partir de 2-3 anos podem ajudar (guardar brinquedos, passar roupas). Isto constrói confiança e libera tempo para você.',
  },
  {
    id: 'tip-8',
    title: 'Canto de Autocuidado para Mãe',
    summary: 'Reserve um espaço pequeno mas sagrado para você recarregar.',
    tags: ['Autocuidado'],
    details: 'Um canto com um tapete, vela, journal e chá. Mesmo 5 minutos aqui reduz stress e melhora seu bem-estar durante o dia.',
  },
];
