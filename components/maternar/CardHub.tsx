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
        label: 'Planejar o Dia',
      },
    ],
  },

  // 3) AUTOCUIDADO INTELIGENTE — CUIDAR
  {
    id: 'autocuidado-inteligente',
    title: 'Autocuidado Inteligente',
    tag: 'CUIDAR',
    icons: [
      {
        id: 'meu-ritmo',
        href: '/cuidar/autocuidado-inteligente?abrir=ritmo',
        icon: 'time',
        label: 'Meu Ritmo Hoje',
      },
      {
        id: 'mini-rotina',
        href: '/cuidar/autocuidado-inteligente?abrir=rotina',
        icon: 'home',
        label: 'Mini Rotina',
      },
      {
        id: 'pausas-respiracao',
        href: '/cuidar/autocuidado-inteligente?abrir=pausas',
        icon: 'idea',
        label: 'Pausas & Respiração',
      },
      {
        id: 'pra-voce-hoje',
        href: '/cuidar/autocuidado-inteligente?abrir=gestos',
        icon: 'heart',
        label: 'Pra Você Hoje',
      },
    ],
  },

  // 4) CUIDAR COM AMOR — CUIDAR
  {
    id: 'cuidar-com-amor',
    title: 'Cuidar com Amor',
    tag: 'CUIDAR',
    icons: [
      {
        id: 'alimentacao',
        href: '/cuidar/cuidar-com-amor?abrir=alimentacao',
        icon: 'heart',
        label: 'Alimentação',
      },
      {
        id: 'sono-rotina',
        href: '/cuidar/cuidar-com-amor?abrir=sono',
        icon: 'home',
        label: 'Sono & Rotina',
      },
      {
        id: 'conexao-afetuosa',
        href: '/cuidar/cuidar-com-amor?abrir=conexao',
        icon: 'care',
        label: 'Conexão Afetuosa',
      },
      {
        id: 'pequenos-rituais',
        href: '/cuidar/cuidar-com-amor?abrir=rituais',
        icon: 'star',
        label: 'Pequenos Rituais',
      },
    ],
  },

  // 5) MINHAS CONQUISTAS — MATERNAR
  {
    id: 'minhas-conquistas',
    title: 'Minhas Conquistas',
    tag: 'MATERNAR',
    icons: [
      {
        id: 'missoes-dia',
        href: '/maternar/minhas-conquistas?abrir=missoes',
        icon: 'star',
        label: 'Missões do Dia',
      },
      {
        id: 'painel-progresso',
        href: '/maternar/minhas-conquistas?abrir=painel',
        icon: 'calendar',
        label: 'Painel de Progresso',
      },
      {
        id: 'selos-medalhas',
        href: '/maternar/minhas-conquistas?abrir=selos',
        icon: 'crown',
        label: 'Selos & Medalhas',
      },
      {
        id: 'progresso-mensal',
        href: '/maternar/minhas-conquistas?abrir=mensal',
        icon: 'time',
        label: 'Progresso Mensal',
      },
    ],
  },

  // 6) BIBLIOTECA MATERNA — MATERNAR
  {
    id: 'biblioteca-materna',
    title: 'Biblioteca Materna',
    tag: 'MATERNAR',
    icons: [
      {
        id: 'guias-checklists',
        href: '/maternar/biblioteca-materna?filtro=guias',
        icon: 'book-open',
        label: 'Guias & Checklists',
      },
      {
        id: 'pdfs-ebooks',
        href: '/maternar/biblioteca-materna?filtro=ebooks',
        icon: 'books',
        label: 'PDFs & E-books',
      },
      {
        id: 'trilhas-educativas',
        href: '/maternar/biblioteca-materna?filtro=trilhas',
        icon: 'play',
        label: 'Trilhas Educativas',
      },
      {
        id: 'por-idade-tema',
        href: '/maternar/biblioteca-materna?filtro=idade-tema',
        icon: 'idea',
        label: 'Por Idade / Tema',
      },
    ],
  },

  // 7) MATERNA+ — PREMIUM
  {
    id: 'materna-plus',
    title: 'Materna+',
    tag: 'PREMIUM',
    icons: [
      {
        id: 'mentorias',
        href: '/maternar/materna-plus?abrir=profissionais',
        icon: 'crown',
        label: 'Mentorias',
      },
      {
        id: 'maternabox',
        href: '/maternar/materna-plus/maternabox', // LANDING MATERNABOX
        icon: 'star',
        label: 'MaternaBox',
      },
      {
        id: 'comunidade',
        href: '/maternar/materna-plus?abrir=comunidade',
        icon: 'heart',
        label: 'Comunidade',
      },
      {
        id: 'servicos-materna',
        href: '/maternar/materna-plus?abrir=servicos',
        icon: 'care',
        label: 'Serviços Materna',
      },
    ],
  },

  // 8) ATALHOS — FERRAMENTAS
  {
    id: 'atalhos',
    title: 'Ferramentas',
    tag: 'ATALHOS',
    icons: [
      {
        id: 'planos',
        href: '/planos', //  rota de planos correta
        icon: 'calendar',
        label: 'Planos',
      },
      {
        id: 'perfil',
        href: '/eu360?focus=perfil',
        icon: 'user',
        label: 'Perfil',
      },
      {
        id: 'ajuda-suporte',
        href: '/maternar/ferramentas/ajuda-e-parcerias?abrir=ajuda',
        icon: 'idea',
        label: 'Ajuda & Suporte',
      },
      {
        id: 'parcerias',
        href: '/maternar/ferramentas/ajuda-e-parcerias?abrir=parcerias',
        icon: 'star',
        label: 'Parcerias',
      },
    ],
  },
]

export default function CardHub() {
  return (
    <section
      aria-label="Atalhos principais do Maternar"
      className="mt-8 md:mt-10 pb-24 md:pb-28"
    >
      <Reveal>
        {/* 2 colunas no mobile e no desktop */}
        <div className="grid grid-cols-2 gap-4 md:gap-5">
          {HUB_CARDS.map(card => (
            <div
              key={card.id}
              className="flex flex-col items-stretch gap-2 md:gap-3"
            >
              {/* Card translúcido principal */}
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/14 backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.22)] px-3 py-3 md:px-4 md:py-4">
                {/* Glows internos */}
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                  <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                </div>

                {/* Ícones 2x2 */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 md:gap-3">
                  {card.icons.map(item => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                        <AppIcon
                          name={item.icon}
                          className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                          decorative
                        />
                        <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F] group-hover:text-[#E6005F]">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Nome da pasta fora, centralizado */}
              <div className="text-center">
                <span className="block text-[10px] font-semibold tracking-[0.24em] uppercase text-white/75">
                  {card.tag}
                </span>
                <span className="block text-[13px] md:text-[14px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                  {card.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
