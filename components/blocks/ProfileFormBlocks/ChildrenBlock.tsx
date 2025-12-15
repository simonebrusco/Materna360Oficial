'use client'

import React, { useMemo, useState } from 'react'
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

function formatAgeInMonths(age?: number) {
  if (typeof age !== 'number' || !Number.isFinite(age) || age < 0) return null
  if (age === 0) return 'Recém-nascido'
  if (age < 12) return `${age} mês${age === 1 ? '' : 'es'}`
  const years = Math.floor(age / 12)
  const months = age % 12
  if (months === 0) return `${years} ano${years === 1 ? '' : 's'}`
  return `${years}a ${months}m`
}

function ChildSummary({ child, index }: { child: ChildProfile; index: number }) {
  const name = (child.nome ?? '').trim()
  const ageLabel = formatAgeInMonths(child.idadeMeses)
  const gender =
    child.genero === 'feminino' ? 'Feminino' : child.genero === 'masculino' ? 'Masculino' : '—'

  const line = [name ? name : `Filho ${index + 1}`, ageLabel ? ageLabel : null, gender !== '—' ? gender : null]
    .filter(Boolean)
    .join(' • ')

  return <span className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">{line || `Filho ${index + 1}`}</span>
}

export function ChildrenBlock({ form, errors, onChange }: Props) {
  const filhos: ChildProfile[] = Array.isArray(form.filhos) ? form.filhos : []

  // controla expansão por filho (compacto por padrão quando há mais de 1)
  const [openById, setOpenById] = useState<Record<string, boolean>>({})

  const anyChildHasError = useMemo(() => {
    const map = errors.filhos ?? {}
    return Object.keys(map).some((id) => Boolean(map[id]))
  }, [errors.filhos])

  function setOpen(childId: string, next: boolean) {
    setOpenById((prev) => ({ ...prev, [childId]: next }))
  }

  function addChild() {
    const next: ChildProfile = {
      id: makeId(),
      nome: '',
      genero: 'nao-informar',
      idadeMeses: undefined,
    }
    onChange({ filhos: [...filhos, next] })
    setOpen(next.id, true)
  }

  function removeChild(childId: string) {
    onChange({ filhos: filhos.filter((c) => c.id !== childId) })
    setOpenById((prev) => {
      const clone = { ...prev }
      delete clone[childId]
      return clone
    })
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

      {/* resumo leve */}
      <div
        className={[
          'rounded-2xl border bg-[#fff7fb] px-3 py-3 flex items-center justify-between gap-3',
          anyChildHasError ? 'border-[var(--color-brand)]/35' : 'border-[var(--color-border-soft)]',
        ].join(' ')}
      >
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[var(--color-text-main)]">
            {filhos.length} {filhos.length === 1 ? 'criança' : 'crianças'} cadastrada{filhos.length === 1 ? '' : 's'}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Você pode preencher aos poucos. O nome e a idade são opcionais.
          </p>
        </div>

        <button
          type="button"
          onClick={addChild}
          className="shrink-0 rounded-full bg-white border border-[var(--color-border-soft)] px-3 py-2 text-[11px] font-semibold text-[var(--color-brand)] hover:bg-[var(--color-soft-bg)] transition"
        >
          + Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {filhos.map((child, index) => {
          const childError = errors.filhos?.[child.id]
          const isOpen =
            openById[child.id] ??
            // padrão: se tiver 1 filho abre; se tiver mais de 1 fica fechado (exceto se houver erro)
            (filhos.length === 1 || Boolean(childError))

          return (
            <div
              key={child.id}
              className={[
                'rounded-2xl border bg-white',
                childError ? 'border-[var(--color-brand)]/35' : 'border-[var(--color-border-soft)]',
              ].join(' ')}
            >
              {/* header compacto */}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text-main)]">
                    Filho {index + 1}
                  </p>
                  <ChildSummary child={child} index={index} />
                </div>

                <div className="flex items-center gap-3">
                  {filhos.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="text-[11px] font-semibold text-[var(--color-brand)] hover:opacity-80"
                    >
                      Remover
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpen(child.id, !isOpen)}
                    className="rounded-full bg-white border border-[var(--color-border-soft)] px-3 py-2 text-[11px] font-semibold text-[#2f3a56] hover:bg-[#fff7fb] transition"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'Ocultar' : 'Editar'}
                  </button>
                </div>
              </div>

              {/* body (expandível) */}
              {isOpen ? (
                <div className="px-4 pb-4 space-y-3">
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
              ) : null}
            </div>
          )
        })}
      </div>

      {/* botão secundário (mantém, mas menos pesado) */}
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
