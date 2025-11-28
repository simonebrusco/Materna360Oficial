'use client'

import { useState, KeyboardEvent } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

type Top3Item = {
  id: string
  title: string
  done: boolean
}

type Top3SectionProps = {
  items: Top3Item[]
  onToggle: (id: string) => void
  onAdd: (title: string) => void
  hideTitle?: boolean
}

/**
 * Bloco de "Prioridades do dia"
 * - Mostra até 3 prioridades
 * - Permite adicionar novas
 * - Permite marcar / desmarcar como concluídas
 * - NÃO tem botão "Salvar prioridades no planner"
 */
export default function Top3Section({
  items,
  onToggle,
  onAdd,
  hideTitle,
}: Top3SectionProps) {
  const [inputValue, setInputValue] = useState('')

  function handleAdd() {
    const value = inputValue.trim()
    if (!value || items.length >= 3) return
    onAdd(value)
    setInputValue('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  return (
    <SoftCard className="w-full border border-[var(--color-border-soft)] bg-white/80 shadow-sm">
      {/* Cabeçalho interno (opcional, normalmente escondido porque o título vem de fora) */}
      {!hideTitle && (
        <div className="mb-4">
          <p className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Seu foco de hoje
          </p>
          <h3 className="mt-1 text-base md:text-lg font-semibold text-[var(--color-text-main)] font-poppins">
            Prioridades do dia
          </h3>
          <p className="mt-1 text-xs md:text-sm text-[var(--color-text-muted)]">
            Escolha até três coisas que realmente importam para hoje.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Lista de prioridades */}
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-xs md:text-sm text-[var(--color-text-muted)]/70">
              Comece adicionando sua primeira prioridade do dia.
            </p>
          )}

          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white px-3 py-2.5 text-left hover:border-[var(--color-brand-soft)] transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border-soft)] text-[11px] font-semibold text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <div className="flex-1">
                <p
                  className={`text-xs md:text-sm font-medium text-[var(--color-text-main)] ${
                    item.done ? 'line-through opacity-60' : ''
                  }`}
                >
                  {item.title}
                </p>
              </div>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  item.done
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                    : 'border-[var(--color-border-soft)] text-[var(--color-text-muted)]'
                }`}
              >
                {item.done ? (
                  <AppIcon name="check" className="h-3 w-3" />
                ) : (
                  <AppIcon name="plus" className="h-3 w-3" />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Campo para adicionar nova prioridade */}
        {items.length < 3 && (
          <>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex-1">
                <label className="sr-only" htmlFor="nova-prioridade">
                  Nova prioridade
                </label>
                <input
                  id="nova-prioridade"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Adicionar nova prioridade de hoje…"
                  className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-xs md:text-sm font-semibold font-poppins transition-all border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-brand)] mt-1 md:mt-0"
              >
                <AppIcon name="check" className="h-3 w-3" />
                Salvar prioridade
              </button>
            </div>
            <p className="mt-1 text-[11px] md:text-xs text-[var(--color-text-muted)]/70">
              Você não precisa preencher as três. Às vezes, uma única prioridade já
              muda o dia.
            </p>
          </>
        )}
      </div>
    </SoftCard>
  )
}
