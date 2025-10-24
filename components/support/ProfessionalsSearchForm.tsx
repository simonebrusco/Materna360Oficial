'use client'

import { useState } from 'react'

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

  const handleChange = (key: keyof ProfessionalsSearchFilters) => (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    onSearch(DEFAULT_FILTERS)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft md:p-6"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2">Profissão</span>
          <select
            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
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
          <span className="mb-1 text-support-2">Faixa etária</span>
          <select
            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
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
          <span className="mb-1 text-support-2">Idioma</span>
          <select
            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            value={filters.idioma}
            onChange={handleChange('idioma')}
          >
            <option>Português (Brasil)</option>
            <option>Inglês</option>
            <option>Espanhol</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-support-2">Buscar</span>
          <input
            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-support-1 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Nome, tema ou palavra-chave"
            value={filters.termos}
            onChange={handleChange('termos')}
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm font-medium text-support-1 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Limpar filtros
        </button>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Buscar profissionais
        </button>
      </div>

      <p className="text-xs text-support-3/90">
        * Resultados somente em formato <strong>online</strong>.
      </p>
    </form>
  )
}
