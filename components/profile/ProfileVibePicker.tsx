'use client'

import * as React from 'react'
import { STICKER_OPTIONS, type ProfileStickerId, getStickerInfo } from '@/app/lib/stickers'

export function ProfileVibePicker(props: {
  value: ProfileStickerId | null
  onChange: (value: ProfileStickerId) => void
}) {
  const { value, onChange } = props

  const selected = getStickerInfo(value)

  return (
    <div className="space-y-4">
      {/* Resumo compacto */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white/70 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-bg-pinksoft)]">
          <selected.Icon className="h-5 w-5 text-[var(--color-plum)]" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-main)]">
            {selected.label}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {selected.subtitle}
          </p>
        </div>
      </div>

      {/* Grid premium */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STICKER_OPTIONS.map((opt) => {
          const isActive = opt.id === value
          const Icon = opt.Icon

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={[
                'text-left rounded-3xl border p-5 transition-all duration-200',
                'bg-white shadow-[0_6px_22px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-[1px]',
                isActive
                  ? 'border-[var(--color-pink)] ring-2 ring-[var(--color-pinksoft)]'
                  : 'border-[var(--color-border-soft)]',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-bg-pinksoft)]">
                  <Icon className="h-5 w-5 text-[var(--color-plum)]" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    {opt.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {opt.subtitle}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
