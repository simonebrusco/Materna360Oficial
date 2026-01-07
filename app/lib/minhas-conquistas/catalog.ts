import * as React from 'react'
import AppIcon from '@/components/ui/AppIcon'

export type Badge = {
  id: string
  title: string
  // texto curto (cards)
  desc: string
  // texto extra (apenas no “destaque” do marco em construção)
  aux?: string
  icon: React.ComponentProps<typeof AppIcon>['name']
  minPoints: number
}

// Textos ajustados: mais curtos nos cards (2 frases no máximo)
// Direção madura sem “faltam X” e sem progresso visível
export const BADGES: Badge[] = [
  {
    id: 'b-1',
    title: 'Primeiro passo',
    desc: 'Você começou. O que vem depois depende de repetir — mesmo que aos poucos.',
    aux: 'Esse marco ganha força quando o começo deixa de ser exceção. Não é sobre pressa. É sobre continuidade possível.',
    icon: 'star',
    minPoints: 10,
  },
  {
    id: 'b-2',
    title: 'Dia possível',
    desc: 'Você fez o que cabia. Isso sustenta o caminho quando o dia não permite mais.',
    aux: 'Reconhece escolhas feitas mesmo em dias cheios.',
    icon: 'sparkles',
    minPoints: 22,
  },
  {
    id: 'b-3',
    title: 'Presença real',
    desc: 'Presença não é quantidade. Ela se constrói quando você escolhe estar — mesmo em pequenos momentos.',
    aux: 'Esse marco se constrói quando a presença deixa de ser exceção. Pequenos gestos repetidos mudam a experiência.',
    icon: 'heart',
    minPoints: 40,
  },
  {
    id: 'b-4',
    title: 'Rotina mais leve',
    desc: 'Leveza não surge do acaso. Ela vem de decisões conscientes no meio do dia.',
    aux: 'Esse marco aparece quando você ajusta o ritmo com intenção. Menos peso também é uma escolha ativa.',
    icon: 'sun',
    minPoints: 70,
  },
]
