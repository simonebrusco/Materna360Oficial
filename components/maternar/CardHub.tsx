'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon';

type HubIcon = {
  id: string;
  href: string;
  icon: KnownIconName;
  label: string;
};

type HubCard = {
  id: string;
  title: string;
  tag: string;
  icons: HubIcon[];
};

const HUB_CARDS: HubCard[] = [
  // 1 — COMO ESTOU HOJE
  {
    id: 'como-estou-hoje',
    title: 'Como estou hoje',
    tag: 'MEU DIA',
    icons: [
      {
        id: 'humor-energia',
        href: '/meu-dia/como-estou-hoje?abrir=humor',
        icon: 'smile',
        label: 'Humor & energia',
      },
      {
        id: 'notas-do-dia',
        href: '/meu-dia/como-estou-hoje?abrir=notas',
        icon: 'book-open',
        label: 'Notas do dia',
      },
      {
        id: 'resumo-emocional',
        href: '/meu-dia/como-estou-hoje?abrir=resumo',
        icon: 'books',
        label: 'Resumo emocional',
      },
      {
        id: 'semana-emocional',
        href: '/meu-dia/como-estou-hoje?abrir=semana',
        icon: 'calendar',
        label: 'Semana emocional',
      },
    ],
  },

  // 2 — ROTINA LEVE
  {
    id: 'rotina-leve',
    title: 'Rotina leve',
    tag: 'MEU DIA',
    icons: [
      {
        id: 'ideias-rapidas',
        href: '/meu-dia/rotina-leve?abrir=ideias',
        icon: 'idea',
        label: 'Ideias rápidas',
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
        id: 'planejar-amanha',
        href: '/meu-dia/rotina-leve?abrir=amanha',
        icon: 'time',
        label: 'Planejar amanhã',
      },
    ],
  },

  // 3 — AUTOCUIDADO INTELIGENTE
  {
    id: 'autocuidado-inteligente',
    title: 'Autocuidado inteligente',
    tag: 'CUIDAR',
    icons: [
      {
        id: 'meu-ritmo-hoje',
        href: '/cuidar/autocuidado-inteligente?abrir=ritmo',
        icon: 'time',
        label: 'Meu ritmo hoje',
      },
      {
        id: 'mini-rotina-cuidado',
        href: '/cuidar/autocuidado-inteligente?abrir=rotina',
        icon: 'play',
        label: 'Mini rotina',
      },
      {
        id: 'pausas-guiadas',
        href: '/cuidar/autocuidado-inteligente?abrir=pausas',
        icon: 'care',
        label: 'Pausas & respiração',
      },
      {
        id: 'para-voce-hoje',
        href: '/cuidar/autocuidado-inteligente?abrir=gestos',
        icon: 'heart',
        label: 'Pra você hoje',
      },
    ],
  },

  // 4 — CUIDAR COM AMOR
  {
    id: 'cuidar-com-amor',
    title: 'Cuidar com amor',
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
        icon: 'time',
        label: 'Sono & rotina',
      },
      {
        id: 'conexao-afetuosa',
        href: '/cuidar/cuidar-com-amor?abrir=conexao',
        icon: 'care',
        label: 'Conexão afetuosa',
      },
      {
        id: 'pequenos-rituais',
        href: '/cuidar/cuidar-com-amor?abrir=rituais',
        icon: 'star',
        label: 'Pequenos rituais',
      },
    ],
  },

  // 5 — MINHAS CONQUISTAS
  {
    id: 'minhas-conquistas',
    title: 'Minhas conquistas',
    tag: 'MATERNAR',
    icons: [
      {
        id: 'missoes-do-dia',
        href: '/maternar/minhas-conquistas?abrir=missoes',
        icon: 'play',
        label: 'Missões do dia',
      },
      {
        id: 'painel-progresso',
        href: '/maternar/minhas-conquistas?abrir=painel',
        icon: 'calendar',
        label: 'Painel de progresso',
      },
      {
        id: 'selos-medalhas',
        href: '/maternar/minhas-conquistas?abrir=selos',
        icon: 'star',
        label: 'Selos & medalhas',
      },
      {
        id: 'progresso-mensal',
        href: '/maternar/minhas-conquistas?abrir=mensal',
        icon: 'books',
        label: 'Progresso mensal',
      },
    ],
  },

  // 6 — BIBLIOTECA MATERNA
  {
    id: 'biblioteca-materna',
    title: 'Biblioteca materna',
    tag: 'MATERNAR',
    icons: [
      {
        id: 'guias-checklists',
        href: '/maternar/biblioteca-materna?view=guias',
        icon: 'book-open',
        label: 'Guias & checklists',
      },
      {
        id: 'pdfs-ebooks',
        href: '/maternar/biblioteca-materna?view=pdfs',
        icon: 'books',
        label: 'PDFs & e-books',
      },
      {
        id: 'trilhas-educativas',
        href: '/maternar/biblioteca-materna?view=trilhas',
        icon: 'play',
        label: 'Trilhas educativas',
      },
      {
        id: 'por-idade-tema',
        href: '/maternar/biblioteca-materna?view=idade',
        icon: 'care',
        label: 'Por idade / tema',
      },
    ],
  },

  // 7 — MATERNA+
  {
    id: 'materna-plus',
    title: 'Materna+',
    tag: 'PREMIUM',
    icons: [
      {
        id: 'mentorias',
        href: '/maternar/biblioteca-materna?view=mentorias',
        icon: 'crown',
        label: 'Mentorias',
      },
      {
        id: 'aulas-ao-vivo',
        href: '/maternar/biblioteca-materna?view=aulas',
        icon: 'star',
        label: 'Aulas & encontros',
      },
      {
        id: 'comunidade',
        href: '/maternar/biblioteca-materna?view=comunidade',
        icon: 'heart',
        label: 'Comunidade',
      },
      {
        id: 'servicos',
        href: '/maternar/biblioteca-materna?view=servicos',
        icon: 'calendar',
        label: 'Serviços Materna+',
      },
    ],
  },

  // 8 — FERRAMENTAS
  {
    id: 'ferramentas',
    title: 'Ferramentas',
    tag: 'ATALHOS',
    icons: [
      {
        id: 'planner',
        href: '/meu-dia?abrir=planner',
        icon: 'calendar',
        label: 'Planner',
      },
      {
        id: 'perfil',
        href: '/eu360?focus=perfil',
        icon: 'user',
        label: 'Perfil',
      },
      {
        id: 'ajuda',
        href: '/maternar/biblioteca-materna?view=ajuda',
        icon: 'idea',
        label: 'Ajuda & suporte',
      },
      {
        id: 'preferencias',
        href: '/eu360?focus=preferencias',
        icon: 'heart',
        label: 'Preferências',
      },
    ],
  },
];

export default function CardHub() {
  return (
    <section
      aria-label="Atalhos principais do Maternar"
      className="mt-8 md:mt-10 pb-24 md:pb-28"
    >
      <Reveal>
        {/* 2 colunas no mobile e desktop */}
        <div className="grid grid-cols-2 gap-4 md:gap-5">
          {HUB_CARDS.map((card) => (
            <div
              key={card.id}
              className="flex flex-col items-stretch gap-2 md:gap-3"
            >
              {/* Card translúcido principal */}
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/16 backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.22)] px-3 py-3 md:px-4 md:py-4">
                {/* Glows internos */}
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                  <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                </div>

                {/* Ícones 2x2 */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 md:gap-3">
                  {card.icons.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.18)] active:translate-y-0 active:shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                        <AppIcon
                          name={item.icon}
                          className="w-6 h-6 md:w-7 md:h-7 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                          decorative
                        />
                        <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#545454]">
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
          )
