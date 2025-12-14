'use client'

import React, { useMemo } from 'react'
import { FormErrors, ProfileFormState, ChildProfile } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

function makeId() {
  // sem depender de crypto.randomUUID (compatível com mais ambientes)
  return `child_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function ChildrenBlock({ form, errors, onChange }: Props) {
  const filhos = useMemo(() => (Array.isArray(form.filhos) ? form.filhos : []), [form.filhos])

  function setFilhos(next: ChildProfile[]) {
    onChange({ filhos: next })
  }

  function addChild() {
    const next: ChildProfile = {
      id: makeId(),
      nome: '',
      genero: '',
      idadeMeses: undefined,
    }
    setFilhos([...filhos, next])
  }

  function removeChild(id: string) {
    setFilhos(filhos.filter(c => c.id !== id))
  }

  function updateChild<K extends keyof ChildProfile>(id: string, key: K, value: ChildProfile[K]) {
    setFilhos(
      filhos.map(c => {
        if (c.id !== id) return c
        return { ...c, [key]: value }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Seu(s) filho(s)</h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Isso ajuda o app a sugerir rotinas e conteúdos compatíveis com a fase.
          </p>
        </div>

        <button
          type="button"
          onClick={addChild}
          className="shrink-0 rounded-full bg-white border border-[#f5d7e5] px-3 py-2 text-[11px] font-semibold text-[#2f3a56] hover:bg-[#fff3f8] transition"
        >
          + Adicionar
        </button>
      </div>

      {filhos.length === 0 ? (
        <div className="rounded-2xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Você pode adicionar agora ou deixar para depois.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filhos.map((child, index) => {
            const childError = errors.filhos?.[child.id]
            return (
              <div
                key={child.id}
                className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#2f3a56]">
                    Filho {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    className="text-[11px] font-semibold text-[#fd2597] hover:opacity-80 transition"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#2f3a56]">Nome (opcional)</label>
                    <input
                      type="text"
                      value={child.nome ?? ''}
                      onChange={e => updateChild(child.id, 'nome', e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-xs text-[#2f3a56] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                    />
                  </div>

                  {/* Gênero */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#2f3a56]">Gênero</label>
                    <select
                      value={child.genero ?? ''}
                      onChange={e => updateChild(child.id, 'genero', e.target.value)}
                      className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-xs text-[#2f3a56] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
                    >
                      <option value="">Selecione…</option>
                      <option value="menina">Menina</option>
                      <option value="menino">Menino</option>
                      <option value="outro">Outro / Prefiro não dizer</option>
                    </select>
                  </div>

                  {/* Idade em meses */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#2f3a56]">Idade (em meses)</label>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={typeof child.idadeMeses === 'number' ? String(child.idadeMeses) : ''}
                      onChange={e => {
                        const raw = e.target.value
                        const num = raw === '' ? undefined : Number(raw)
                        updateChild(child.id, 'idadeMeses', Number.isFinite(num as number) ? (num as number) : undefined)
                      }}
                      placeholder="Ex.: 24"
                      className={[
                        'w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#2f3a56] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30',
                        childError ? 'border-[#fd2597] ring-2 ring-[#fd2597]/20' : 'border-[#f5d7e5]',
                      ].join(' ')}
                      aria-invalid={Boolean(childError)}
                    />
                    {childError ? (
                      <p className="text-[11px] text-[#fd2597] font-medium">{childError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
