'use client'

import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'

type HubIcon = {
  id: string
  href: string
  icon: KnownIconName
  label: string
}

type HubCard = {
  id: string
  title: string
  tag: string
  icons: HubIcon[]
}

/**
 * Maternar Hub – 8 mini-hubs organizados em pastas translúcidas
 * Cada card representa um mini-hub e cada tile leva direto
 * para a função certa (rota + ?abrir= quando existir).
 *
 * Importante: mantive as rotas que já estavam funcionando
 * e usei apenas rotas reais já usadas no projeto.
 */
const HUB_CARDS: HubCard[] = [
  // 1) COMO ESTOU HOJE — MEU DIA
  {
    id: 'como-estou-hoje',
    title: 'Como Estou Hoje',
    tag: 'MEU DIA',
    icons: [
      {
        id: 'humor-energia',
        href: '/meu-dia/como-estou-hoje?abrir=humor',
        icon: 'smile',
        label: 'Humor & Energia',
      },
      {
        id: 'notas-do-dia',
        href: '/meu-dia/como-estou-hoje?abrir=notas',
        icon: 'book-open',
        label: 'Notas do Dia',
      },
      {
        id: 'resumo-emocional',
        href: '/meu-dia/como-estou-hoje?abrir=resumo',
        icon: 'idea',
        label: 'Resumo Emocional',
      },
      {
        id: 'semana-emocional',
        href: '/meu-dia/como-estou-hoje?abrir=semana',
        icon: 'time',
        label: 'Semana Emocional',
      },
    ],
  },

  // 2) ROTINA LEVE — MEU DIA
  {
    id: 'rotina-leve',
    title: 'Rotina Leve',
    tag: 'MEU DIA',
    icons: [
      {
        id: 'ideias-rapidas',
        href: '/meu-dia/rotina-leve?abrir=ideias',
        icon: 'idea',
        label: 'Ideias Rápidas',
      },
      {
        id: 'receitas-inteligentes',
        href: '/meu-dia/rotina-leve?abrir=receitas',
        icon: 'heart',
        label: 'Receitas',
      },
      {
        id: 'inspiracoes-do-dia',
        href: '/meu-dia/rotina-leve?abrir=inspiracoes',
        icon: 'star',
        label: 'Inspirações',
      },
      {
        id: 'planner-dia',
        href: '/meu-dia?abrir=planner',
        icon: 'calendar',
        label: 'Planejar
