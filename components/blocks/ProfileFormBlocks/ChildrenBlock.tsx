'use client'

import React from 'react'
import type { ChildGender, ChildProfile, FormErrors, ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

function makeId() {
  return `child_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function parseChildGender(raw: string): ChildGender {
  if (raw === 'feminino' || raw === 'masculino' || raw === 'nao-informar') return raw
  return 'nao-informar'
}

export function ChildrenBlock({ form, errors, onChange }: Props) {
  // Garantia extra — embora no ProfileFormState filhos seja obrigatório
  const filhos: ChildProfile[] = Array.isArray(form.filhos) ? form.filhos : []

  function addChild() {
    const next: ChildProfile = {
      id: makeId(),
      nome: '',
      genero: 'nao-informar',
      idadeMeses: undefined,
    }
    onChange({ filhos: [...filhos, next] })
  }

  function removeChild(childId: string) {
    onChange({ filhos: filhos.filter((c) => c.id !== childId) })
  }

  function updateChild<K extends keyof ChildProfile>(childId: string, key: K, value: ChildProfile[K]) {
    onChange({
      filhos: filhos.map((c) => (c.id === childId ? { ...c, [key]: value } : c)),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Seu(s) filho(s)</h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Isso ajuda o app a sugerir rotinas e conteúdos mais alinhados à sua realidade.
        </p>
      </div>

      <div className="space-y-5">
        {filhos.map((child, index) => {
          const childError = errors.filhos?.[child.id]

          return (
            <div
              key={child.id}
              className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[var(--color-text-main)]">Filho {index + 1}</p>

                {filhos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    className="text-[11px] font-semibold text-[var(--color-brand)] hover:opacity-80"
                  >
                    Remover
                  </button>
                ) : null}
              </div>

              {/* Nome (opcional) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--color-text-main)]">Nome (opcional)</label>
                <input
                  value={child.nome ?? ''}
                  onChange={(e) => updateChild(child.id, 'nome', e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                />
              </div>

              {/* Gênero */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--color-text-main)]">Gênero</label>
                <select
                  value={child.genero ?? 'nao-informar'}
                  onChange={(e) => updateChild(child.id, 'genero', parseChildGender(e.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
                >
                  <option value="nao-informar">Prefiro não informar</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </div>

              {/* Idade em meses */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--color-text-main)]">
                  Idade em meses (opcional)
                </label>

                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={typeof child.idadeMeses === 'number' ? child.idadeMeses : ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      updateChild(child.id, 'idadeMeses', undefined)
                      return
                    }
                    const n = Number(raw)
                    updateChild(child.id, 'idadeMeses', Number.isFinite(n) ? n : undefined)
                  }}
                  className={[
                    'w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30',
                    childError
                      ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/20'
                      : 'border-[var(--color-border-soft)]',
                  ].join(' ')}
                />

                {childError ? (
                  <p className="text-[11px] text-[var(--color-brand)] font-medium">{childError}</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addChild}
        className="w-full rounded-full border border-[var(--color-brand)] bg-white px-4 py-3 text-[12px] font-semibold text-[var(--color-brand)] shadow-sm hover:bg-[var(--color-soft-bg)] transition"
      >
        Adicionar outro filho
      </button>
    </div>
  )
}
