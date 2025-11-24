'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon';

type HubIcon = {
  id: string;
  href: string;
  icon: KnownIconName;
};

type HubCard = {
  id: string;
  title: string;
  tag: string;
  icons: HubIcon[];
};

const HUB_CARDS: HubCard[] = [
  // CARD 1 — VOCÊ POR DENTRO
  {
    id: 'voce-por-dentro',
    title: 'Você por dentro',
    tag: 'VOCÊ',
    icons: [
      {
        id: 'como-estou-hoje',
        href: '/meu-dia/como-estou-hoje?abrir=humor',
        icon: 'smile',
      },
      {
        id: 'energia-emocao',
        href: '/meu-dia/como-estou-hoje?abrir=energia',
        icon: 'time',
      },
      {
        id: 'autocuidado-inteligente',
        href: '/cuidar/autocuidado-inteligente',
        icon: 'heart',
      },
      {
        id: 'pausa-guiada',
        href: '/meu-dia/como-estou-hoje?abrir=pausa',
        icon: 'idea',
      },
    ],
  },

  // CARD 2 — SUA ROTINA LEVE
  {
    id: 'sua-rotina-leve',
    title: 'Sua rotina leve',
    tag: 'ROTINA',
    icons: [
      {
        id: 'planner-dia',
        href: '/meu-dia?abrir=planner',
        icon: 'calendar',
      },
      {
        id: 'rotina-casa',
        href: '/meu-dia/rotina-leve?abrir=casa',
        icon: 'home',
      },
      {
        id: 'rotina-filho',
        href: '/meu-dia/rotina-leve?abrir=filho',
        icon: 'care',
      },
      {
        id: 'rotina-leve',
        href: '/meu-dia/rotina-leve',
        icon: 'play',
      },
    ],
  },

  // CARD 3 — SEU FILHO & VÍNCULO
  {
    id: 'seu-filho-vinculo',
    title: 'Seu filho & vínculo',
    tag: 'SEU FILHO',
    icons: [
      {
        id: 'sinais-do-dia',
        href: '/cuidar/cuidar-com-amor?abrir=sinais',
        icon: 'star',
      },
      {
        id: 'cuidado-por-idade',
        href: '/cuidar/cuidar-com-amor?abrir=idade',
        icon: 'books',
      },
      {
        id: 'cuidados-do-dia',
        href: '/cuidar/cuidar-com-amor?abrir=cuidados',
        icon: 'heart',
      },
      {
        id: 'brincar-aprender',
        href: '/descobrir/aprender-brincando',
        icon: 'idea',
      },
    ],
  },

  // CARD 4 — JORNADA & CONTEÚDOS
  {
    id: 'jornada-conteudos',
    title: 'Jornada & conteúdos',
    tag: 'VOCÊ',
    icons: [
      {
        id: 'minha-jornada',
        href: '/eu360/minha-jornada',
        icon: 'crown',
      },
      {
        id: 'minhas-conquistas',
        href: '/meu-dia/minhas-conquistas',
        icon: 'star',
      },
      {
        id: 'biblioteca-materna',
        href: '/biblioteca-materna',
        icon: 'book-open',
      },
      {
        id: 'favoritos',
        href: '/biblioteca-materna?view=favoritos',
        icon: 'heart',
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
                      <AppIcon
                        name={item.icon}
                        className="w-6 h-6 md:w-7 md:h-7 text-[#E6005F] group-hover:scale-110 transition-transform duration-150"
                        decorative
                      />
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
  );
}
