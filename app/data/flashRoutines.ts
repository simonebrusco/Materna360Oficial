import type { FlashRoutine } from '@/app/types/flashRoutine'

export const FLASH_ROUTINES_CMS: FlashRoutine[] = [
  {
    id: 'routine-varanda-criativa',
    title: 'Varanda Criativa 15’',
    totalMin: 15,
    steps: [
      { title: 'Respirar olhando o céu', minutes: 4, ideaId: 'idea-respiro-historias' },
      { title: 'Explorar folhas pela varanda', minutes: 6, ideaId: 'idea-missao-folhas' },
      { title: 'Desenhar descoberta preferida', minutes: 5, ideaId: 'idea-exploradores-varanda' },
    ],
    ageBucket: '4-5',
    locale: 'area_externa',
    materials: ['história curta', 'sacola reutilizável', 'bloquinho', 'lápis'],
    safetyNotes: ['Evite folhas desconhecidas.', 'Use protetor solar em horários de sol forte.'],
    active: true,
  },
  {
    id: 'routine-manha-sensorial',
    title: 'Manhã Sensorial 18’',
    totalMin: 18,
    steps: [
      { title: 'Caixa de texturas macias', minutes: 6, ideaId: 'idea-caixa-texturas' },
      { title: 'Dança suave com maraca', minutes: 6, ideaId: 'idea-sussurros-musicais' },
      { title: 'Respirar com história curta', minutes: 6, ideaId: 'idea-respiro-historias' },
    ],
    ageBucket: '2-3',
    locale: 'casa',
    materials: ['caixa pequena', 'tecidos', 'maraca', 'playlist calma', 'história curta'],
    safetyNotes: ['Supervisione contato com pequenos objetos.'],
    active: true,
  },
  {
    id: 'routine-casa-energia',
    title: 'Movimento Feliz 20’',
    totalMin: 20,
    steps: [
      { title: 'Circuito mini equilíbrio', minutes: 7, ideaId: 'idea-circuito-mini' },
      { title: 'Dança energia', minutes: 7, ideaId: 'idea-danca-energia' },
      { title: 'Mapa de tesouros do quarto', minutes: 6, ideaId: 'idea-mapa-tesouros' },
    ],
    ageBucket: '4-5',
    locale: 'casa',
    materials: ['fita adesiva', 'almofadas', 'playlist animada', 'papel', 'caneta'],
    safetyNotes: ['Garanta espaço livre para dançar.'],
    active: true,
  },
]
