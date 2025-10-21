'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'

const STICKERS = [
  {
    id: 'mae-carinhosa',
    name: 'Caring Mom',
    description: 'Love in small gestures.',
    emoji: '💞',
  },
  {
    id: 'mae-leve',
    name: 'Light Mom',
    description: 'Balance and presence.',
    emoji: '☁️',
  },
  {
    id: 'mae-determinada',
    name: 'Determined Mom',
    description: 'Strength with sweetness.',
    emoji: '🌱',
  },
  {
    id: 'mae-criativa',
    name: 'Creative Mom',
    description: 'Turns everything into magic.',
    emoji: '🎨',
  },
  {
    id: 'mae-tranquila',
    name: 'Calm Mom',
    description: 'Serenity and self-care.',
    emoji: '🌙',
  },
] as const

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

type StickerId = (typeof STICKERS)[number]['id']

type ChildProfile = {
  id: string
  genero: 'menino' | 'menina'
  idadeMeses: number
  nome: string
}

type ProfileFormState = {
  nomeMae: string
  filhos: ChildProfile[]
  figurinha: StickerId | ''
}

type FormErrors = {
  nomeMae?: string
  filhos?: Record<string, string | undefined>
  figurinha?: string
  general?: string
}

const createEmptyChild = (): ChildProfile => ({
  id: createId(),
  genero: 'menino',
  idadeMeses: 0,
  nome: '',
})

const defaultState = (): ProfileFormState => ({
  nomeMae: '',
  filhos: [createEmptyChild()],
  figurinha: '',
})

export function ProfileForm() {
  const [form, setForm] = useState<ProfileFormState>(() => defaultState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [statusMessage, setStatusMessage] = useState('')

  const stickerDescriptions = useMemo(
    () =>
      STICKERS.reduce<Record<StickerId, string>>((acc, sticker) => {
        acc[sticker.id] = sticker.description
        return acc
      }, {} as Record<StickerId, string>),
    []
  )

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()

        if (!isMounted) {
          return
        }

        const normalizedChildren = Array.isArray(data?.filhos) && data.filhos.length > 0 ? data.filhos : [createEmptyChild()]

        setForm({
          nomeMae: typeof data?.nomeMae === 'string' ? data.nomeMae : '',
          filhos: normalizedChildren.map((child: any) => ({
            id: typeof child?.id === 'string' && child.id.trim() ? child.id : createEmptyChild().id,
            genero: child?.genero === 'menina' ? 'menina' : 'menino',
            idadeMeses: Number.isFinite(Number(child?.idadeMeses)) && Number(child?.idadeMeses) >= 0 ? Number(child.idadeMeses) : 0,
            nome: typeof child?.nome === 'string' ? child.nome : '',
          })),
          figurinha: STICKERS.some((sticker) => sticker.id === data?.figurinha) ? data.figurinha : '',
        })
      } catch (error) {
        console.error(error)
        setForm(defaultState())
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const updateChild = (id: string, key: keyof ChildProfile, value: string | number) => {
    setForm((previous) => ({
      ...previous,
      filhos: previous.filhos.map((child) => {
        if (child.id !== id) {
          return child
        }

        if (key === 'idadeMeses') {
          const parsed = Math.max(0, Number(value))
          return { ...child, idadeMeses: Number.isFinite(parsed) ? parsed : 0 }
        }

        if (key === 'genero') {
          return { ...child, genero: value === 'menina' ? 'menina' : 'menino' }
        }

        return { ...child, [key]: typeof value === 'string' ? value : child[key] }
      }),
    }))
  }

  const addChild = () => {
    setForm((previous) => ({
      ...previous,
      filhos: [...previous.filhos, createEmptyChild()],
    }))
  }

  const removeChild = (id: string) => {
    setForm((previous) => ({
      ...previous,
      filhos: previous.filhos.length > 1 ? previous.filhos.filter((child) => child.id !== id) : previous.filhos,
    }))
  }

  const validateForm = (state: ProfileFormState) => {
    const nextErrors: FormErrors = {}

    if (!state.nomeMae.trim()) {
      nextErrors.nomeMae = 'Please enter your name.'
    }

    if (!state.filhos.length) {
      nextErrors.general = 'Please add at least one child.'
    }

    const childErrors: Record<string, string> = {}

    state.filhos.forEach((child) => {
      if (child.idadeMeses < 0) {
        childErrors[child.id] = 'Age must be 0 or greater.'
      }
    })

    if (Object.keys(childErrors).length > 0) {
      nextErrors.filhos = childErrors
    }

    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage('')

    const trimmedState: ProfileFormState = {
      ...form,
      nomeMae: form.nomeMae.trim(),
      filhos: form.filhos.map((child) => ({
        ...child,
        nome: child.nome.trim(),
      })),
    }

    const validationErrors = validateForm(trimmedState)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(trimmedState),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      const data = await response.json()

      setForm({
        nomeMae: data.nomeMae,
        filhos: data.filhos,
        figurinha: data.figurinha,
      })

      setErrors({})
      setStatusMessage('Saved successfully!')
    } catch (error) {
      console.error(error)
      setStatusMessage('Unable to save right now. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClasses = 'w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft transition-all duration-300 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <Reveal>
      <Card className="p-7">
        <form className="space-y-7" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              onboarding
            </p>
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">
              Before we start, tell us a little about you
            </h2>
            <p className="text-sm text-support-2 md:text-base">
              This helps personalize your experience and make your daily journey easier.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-12 w-full animate-pulse rounded-2xl bg-white/40" />
              <div className="h-36 w-full animate-pulse rounded-2xl bg-white/40" />
              <div className="h-28 w-full animate-pulse rounded-2xl bg-white/40" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="mother-name" className="text-sm font-semibold text-support-1">
                  Mother’s name
                </label>
                <input
                  id="mother-name"
                  name="nomeMae"
                  type="text"
                  required
                  value={form.nomeMae}
                  onChange={(event) => setForm((previous) => ({ ...previous, nomeMae: event.target.value }))}
                  className={`${inputClasses} ${errors.nomeMae ? 'border-primary/80 ring-2 ring-primary/40' : ''}`}
                  aria-invalid={Boolean(errors.nomeMae)}
                  aria-describedby={errors.nomeMae ? 'mother-name-error' : undefined}
                />
                {errors.nomeMae && (
                  <p id="mother-name-error" className="text-xs font-medium text-primary">
                    {errors.nomeMae}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-support-1">Children</h3>
                    <p className="text-xs text-support-2">
                      Add each child to tailor activities and tips.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    ＋ Add another child
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.filhos.map((child, index) => (
                    <div key={child.id} className="rounded-2xl border border-white/50 bg-white/75 p-4 shadow-soft">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-support-1">Child {index + 1}</h4>
                        {form.filhos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(child.id)}
                            className="text-xs font-semibold text-primary transition hover:text-primary/80"
                          >
                            Remove child
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label htmlFor={`child-gender-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Gender
                          </label>
                          <select
                            id={`child-gender-${child.id}`}
                            value={child.genero}
                            onChange={(event) => updateChild(child.id, 'genero', event.target.value)}
                            className={`${inputClasses} appearance-none`}
                          >
                            <option value="menino">Boy</option>
                            <option value="menina">Girl</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`child-age-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Age (months)
                          </label>
                          <input
                            id={`child-age-${child.id}`}
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={child.idadeMeses}
                            onChange={(event) => updateChild(child.id, 'idadeMeses', event.target.value)}
                            className={`${inputClasses} ${errors.filhos?.[child.id] ? 'border-primary/80 ring-2 ring-primary/40' : ''}`}
                            aria-invalid={Boolean(errors.filhos?.[child.id])}
                            aria-describedby={errors.filhos?.[child.id] ? `child-age-error-${child.id}` : undefined}
                          />
                          {errors.filhos?.[child.id] && (
                            <p id={`child-age-error-${child.id}`} className="text-xs font-medium text-primary">
                              {errors.filhos[child.id]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`child-name-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Name (optional)
                          </label>
                          <input
                            id={`child-name-${child.id}`}
                            type="text"
                            value={child.nome}
                            onChange={(event) => updateChild(child.id, 'nome', event.target.value)}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.general && (
                  <p className="text-xs font-medium text-primary">{errors.general}</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-support-1">Choose a profile sticker</h3>
                <p className="text-xs text-support-2">
                  Pick the vibe that best represents you today.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {STICKERS.map((sticker) => {
                    const isActive = form.figurinha === sticker.id
                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => setForm((previous) => ({ ...previous, figurinha: sticker.id }))}
                        className={`group relative flex flex-col items-center gap-2 rounded-3xl border border-white/60 bg-white/80 px-4 py-4 text-center shadow-soft transition-all duration-300 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 ${
                          isActive ? 'scale-[1.02] ring-2 ring-primary/50 shadow-glow' : 'hover:-translate-y-1'
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary/80 text-2xl shadow-soft transition-transform duration-300 group-hover:scale-105">
                          {sticker.emoji}
                        </span>
                        <span className="text-sm font-semibold text-support-1">{sticker.name}</span>
                        <span className="text-[11px] text-support-2">{stickerDescriptions[sticker.id]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" variant="primary" disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save and Continue'}
                </Button>
                <p className="text-center text-xs text-support-2">You can edit this information anytime in your Profile.</p>
                {statusMessage && (
                  <p className="text-center text-xs font-semibold text-support-1">{statusMessage}</p>
                )}
              </div>
            </div>
          )}
        </form>
      </Card>
    </Reveal>
  )
}
