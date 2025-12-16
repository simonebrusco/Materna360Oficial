'use client'

import * as React from 'react'
import { useState } from 'react'
import ProfileForm from '@/components/blocks/ProfileForm'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

interface Eu360ProfileCollapsibleProps {
  defaultOpen?: boolean
}

export default function Eu360ProfileCollapsible({
  defaultOpen = false,
}: Eu360ProfileCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Reveal>
      <SoftCard
        className="
          rounded-3xl
          bg-white
          border border-[#F5D7E5]
          shadow-[0_10px_26px_rgba(0,0,0,0.10)]
          px-5 py-5 md:px-7 md:py-7
          space-y-4
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6a6a6a]">
              Seu perfil
            </p>
            <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56] leading-snug">
              Sobre você (sem pressa)
            </h2>
            <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed max-w-xl">
              Isso ajuda o app a ajustar o tom e as sugestões para a sua rotina real.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="
              shrink-0
              inline-flex items-center gap-2
              rounded-full
              border border-[#F5D7E5]
              bg-[#ffe1f1]
              px-3 py-2
              text-[12px]
              font-semibold
              text-[#2f3a56]
              hover:bg-[#ffd8e6]
              transition
            "
          >
            <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={16} decorative />
            <span>{open ? 'Recolher' : 'Preencher agora'}</span>
          </button>
        </div>

        {open ? (
          <div className="pt-3">
            <ProfileForm />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AppIcon name="info" size={18} className="text-[#fd2597]" decorative />
              </div>
              <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                Você pode preencher isso aos poucos. Não é obrigatório agora — mas ajuda o Materna360 a ficar mais do seu jeito.
              </p>
            </div>
          </div>
        )}
      </SoftCard>
    </Reveal>
  )
}
