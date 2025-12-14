'use client'

import React, { useCallback, useMemo } from 'react'
import { FormErrors, ProfileFormState, ChildProfile } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

function uid() {
  return `child_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function normalizeChildren(list: ChildProfile[] | undefined): ChildProfile[] {
  return Array.isArray(list) ? list : []
}

export default function ChildrenBlock({ form, errors, onChange }: Props) {
  const children = useMemo(() => normalizeChildren(form.filhos), [form.filhos])

  const addChild = useCallback(() => {
    const next: ChildProfile[] = [
      ...children,
      {
        id: uid(),
        nome: '',
        genero: '',
        idadeMeses: undefined,
      },
    ]
    onChange({ filhos: next })
  }, [children, onChange])

  const removeChild = useCallback(
    (id: string) => {
      const next = children.filter(c => c.id !== id)
      onChange({ filhos: next })
    },
    [children, onChange],
  )

  const updateChild = useCallback(
    (id: string, patch: Partial<ChildProfile>) => {
      const next = children.map(child => (child.id === id ? { ...child, ...patch } : child))
      onChange({ filhos: next })
    },
    [children, onChange],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Seu(s) filho(s)</h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Isso ajuda o app a sugerir conteúdos e rotinas mais adequados para a fase.
          </p>
        </div>

        <button
          type="button"
          onClick={addChild}
          className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--color-border-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-main)] shadow-sm hover:bg-[var(--color-soft-bg)] transition"
        >
          <span className="h-5 w-5 rounded-full bg-[var(--color-brand)] text-white inline-flex items-center justify-center text-[12px]">
            +
          </span>
          Adicionar
        </button>
      </div>

      {children.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white px-4 py-4">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Você ainda não adicionou nenhum filho. Se quiser, adicione agora — ou pule e volte depois.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child, index) => {
            const childError = errors.filhos?.[child.id]
            return (
              <div key={child.id} className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--color-text-main)]">
                    Filho {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    className="text-[11px] font-semibold text-[var(--color-brand)] hover:opacity-80 transition"
                  >
                    Remover
                  </button>
                </div>

                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-main)]">
                    Nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={child.nome ?? ''}
                    onChange={e => updateChild(child.id, { nome: e.target.value })}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                  />
                </div>

                {/* Gênero */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-main)]">
                    Gênero (opcional)
                  </label>
                  <select
                    value={child.genero ?? ''}
                    onChange={e => updateChild(child.id, { genero: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
                  >
                    <option value="">Selecione…</option>
                    <option value="menina">Menina</option>
                    <option value="menino">Menino</option>
                    <option value="outro">Outro / Prefiro não informar</option>
                  </select>
                </div>

                {/* Idade em meses */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-main)]">
                    Idade (em meses)
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={typeof child.idadeMeses === 'number' ? child.idadeMeses : ''}
                    onChange={e => {
                      const raw = e.target.value
                      const parsed = raw === '' ? undefined : Number(raw)
                      updateChild(child.id, { idadeMeses: Number.isFinite(parsed as number) ? (parsed as number) : undefined })
                    }}
                    className={[
                      'w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30',
                      childError ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/20' : 'border-[var(--color-border-soft)]',
                    ].join(' ')}
                  />
                  {childError ? (
                    <p className="text-[11px] text-[var(--color-brand)] font-medium">{childError}</p>
                  ) : (
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      Se preferir, pode deixar em branco e preencher depois.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
