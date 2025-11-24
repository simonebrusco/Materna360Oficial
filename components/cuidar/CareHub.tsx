'use client'

import Link from 'next/link'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'

type CareHubItem = {
  id: string
  title: string
  subtitle: string
  href: string
  icon: KnownIconName
}

const CARE_HUB_ITEMS: CareHubItem[] = [
  {
    id: 'meu-bem-estar',
    title: 'Meu bem-estar',
    subtitle: 'Cuidar de você sem culpa',
    href: '/cuidar?focus=mae',
    icon: 'heart',
  },
  {
    id: 'rotina-descanso',
    title: 'Rotina de descanso',
    subtitle: 'Pausas, sono e energia',
    href: '/cuidar?focus=mae',
    icon: 'moon',
  },
  {
    id: 'cuidar-do-meu-filho',
    title: 'Cuidar do meu filho',
    subtitle: 'Cuidados do dia a dia',
    href: '/cuidar?focus=filho',
    icon: 'sparkles',
  },
  {
    id: 'sono-rotina-filho',
    title: 'Sono & rotina do meu filho',
    subtitle: 'Horários, tranquilidade e apoio',
    href: '/cuidar?focus=filho',
    icon: 'bed',
  },
]

function CareHubCard({ title, subtitle, href, icon }: CareHubItem) {
  return (
    <Link href={href} className="block h-full">
      <div className="flex h-full min-h-[160px] flex-col items-center justify-between rounded-3xl bg-white shadow-soft px-3 py-3 text-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-m360-pink-soft">
            <AppIcon
              name={icon}
              size={20}
              variant="brand"
              decorative
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-m360-text-primary leading-snug">
              {title}
            </p>
            <p className="text-xs text-m360-text-muted leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="mt-2 text-[11px] font-medium text-m360-pink inline-flex items-center gap-1">
          Acessar <span>→</span>
        </span>
      </div>
    </Link>
  )
}

export function CareHub() {
  return (
    <section className="mt-4">
      <div className="mb-2">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-m360-pink uppercase">
          Atalhos
        </p>
        <h2 className="text-base font-semibold text-m360-text-primary">
          Onde você quer focar hoje?
        </h2>
        <p className="text-xs text-m360-text-muted">
          Escolha um atalho para cuidar de você e do seu filho.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {CARE_HUB_ITEMS.map((item) => (
          <CareHubCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  )
}

export default CareHub
