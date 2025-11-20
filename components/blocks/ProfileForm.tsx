'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

type ProfileFormState = {
  nomeMae: string
  figurinha: string
}

export function ProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileFormState>({
    nomeMae: '',
    figurinha: '',
  })
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/eu360/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok && isMounted) {
          const data = await response.json()
          setForm((previous) => ({
            ...previous,
            nomeMae: data?.name || '',
          }))
        }
      } catch (error) {
        console.warn('Failed to load profile:', error)
      }
    }

    void loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/eu360/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: form.nomeMae,
          birthdate: null,
          age_months: null,
        }),
      })

      if (response.ok) {
        setStatusMessage('Salvo com carinho!')
        router.push('/meu-dia')
        router.refresh()
      } else {
        setStatusMessage('Não foi possível salvar. Tente novamente.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setStatusMessage('Erro ao processar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Reveal>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Seu Perfil</h2>
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-xs font-medium text-gray-800">
              Seu nome
            </label>
            <input
              id="name"
              type="text"
              value={form.nomeMae}
              onChange={(event) => setForm((previous) => ({ ...previous, nomeMae: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-3">
          <Button type="submit" variant="primary" disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar e continuar'}
          </Button>
          {statusMessage && (
            <p className="text-center text-xs font-semibold text-gray-900">{statusMessage}</p>
          )}
        </div>
      </form>
    </Reveal>
  )
}
