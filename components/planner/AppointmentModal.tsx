'use client'

import * as React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

export type AppointmentModalMode = 'create' | 'edit'

export type AppointmentModalSubmit = {
  dateKey: string
  time: string
  title: string
}

type Density = 'compact' | 'normal'

type Props = {
  open: boolean
  mode: AppointmentModalMode
  initialDateKey: string
  initialTitle?: string
  initialTime?: string
  onSubmit: (data: AppointmentModalSubmit) => void
  onClose: () => void
  onDelete?: () => void
  density?: Density //  novo (opcional)
}

function formatPtBr(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

export default function AppointmentModal({
  open,
  mode,
  initialDateKey,
  initialTitle,
  initialTime,
  onSubmit,
  onClose,
  onDelete,
  density = 'normal', //  default seguro
}: Props) {
  const [dateKey, setDateKey] = React.useState(initialDateKey)
  const [title, setTitle] = React.useState(initialTitle ?? '')
  const [time, setTime] = React.useState(initialTime ?? '')

  // Density-aware classes (somente spacing/typography)
  const isCompact = density === 'compact'

  const shellPad = isCompact ? 'px-4 pb-5 md:pb-6' : 'px-4 pb-6 md:pb-8'
  const cardRadius = isCompact ? 'rounded-[26px]' : 'rounded-[28px]'
  const headerPad = isCompact ? 'p-4 md:p-5' : 'p-5 md:p-6'
  const bodyPadX = isCompact ? 'px-4 md:px-5' : 'px-5 md:px-6'
  const bodyPadB = isCompact ? 'pb-4 md:pb-5' : 'pb-5 md:pb-6'

  const chipText = isCompact ? 'text-[9px]' : 'text-[10px]'
  const dateHintText = isCompact ? 'text-[10px]' : 'text-[11px]'
  const titleText = isCompact ? 'text-[17px] md:text-[19px]' : 'text-[18px] md:text-[20px]'
  const descText = isCompact ? 'text-[11px] md:text-[12px]' : 'text-[12px] md:text-[13px]'

  const labelText = isCompact ? 'text-[11px]' : 'text-[12px]'
  const helperText = isCompact ? 'text-[10px]' : 'text-[11px]'

  const inputPad = isCompact ? 'px-3.5 py-2.5' : 'px-4 py-3'
  const inputText = isCompact ? 'text-[13px]' : 'text-sm'

  const btnText = isCompact ? 'text-[13px]' : 'text-sm'
  const btnPad = isCompact ? 'px-3.5 py-2' : 'px-4 py-2'
  const primaryBtnPad = isCompact ? 'px-4 py-2' : 'px-5 py-2'

  // Sync when opening / switching records
  React.useEffect(() => {
    if (!open) return
    setDateKey(initialDateKey)
    setTitle(initialTitle ?? '')
    setTime(initialTime ?? '')
  }, [open, initialDateKey, initialTitle, initialTime])

  // ESC to close
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const prettyDate = React.useMemo(() => formatPtBr(dateKey), [dateKey])

  const titleTrim = title.trim()
  const canSave = titleTrim.length >= 2

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />

      {/* Premium glow layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(820px_520px_at_78%_22%,rgba(255,0,94,0.22)_0%,rgba(255,0,94,0.00)_62%)]"
      />

      {/* Sheet */}
      <div className={cx('absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl', shellPad)}>
        <SoftCard
          className={cx(
            cardRadius,
            'border border-white/35 bg-white/92 backdrop-blur-2xl',
            'shadow-[0_24px_70px_rgba(47,58,86,0.18)] overflow-hidden',
          )}
        >
          {/* Header */}
          <div className={cx('relative', headerPad)}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,216,230,0.55),rgba(255,255,255,0.0))]"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/85 border border-white/60 shadow-sm flex items-center justify-center">
                  <AppIcon name="calendar" size={18} className="text-[var(--color-brand)]" />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={cx(
                        'inline-flex rounded-full bg-white/80 border border-[#FFE0F0] px-2.5 py-1 font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]',
                        chipText,
                      )}
                    >
                      {mode === 'create' ? 'Novo compromisso' : 'Editar compromisso'}
                    </span>
                    {prettyDate ? (
                      <span className={cx('text-[var(--color-text-muted)]', dateHintText)}>{prettyDate}</span>
                    ) : null}
                  </div>

                  <h3 className={cx(titleText, 'font-semibold text-[var(--color-text-main)] leading-tight')}>
                    {mode === 'create' ? 'Agende algo importante para você' : 'Ajuste o que precisar com calma'}
                  </h3>

                  <p className={cx(descText, 'text-[var(--color-text-muted)] leading-relaxed max-w-xl')}>
                    Compromissos ficam registrados no seu Planner. Você pode criar com horário ou deixar sem horário.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cx(
                  'shrink-0 rounded-2xl font-medium',
                  btnText,
                  btnPad,
                  'bg-black/5 hover:bg-black/10 transition-colors',
                  'text-[var(--color-text-main)]',
                )}
                aria-label="Fechar"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={cx(bodyPadX, bodyPadB)}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!canSave) return
                onSubmit({
                  dateKey,
                  time,
                  title: titleTrim,
                })
              }}
              className={cx(isCompact ? 'space-y-3.5' : 'space-y-4')}
            >
              {/* Fields */}
              <div className={cx('grid grid-cols-1 md:grid-cols-3', isCompact ? 'gap-2.5' : 'gap-3')}>
                {/* Date */}
                <div className="md:col-span-1">
                  <label className={cx('block font-semibold text-[var(--color-text-main)] mb-1', labelText)}>
                    Data
                  </label>
                  <input
                    type="date"
                    value={dateKey}
                    onChange={(e) => setDateKey(e.target.value)}
                    className={cx(
                      'w-full rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)]/50',
                      inputPad,
                      inputText,
                      'border-[var(--color-soft-strong)]',
                    )}
                  />
                  {prettyDate ? (
                    <div className={cx('mt-1 text-[var(--color-text-muted)]', helperText)}>{prettyDate}</div>
                  ) : null}
                </div>

                {/* Time */}
                <div className="md:col-span-1">
                  <label className={cx('block font-semibold text-[var(--color-text-main)] mb-1', labelText)}>
                    Horário (opcional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={cx(
                      'w-full rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)]/50',
                      inputPad,
                      inputText,
                      'border-[var(--color-soft-strong)]',
                    )}
                  />
                  <div className={cx('mt-1 text-[var(--color-text-muted)]', helperText)}>
                    {time ? 'Com horário definido' : 'Sem horário definido'}
                  </div>
                </div>

                {/* Title */}
                <div className="md:col-span-1">
                  <label className={cx('block font-semibold text-[var(--color-text-main)] mb-1', labelText)}>
                    Título
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: consulta, reunião, escola..."
                    className={cx(
                      'w-full rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)]/50',
                      inputPad,
                      inputText,
                      'border-[var(--color-soft-strong)]',
                    )}
                  />
                  <div className={cx('mt-1 text-[var(--color-text-muted)]', helperText)}>
                    {canSave ? 'Ok' : 'Use pelo menos 2 caracteres'}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className={cx('pt-2 flex flex-col md:flex-row md:items-center md:justify-between', isCompact ? 'gap-2.5' : 'gap-3')}>
                <div>
                  {mode === 'edit' && onDelete ? (
                    <button
                      type="button"
                      onClick={onDelete}
                      className={cx(
                        'inline-flex items-center gap-2 rounded-2xl font-semibold',
                        btnText,
                        btnPad,
                        'bg-white border border-[#ffd8e6] hover:bg-[#fff5f9] transition-colors',
                        'text-[#b4235a]',
                      )}
                    >
                      <AppIcon name="trash" size={16} className="text-[#b4235a]" />
                      Excluir
                    </button>
                  ) : (
                    <div className={cx('text-[var(--color-text-muted)]', helperText)}>
                      Dica: compromissos sem horário também valem — o importante é registrar.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={cx(
                      'rounded-2xl font-semibold',
                      btnText,
                      btnPad,
                      'bg-black/5 hover:bg-black/10 transition-colors',
                      'text-[var(--color-text-main)]',
                    )}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={!canSave}
                    className={cx(
                      'rounded-2xl font-semibold',
                      btnText,
                      primaryBtnPad,
                      'bg-[var(--color-brand)] text-white',
                      'shadow-[0_10px_26px_rgba(255,0,94,0.28)]',
                      'hover:brightness-95 transition',
                      !canSave && 'opacity-55 cursor-not-allowed',
                    )}
                  >
                    {mode === 'create' ? 'Salvar compromisso' : 'Atualizar compromisso'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </SoftCard>
      </div>
    </div>
  )
}
