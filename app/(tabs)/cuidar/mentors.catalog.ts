export interface Mentor {
  id: string;
  name: string;
  specialty: string;
  avatarUrl?: string;
  bullets: string[];
}

export const MENTORS_CATALOG: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Dra. Carolina',
    specialty: 'Pediatria & Desenvolvimento',
    bullets: ['10+ anos de experiência', 'Consultas em português'],
  },
  {
    id: 'mentor-2',
    name: 'Psicóloga Ana',
    specialty: 'Saúde Mental & Maternidade',
    bullets: ['Mãe de 2', 'Especialista em pós-parto'],
  },
  {
    id: 'mentor-3',
    name: 'Coach Bruna',
    specialty: 'Organização & Rotina',
    bullets: ['Criadora de 4 filhos', 'Especialista em produtividade familiar'],
  },
  {
    id: 'mentor-4',
    name: 'Nutricionista Mariana',
    specialty: 'Nutrição Infantil',
    bullets: ['Alimentação complementar', 'Alergias e intolerâncias'],
  },
  {
    id: 'mentor-5',
    name: 'Terapeuta Sofia',
    specialty: 'Bem-estar & Yoga',
    bullets: ['Yoga para mães', 'Meditação guiada'],
  },
];
