import { NextResponse } from 'next/server'

export type SpecialtyId =
  | 'psicologia-infantil'
  | 'psicopedagogia'
  | 'nutricao-materno-infantil'
  | 'sono-infantil'
  | 'parentalidade-familia'

export type ProfessionalRecord = {
  id: string
  name: string
  specialtyId: SpecialtyId
  specialtyLabel: string
  focus: string
  city: string
  shortBio: string
  tags: string[]
  whatsappUrl: string
  photoUrl: string | null
}

const PROFESSIONALS: ProfessionalRecord[] = [
  {
    id: 'prof-1',
    name: 'Dra. Mariana Alves',
    specialtyId: 'psicologia-infantil',
    specialtyLabel: 'Psicóloga infantil · CRP 00/00000',
    focus: 'Regulação emocional, birras e rotina leve em casa.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Psicóloga infantil com mais de 10 anos acolhendo famílias em desafios de comportamento, ansiedade infantil e culpa materna.',
    tags: ['Atendimento online', 'Orientação para pais', 'Primeira infância'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
    photoUrl: null,
  },
  {
    id: 'prof-2',
    name: 'Bruna Ribeiro',
    specialtyId: 'psicopedagogia',
    specialtyLabel: 'Psicopedagoga · Especialista em alfabetização',
    focus: 'Dificuldades escolares, rotina de estudos e apoio às famílias.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Ajuda mães e crianças a construírem um relacionamento mais leve com a escola, tarefas e primeiros anos escolares.',
    tags: ['Rotina de estudos', 'Primeiros anos escolares'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
    photoUrl: null,
  },
  {
    id: 'prof-3',
    name: 'Dr. Felipe Souza',
    specialtyId: 'nutricao-materno-infantil',
    specialtyLabel: 'Nutricionista materno-infantil · CRN 0000',
    focus: 'Alimentação afetiva, seletividade alimentar e rotina de refeições.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Trabalha com foco em vínculo e em refeições possíveis, sem terrorismo nutricional, respeitando o ritmo da família.',
    tags: ['Rotina de refeições', 'Seletividade alimentar'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
    photoUrl: null,
  },
  {
    id: 'prof-4',
    name: 'Ana Paula Mendes',
    specialtyId: 'parentalidade-familia',
    specialtyLabel: 'Mentora em parentalidade consciente',
    focus: 'Culpa materna, divisão de tarefas e acordos familiares.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Ajuda mães a saírem do piloto automático e construírem uma maternidade mais possível, com mais acordos e menos culpa.',
    tags: ['Parentalidade consciente', 'Casal & família'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
    photoUrl: null,
  },
]

export async function GET() {
  return NextResponse.json({ professionals: PROFESSIONALS })
}
