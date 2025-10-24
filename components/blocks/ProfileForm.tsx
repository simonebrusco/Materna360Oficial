'use client'

'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { DEFAULT_STICKER_ID, ProfileStickerId, STICKER_OPTIONS, isProfileStickerId } from '@/app/lib/stickers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

const STICKER_DESCRIPTIONS: Record<ProfileStickerId, string> = {
  'mae-carinhosa': 'Amor nos pequenos gestos.',
  'mae-leve': 'Equilíbrio e presença.',
  'mae-determinada': 'Força com doçura.',
  'mae-criativa': 'Inventa e transforma.',
  'mae-tranquila': 'Serenidade e autocuidado.',
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

type ChildProfile = {
  id: string
  genero: 'menino' | 'menina'
  idadeMeses: number
  nome: string
  alergias: string[]
}

type ProfileFormState = {
  nomeMae: string
  filhos: ChildProfile[]
  figurinha: ProfileStickerId | ''
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
  alergias: [],
})

const defaultState = (): ProfileFormState => ({
  nomeMae: '',
  filhos: [createEmptyChild()],
  figurinha: '',
})

export function ProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileFormState>(() => defaultState())
  const [babyBirthdate, setBabyBirthdate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [statusMessage, setStatusMessage] = useState('')


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

        if (isMounted) {
          const normalizedChildren = Array.isArray(data?.filhos) && data.filhos.length > 0 ? data.filhos : [createEmptyChild()]

          setForm({
            nomeMae: typeof data?.nomeMae === 'string' ? data.nomeMae : '',
            filhos: normalizedChildren.map((child: any) => ({
              id: typeof child?.id === 'string' && child.id.trim() ? child.id : createEmptyChild().id,
              genero: child?.genero === 'menina' ? 'menina' : 'menino',
              idadeMeses: Number.isFinite(Number(child?.idadeMeses)) && Number(child?.idadeMeses) >= 0 ? Number(child.idadeMeses) : 0,
              nome: typeof child?.nome === 'string' ? child.nome : '',
              alergias: Array.isArray(child?.alergias)
                ? child.alergias
                    .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
                    .filter((item: string) => item.length > 0)
                : [],
            })),
            figurinha: isProfileStickerId(data?.figurinha) ? data.figurinha : '',
          })
        }
      } catch (error) {
        console.error(error)
        if (isMounted) {
          setForm(defaultState())
          setBabyBirthdate('')
        }
      }

      try {
        const eu360Response = await fetch('/api/eu360/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (eu360Response.ok) {
          const eu360Data = (await eu360Response.json()) as { name?: string; birthdate?: string | null }
          if (isMounted) {
            setForm((previous) => ({
              ...previous,
              nomeMae: eu360Data?.name ? eu360Data.name : previous.nomeMae,
            }))
            setBabyBirthdate(typeof eu360Data?.birthdate === 'string' ? eu360Data.birthdate : '')
          }
        }
      } catch (error) {
        console.error(error)
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const updateChild = (id: string, key: keyof ChildProfile, value: string | number | string[]) => {
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

        if (key === 'alergias') {
          const base = Array.isArray(value)
            ? value
            : typeof value === 'string'
            ? value.split(',')
            : []
          const normalized = base
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0)
          const unique = Array.from(new Set(normalized.map((item) => item.toLocaleLowerCase('pt-BR'))))
            .map((keyName) => normalized.find((item) => item.toLocaleLowerCase('pt-BR') === keyName) ?? '')
            .filter((item) => item.length > 0)
          return { ...child, alergias: unique }
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
      nextErrors.nomeMae = 'Informe seu nome.'
    }

    if (!state.filhos.length) {
      nextErrors.general = 'Adicione pelo menos um filho.'
    }

    const childErrors: Record<string, string> = {}

    state.filhos.forEach((child) => {
      if (child.idadeMeses < 0) {
        childErrors[child.id] = 'A idade precisa ser igual ou maior que 0.'
      }
    })

    if (Object.keys(childErrors).length > 0) {
      nextErrors.filhos = childErrors
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage('')

    const trimmedState: ProfileFormState = {
      ...form,
      nomeMae: form.nomeMae.trim(),
      filhos: form.filhos.map((child) => ({
        ...child,
        nome: child.nome.trim(),
        alergias: Array.from(
          new Set(
            child.alergias
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
              .map((item) => item.toLocaleLowerCase('pt-BR'))
          )
        )
          .map((key) => child.alergias.find((item) => item.toLocaleLowerCase('pt-BR') === key) ?? '')
          .filter((item) => item.length > 0),
      })),
      figurinha: isProfileStickerId(form.figurinha) ? form.figurinha : '',
    }

    const figurinhaToPersist = isProfileStickerId(trimmedState.figurinha) ? trimmedState.figurinha : DEFAULT_STICKER_ID

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
        body: JSON.stringify({
          ...trimmedState,
          figurinha: figurinhaToPersist,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      const data = await response.json()

      const figurinhaFromResponse = isProfileStickerId(data.figurinha) ? data.figurinha : ''

      setForm({
        nomeMae: data.nomeMae,
        filhos: data.filhos,
        figurinha: figurinhaFromResponse,
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('materna:profile-updated', {
            detail: {
              figurinha: figurinhaFromResponse || figurinhaToPersist,
              nomeMae: data.nomeMae,
              filhos: data.filhos,
            },
          })
        )
      }

      const eu360Response = await fetch('/api/eu360/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedState.nomeMae,
          birthdate: babyBirthdate ? babyBirthdate : null,
          age_months: Number.isFinite(trimmedState.filhos[0]?.idadeMeses)
            ? trimmedState.filhos[0]?.idadeMeses ?? null
            : null,
        }),
      })

      if (!eu360Response.ok) {
        const payload = await eu360Response.json().catch(() => ({}))
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Failed to save Eu360 profile')
      }

      const eu360Data = (await eu360Response.json()) as { name?: string; birthdate?: string | null }
      setBabyBirthdate(typeof eu360Data?.birthdate === 'string' ? eu360Data.birthdate : '')
      setForm((previous) => ({
        ...previous,
        nomeMae: eu360Data?.name ? eu360Data.name : previous.nomeMae,
      }))

      setErrors({})
      setStatusMessage('Salvo com carinho!')
      router.refresh()
    } catch (error) {
      console.error(error)
      setStatusMessage('Não foi possível salvar agora. Tente novamente em instantes.')
    } finally {
      setSaving(false)
    }
  }

  const inputClasses = 'w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft transition-all duration-300 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
  const todayISO = new Date().toISOString().split('T')[0]

  return (
    <Reveal>
      <Card className="p-7">
        <form className="space-y-7" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              boas-vindas
            </p>
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">
              Antes de começarmos, me conte um pouquinho sobre você
            </h2>
            <p className="text-sm text-support-2 md:text-base">
              Isso personaliza sua experiência e deixa tudo mais prático no dia a dia.
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
                  Seu nome
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
                    <h3 className="text-lg font-semibold text-support-1">Filhos</h3>
                    <p className="text-xs text-support-2">
                      Adicione cada filho para personalizar atividades e dicas.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    ＋ Adicionar outro filho
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.filhos.map((child, index) => (
                    <div key={child.id} className="rounded-2xl border border-white/50 bg-white/75 p-4 shadow-soft">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-support-1">Filho {index + 1}</h4>
                        {form.filhos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(child.id)}
                            className="text-xs font-semibold text-primary transition hover:text-primary/80"
                          >
                            Remover filho
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label htmlFor={`child-gender-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Gênero
                          </label>
                          <select
                            id={`child-gender-${child.id}`}
                            value={child.genero}
                            onChange={(event) => updateChild(child.id, 'genero', event.target.value)}
                            className={`${inputClasses} appearance-none`}
                          >
                            <option value="menino">Menino</option>
                            <option value="menina">Menina</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`child-age-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Idade (em meses)
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
                        {index === 0 && (
                          <div className="space-y-2 sm:col-span-3">
                            <label htmlFor="baby-birthdate" className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                              Data de nascimento do bebê
                            </label>
                            <input
                              id="baby-birthdate"
                              type="date"
                              value={babyBirthdate}
                              onChange={(event) => setBabyBirthdate(event.target.value)}
                              max={todayISO}
                              className={inputClasses}
                            />
                            <p className="text-xs text-support-2/80">Opcional, mas ajuda a personalizar receitas e conteúdos.</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label htmlFor={`child-name-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Nome (opcional)
                          </label>
                          <input
                            id={`child-name-${child.id}`}
                            type="text"
                            value={child.nome}
                            onChange={(event) => updateChild(child.id, 'nome', event.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-3">
                          <label htmlFor={`child-allergies-${child.id}`} className="text-xs font-semibold uppercase tracking-[0.1em] text-support-2/80">
                            Alergias (separe por vírgula)
                          </label>
                          <input
                            id={`child-allergies-${child.id}`}
                            type="text"
                            value={child.alergias.join(', ')}
                            onChange={(event) => updateChild(child.id, 'alergias', event.target.value)}
                            className={inputClasses}
                            placeholder="Ex.: leite, ovo, amendoim"
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
                <h3 className="text-lg font-semibold text-support-1">Escolha uma figurinha de perfil</h3>
                <p className="text-xs text-support-2">
                  Escolha a vibe que mais combina com você hoje.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {STICKER_OPTIONS.map((sticker) => {
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
                        aria-label={`Selecionar figurinha ${sticker.label}`}
                      >
                        <span className={`inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/90 shadow-soft transition-transform duration-300 group-hover:scale-105 ${
                          isActive ? 'ring-2 ring-primary/40' : ''
                        }`}>
                          <Image
                            src={sticker.asset}
                            alt={sticker.label}
                            width={128}
                            height={128}
                            className="h-11 w-11 object-contain"
                            loading="lazy"
                          />
                        </span>
                        <span className="text-sm font-semibold text-support-1">{sticker.label}</span>
                        <span className="text-[11px] text-support-2">{STICKER_DESCRIPTIONS[sticker.id]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" variant="primary" disabled={saving} className="w-full">
                  {saving ? 'Salvando...' : 'Salvar e continuar'}
                </Button>
                <p className="text-center text-xs text-support-2">Você poderá editar essas informações no seu Perfil.</p>
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
