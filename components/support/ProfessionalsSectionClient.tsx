'use client'

import { useCallback } from 'react'

import ProfessionalsResults from './ProfessionalsResults'
import ProfessionalsSearchForm, { type ProfessionalsSearchFilters } from './ProfessionalsSearchForm'

type ProfessionalsSectionClientProps = {
  initialFilters?: ProfessionalsSearchFilters
}

export default function ProfessionalsSectionClient({ initialFilters }: ProfessionalsSectionClientProps) {
  const handleSearch = useCallback((filters: ProfessionalsSearchFilters) => {
    if (typeof window === 'undefined') {
      return
    }
    window.dispatchEvent(new CustomEvent('pros:search', { detail: filters }))
  }, [])

  return (
    <section className="space-y-6">
      <ProfessionalsSearchForm onSearch={handleSearch} initial={initialFilters} />
      <ProfessionalsResults initial={initialFilters} />
    </section>
  )
}
