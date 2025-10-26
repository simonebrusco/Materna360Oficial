'use client'

'use client'

import React, { useState, type ChangeEvent, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'

export type ProfessionalsSearchFilters = {
  profissao?: string
  faixaEtaria?: string
  idioma?: string
  termos?: string
}

type ProfessionalsSearchFormProps = {
  onSearch: (filters: ProfessionalsSearchFilters) => void
  initial?: Partial<ProfessionalsSearchFilters>
}

const DEFAULT_FILTERS: ProfessionalsSearchFilters = {
  profissao: 'Todas',
  faixaEtaria: 'Todas',
  idioma: 'Português (Brasil)',
  termos: '',
}

export default function ProfessionalsSearchForm({ onSearch, initial }: ProfessionalsSearchFormProps) {
  const [filters, setFilters] = useState<ProfessionalsSearchFilters>({
    profissao: initial?.profissao ?? DEFAULT_FILTERS.profissao,
    faixaEtaria: initial?.faixaEtaria ?? DEFAULT_FILTERS.faixaEtaria,
    idioma: initial?.idioma ?? DEFAULT_FILTERS.idioma,
    termos: initial?.termos ?? DEFAULT_FILTERS.termos,
  })

  const handleChange = (key: keyof ProfessionalsSearchFilters) => (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_22px_48px_-28px_rgba(47,58,86,0.28)] md:p-6"
    >
      <div className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2/80">Profissão</span>
          <select
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            value={filters.profissao}
            onChange={handleChange('profissao')}
          >
            <option>Todas</option>
            <option>Psicologia</option>
            <option>Fonoaudiologia</option>
            <option>Psico-pedagogia</option>
            <option>Pedagogia parental</option>
            <option>Doula</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2/80">Faixa etária</span>
          <select
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            value={filters.faixaEtaria}
            onChange={handleChange('faixaEtaria')}
          >
            <option>Todas</option>
            <option>0–6 meses</option>
            <option>6–24 meses</option>
            <option>2–5 anos</option>
            <option>6–12 anos</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2/80">Idioma</span>
          <select
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            value={filters.idioma}
            onChange={handleChange('idioma')}
          >
            <option>Português (Brasil)</option>
            <option>Inglês</option>
            <option>Espanhol</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2/80">Buscar</span>
          <input
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Nome, tema ou palavra-chave"
            value={filters.termos}
            onChange={handleChange('termos')}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
          Limpar filtros
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Buscar profissionais
        </Button>
      </div>

      <p className="text-xs text-support-2/70">
        * Resultados somente em formato <strong>online</strong>.
      </p>
    </form>
  )
}
