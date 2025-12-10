import { NextResponse } from 'next/server'

type ProfessionalRecord = {
  id: string
  nome: string
  especialidade: string
  foto: string | null
  bio: string
  cidade: string
  tags: string[]
  whatsapp: string
}

const PROFESSIONALS: ProfessionalRecord[] = [
  {
    id: 'prof-1',
    nome: 'Dra. Mariana Alves',
    especialidade: 'Psicóloga infantil · CRP 00/00000',
    foto: null,
    bio: 'Psicóloga infantil com mais de 10 anos acolhendo famílias em desafios de comportamento, ansiedade infantil e culpa materna.',
    cidade: 'Atendimento online · Brasil',
    tags: ['Atendimento online', 'Orientação para pais', 'Primeira infância'],
    whatsapp: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-2',
    nome: 'Bruna Ribeiro',
    especialidade: 'Psicopedagoga · Especialista em alfabetização',
    foto: null,
    bio: 'Ajuda mães e crianças a construírem um relacionamento mais leve com a escola, tarefas e primeiros anos escolares.',
    cidade: 'Atendimento online · Brasil',
    tags: ['Rotina de estudos', 'Primeiros anos escolares'],
    whatsapp: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-3',
    nome: 'Dr. Felipe Souza',
    especialidade: 'Nutricionista materno-infantil · CRN 0000',
    foto: null,
    bio: 'Trabalha com foco em vínculo e em refeições possíveis, sem terrorismo nutricional, respeitando o ritmo da família.',
    cidade: 'Atendimento online · Brasil',
    tags: ['Rotina de refeições', 'Seletividade alimentar'],
    whatsapp: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-4',
    nome: 'Ana Paula Mendes',
    especialidade: 'Mentora em parentalidade consciente',
    foto: null,
    bio: 'Ajuda mães a saírem do piloto automático e construírem uma maternidade mais possível, com mais acordos e menos culpa.',
    cidade: 'Atendimento online · Brasil',
    tags: ['Parentalidade consciente', 'Casal & família'],
    whatsapp: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
]

export async function GET() {
  return NextResponse.json({ professionals: PROFESSIONALS })
}
