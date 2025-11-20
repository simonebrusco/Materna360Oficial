'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { DEFAULT_STICKER_ID, STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

const STICKER_DESCRIPTIONS: Record<ProfileStickerId, string> = {
  'mae-carinhosa': 'Amor nos pequenos gestos.',
  'mae-leve': 'Equilíbrio e presença.',
  'mae-determinada': 'Força com doçura.',
  'mae-criativa': 'Inventa e transforma.',
  'mae-tranquila': 'Serenidade e autocuidado.',
}

type ChildProfile = {
  id: string
  genero: 'menino' | 'menina'
  idadeMeses: number
  nome: string
  alergias: string[]
  ageRange?: '0-1' | '1-3' | '3-6' | '6-8' | '8+'
  currentPhase?: 'sono' | 'birras' | 'escolar' | 'socializacao' | 'alimentacao'
  notes?: string
}

type ProfileFormState = {
  // Bloco 1: Sobre você
  nomeMae: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'

  // Bloco 2: Filhos
  filhos: ChildProfile[]

  // Bloco 3: Rotina & momentos críticos
  routineChaosMoments?: string[]
  routineScreenTime?: 'nada' | 'ate1h' | '1-2h' | 'mais2h'
  routineDesiredSupport?: string[]

  // Bloco 4: Apoio & rede de suporte
  supportNetwork?: string[]
  supportAvailability?: 'sempre' | 'as-vezes' | 'raramente'

  // Bloco 5: Preferências no app
  userContentPreferences?: string[]
  userGuidanceStyle?: 'diretas' | 'explicacao' | 'motivacionais'
  userSelfcareFrequency?: 'diario' | 'semana' | 'pedido'

  // Existing
  figurinha: ProfileStickerId | ''
}

type FormErrors = {
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string
  filhos?: Record<string, string | undefined>
  routineChaosMoments?: string
  routineDesiredSupport?: string
  userContentPreferences?: string
  figurinha?: string
  general?: string
}

const createEmptyChild = (index: number): ChildProfile => ({
  id: `child-${index}`,
  genero: 'menino',
  idadeMeses: 0,
  nome: '',
  alergias: [],
  ageRange: undefined,
  currentPhase: undefined,
  notes: '',
})

const defaultState = (): ProfileFormState => ({
  nomeMae: '',
  userPreferredName: '',
  userRole: undefined,
  userEmotionalBaseline: undefined,
  userMainChallenges: [],
  userEnergyPeakTime: undefined,
  filhos: [createEmptyChild(0)],
  routineChaosMoments: [],
  routineScreenTime: undefined,
  routineDesiredSupport: [],
  supportNetwork: [],
  supportAvailability: undefined,
  userContentPreferences: [],
  userGuidanceStyle: undefined,
  userSelfcareFrequency: undefined,
  figurinha: '',
})

export function ProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileFormState>(() => defaultState())
  const [babyBirthdate, setBabyBirthdate] = useState('')
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

        if (response.ok && isMounted) {
          const data = await response.json()
          const savedName =
            typeof data?.motherName === 'string'
              ? data.motherName
              : typeof data?.nomeMae === 'string'
                ? data.nomeMae
                : ''

          setForm((previous) => ({
            ...previous,
            nomeMae: savedName,
          }))
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.warn('Falha ao carregar nome do perfil:', errorMsg)
          setForm((previous) => ({ ...previous, nomeMae: '' }))
        }
      }

      try {
        const eu360Response = await fetch('/api/eu360/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (eu360Response.ok && isMounted) {
          const eu360Data = (await eu360Response.json()) as { name?: string; birthdate?: string | null }
          setForm((previous) => ({
            ...previous,
            nomeMae: eu360Data?.name ? eu360Data.name : previous.nomeMae,
          }))
          setBabyBirthdate(typeof eu360Data?.birthdate === 'string' ? eu360Data.birthdate : '')
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.warn('Falha ao carregar perfil eu360:', errorMsg)
        }
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
      filhos: [...previous.filhos, createEmptyChild(previous.filhos.length)],
    }))
  }

  const removeChild = (id: string) => {
    setForm((previous) => ({
      ...previous,
      filhos: previous.filhos.length > 1 ? previous.filhos.filter((child) => child.id !== id) : previous.filhos,
    }))
  }

  const toggleArrayField = (fieldName: keyof ProfileFormState, value: string) => {
    setForm((previous) => {
      const current = previous[fieldName] as string[] | undefined
      const updated = (current || []).includes(value)
        ? (current || []).filter((item) => item !== value)
        : [...(current || []), value]
      return { ...previous, [fieldName]: updated }
    })
  }

  const validateForm = (state: ProfileFormState) => {
    const nextErrors: FormErrors = {}

    if (!state.nomeMae.trim()) {
      nextErrors.nomeMae = 'Informe seu nome.'
    }

    if (!state.userRole) {
      nextErrors.userRole = 'Informe seu papel na rotina.'
    }

    if (!state.userMainChallenges || state.userMainChallenges.length === 0) {
      nextErrors.userMainChallenges = 'Selecione pelo menos um desafio.'
    }

    if (!state.userEnergyPeakTime) {
      nextErrors.userEnergyPeakTime = 'Informe quando você sente mais energia.'
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

    if (!state.routineChaosMoments || state.routineChaosMoments.length === 0) {
      nextErrors.routineChaosMoments = 'Selecione pelo menos um momento crítico.'
    }

    if (!state.routineDesiredSupport || state.routineDesiredSupport.length === 0) {
      nextErrors.routineDesiredSupport = 'Informe em que você gostaria de ajuda.'
    }

    if (!state.userContentPreferences || state.userContentPreferences.length === 0) {
      nextErrors.userContentPreferences = 'Selecione pelo menos uma preferência de conteúdo.'
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
      const profileResponse = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          motherName: trimmedState.nomeMae,
          nomeMae: trimmedState.nomeMae,
          figurinha: figurinhaToPersist,
        }),
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to save profile')
      }

      setForm({
        nomeMae: trimmedState.nomeMae,
        filhos: trimmedState.filhos,
        figurinha: isProfileStickerId(figurinhaToPersist) ? figurinhaToPersist : '',
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('materna:profile-updated', {
            detail: {
              figurinha: figurinhaToPersist,
              nomeMae: trimmedState.nomeMae,
              filhos: trimmedState.filhos,
            },
          })
        )
      }

      const normalizedBirthdate = babyBirthdate ? babyBirthdate : null
      const firstChildAge = trimmedState.filhos[0]?.idadeMeses
      const normalizedAgeMonths =
        normalizedBirthdate !== null
          ? null
          : typeof firstChildAge === 'number' && Number.isFinite(firstChildAge) && firstChildAge >= 0
            ? Math.floor(firstChildAge)
            : null

      const eu360Response = await fetch('/api/eu360/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: trimmedState.nomeMae,
          birthdate: normalizedBirthdate,
          age_months: normalizedAgeMonths,
        }),
      })

      const eu360Payload = await eu360Response.json().catch(() => null)

      if (!eu360Response.ok || !eu360Payload) {
        const fallbackMessage =
          eu360Payload && typeof eu360Payload === 'object' && 'error' in eu360Payload && typeof eu360Payload.error === 'string'
            ? eu360Payload.error
            : 'Não foi possível salvar agora. Tente novamente em instantes.'

        setStatusMessage(fallbackMessage)
        return
      }

      const eu360Data = eu360Payload as { name?: string; birthdate?: string | null }
      setBabyBirthdate(typeof eu360Data?.birthdate === 'string' ? eu360Data.birthdate : '')
      setForm((previous) => ({
        ...previous,
        nomeMae: eu360Data?.name ? eu360Data.name : trimmedState.nomeMae,
      }))

      setErrors({})
      setStatusMessage('Salvo com carinho!')
      router.push('/meu-dia')
      router.refresh()
      return
    } catch (error) {
      console.error('ProfileForm submit error:', error)
      let message = 'Não foi possível salvar agora. Tente novamente em instantes.'

      if (error instanceof Error) {
        if (error.message === 'Failed to save profile' || error.message.includes('fetch')) {
          message = 'Erro de conexão. Verifique sua internet e tente novamente.'
        } else if (error.message.includes('timeout')) {
          message = 'A operação demorou muito. Tente novamente.'
        } else {
          message = error.message
        }
      }

      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const [todayISO, setTodayISO] = useState<string>('')

  useEffect(() => {
    const date = new Date().toISOString().split('T')[0]
    setTodayISO(date)
  }, [])

  return (
    <Reveal>
      <form className="space-y-6" onSubmit={handleSubmit} noValidate suppressHydrationWarning>
        {/* BLOCO 1: SOBRE VOCÊ */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Sobre você</h2>
            <p className="mt-1 text-xs text-gray-600">
              Isso nos ajuda a adaptar as sugestões à sua rotina real.
            </p>
          </div>

          {/* Seu nome */}
          <div className="space-y-2">
            <label htmlFor="mother-name" className="text-xs font-medium text-gray-800">
              Seu nome
            </label>
            <input
              id="mother-name"
              type="text"
              required
              value={form.nomeMae}
              onChange={(event) => setForm((previous) => ({ ...previous, nomeMae: event.target.value }))}
              className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 ${errors.nomeMae ? 'border-primary-400 ring-1 ring-primary-300' : ''}`}
              aria-invalid={Boolean(errors.nomeMae)}
              aria-describedby={errors.nomeMae ? 'mother-name-error' : undefined}
            />
            {errors.nomeMae && (
              <p id="mother-name-error" className="text-[11px] text-primary-600 font-medium">
                {errors.nomeMae}
              </p>
            )}
          </div>

          {/* Como prefere ser chamada */}
          <div className="space-y-2">
            <label htmlFor="preferred-name" className="text-xs font-medium text-gray-800">
              Como você prefere ser chamada?
            </label>
            <input
              id="preferred-name"
              type="text"
              value={form.userPreferredName || ''}
              onChange={(event) => setForm((previous) => ({ ...previous, userPreferredName: event.target.value }))}
              placeholder="Ex.: Ju, Mãe, Simone..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
            <p className="text-[11px] text-gray-500">Opcional, mas faz tudo mais pessoal.</p>
          </div>

          {/* Você é */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-800">Você é:</label>
            <select
              value={form.userRole || ''}
              onChange={(event) => setForm((previous) => ({ ...previous, userRole: event.target.value as any }))}
              className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none ${errors.userRole ? 'border-primary-400 ring-1 ring-primary-300' : ''}`}
              aria-invalid={Boolean(errors.userRole)}
            >
              <option value="">Selecione...</option>
              <option value="mae">Mãe</option>
              <option value="pai">Pai</option>
              <option value="outro">Outro cuidador</option>
            </select>
            {errors.userRole && (
              <p className="text-[11px] text-primary-600 font-medium">{errors.userRole}</p>
            )}
          </div>

          {/* Como você se sente */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-800">
              Como você se sente na maior parte dos dias com a maternidade?
            </label>
            <select
              value={form.userEmotionalBaseline || ''}
              onChange={(event) => setForm((previous) => ({ ...previous, userEmotionalBaseline: event.target.value as any }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
            >
              <option value="">Selecione...</option>
              <option value="sobrecarregada">Muito sobrecarregada</option>
              <option value="cansada">Cansada, mas dando conta</option>
              <option value="equilibrada">Equilibrada na maior parte do tempo</option>
              <option value="leve">Em uma fase mais leve</option>
            </select>
            <p className="text-[11px] text-gray-500">Opcional, mas ajuda a personalizar sugestões.</p>
          </div>

          {/* Maiores desafios */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-800">Qual é o seu maior desafio hoje?</label>
            <div className="space-y-2">
              {['Falta de tempo', 'Culpa', 'Organização da rotina', 'Comportamento do filho', 'Cansaço físico', 'Relação com parceiro(a) / família'].map((challenge) => (
                <label key={challenge} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.userMainChallenges || []).includes(challenge)}
                    onChange={() => toggleArrayField('userMainChallenges', challenge)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                  />
                  <span className="text-xs text-gray-800">{challenge}</span>
                </label>
              ))}
            </div>
            {errors.userMainChallenges && (
              <p className="text-[11px] text-primary-600 font-medium">{errors.userMainChallenges}</p>
            )}
          </div>

          {/* Pico de energia */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-800">
              Em que período do dia você sente mais energia?
            </label>
            <select
              value={form.userEnergyPeakTime || ''}
              onChange={(event) => setForm((previous) => ({ ...previous, userEnergyPeakTime: event.target.value as any }))}
              className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none ${errors.userEnergyPeakTime ? 'border-primary-400 ring-1 ring-primary-300' : ''}`}
              aria-invalid={Boolean(errors.userEnergyPeakTime)}
            >
              <option value="">Selecione...</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
            {errors.userEnergyPeakTime && (
              <p className="text-[11px] text-primary-600 font-medium">{errors.userEnergyPeakTime}</p>
            )}
          </div>
        </div>

        {/* BLOCO 2: SOBRE SEU(S) FILHO(S) */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Sobre seu(s) filho(s)</h2>
              <p className="mt-1 text-xs text-gray-600">
                Essas informações ajudam a adaptar ideias, receitas e inspirações à fase da sua família.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addChild} className="flex-shrink-0 whitespace-nowrap">
              + Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {form.filhos.map((child, index) => (
              <div key={child.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h4 className="text-xs font-semibold text-gray-900">Filho {index + 1}</h4>
                  {form.filhos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="text-xs font-semibold text-primary-500 transition hover:text-primary-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={`child-name-${index}`} className="text-xs font-medium text-gray-800">
                      Nome ou apelido
                    </label>
                    <input
                      id={`child-name-${index}`}
                      type="text"
                      value={child.nome}
                      onChange={(event) => updateChild(child.id, 'nome', event.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`child-gender-${index}`} className="text-xs font-medium text-gray-800">
                      Gênero
                    </label>
                    <select
                      id={`child-gender-${index}`}
                      value={child.genero}
                      onChange={(event) => updateChild(child.id, 'genero', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
                    >
                      <option value="menino">Menino</option>
                      <option value="menina">Menina</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`child-age-${index}`} className="text-xs font-medium text-gray-800">
                      Idade (meses)
                    </label>
                    <input
                      id={`child-age-${index}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={child.idadeMeses}
                      onChange={(event) => updateChild(child.id, 'idadeMeses', event.target.value)}
                      className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 ${errors.filhos?.[child.id] ? 'border-primary-400 ring-1 ring-primary-300' : ''}`}
                      aria-invalid={Boolean(errors.filhos?.[child.id])}
                      aria-describedby={errors.filhos?.[child.id] ? `child-age-error-${index}` : undefined}
                    />
                    {errors.filhos?.[child.id] && (
                      <p id={`child-age-error-${index}`} className="text-[11px] text-primary-600 font-medium">
                        {errors.filhos[child.id]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`child-age-range-${index}`} className="text-xs font-medium text-gray-800">
                      Faixa etária
                    </label>
                    <select
                      id={`child-age-range-${index}`}
                      value={child.ageRange || ''}
                      onChange={(event) => updateChild(child.id, 'ageRange', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="0-1">0–1 ano</option>
                      <option value="1-3">1–3 anos</option>
                      <option value="3-6">3–6 anos</option>
                      <option value="6-8">6–8 anos</option>
                      <option value="8+">8+ anos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`child-phase-${index}`} className="text-xs font-medium text-gray-800">
                      Qual fase mais desafia vocês?
                    </label>
                    <select
                      id={`child-phase-${index}`}
                      value={child.currentPhase || ''}
                      onChange={(event) => updateChild(child.id, 'currentPhase', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="sono">Sono</option>
                      <option value="birras">Birras / emoções intensas</option>
                      <option value="escolar">Rotina escolar</option>
                      <option value="socializacao">Socialização / amizade</option>
                      <option value="alimentacao">Alimentação</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor={`child-notes-${index}`} className="text-xs font-medium text-gray-800">
                      Algo importante que você acha que eu deveria saber?
                    </label>
                    <textarea
                      id={`child-notes-${index}`}
                      value={child.notes || ''}
                      onChange={(event) => updateChild(child.id, 'notes', event.target.value)}
                      placeholder="Escreva algo que nos ajude a entender melhor..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 resize-none"
                      rows={3}
                    />
                    <p className="text-[11px] text-gray-500">Opcional, mas muito valioso para personalizar.</p>
                  </div>

                  {index === 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="baby-birthdate" className="text-xs font-medium text-gray-800">
                        Data de nascimento do bebê
                      </label>
                      <input
                        id="baby-birthdate"
                        type="date"
                        value={babyBirthdate}
                        onChange={(event) => setBabyBirthdate(event.target.value)}
                        max={todayISO}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
                      />
                      <p className="text-[11px] text-gray-500">Opcional, mas ajuda a personalizar receitas e conteúdos.</p>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor={`child-allergies-${index}`} className="text-xs font-medium text-gray-800">
                      Alergias (separe por vírgula)
                    </label>
                    <input
                      id={`child-allergies-${index}`}
                      type="text"
                      value={child.alergias.join(', ')}
                      onChange={(event) => updateChild(child.id, 'alergias', event.target.value)}
                      placeholder="Ex.: leite, ovo, amendoim"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </div>
            ))}

            {errors.general && (
              <p className="text-[11px] text-primary-600 font-medium">{errors.general}</p>
            )}
          </div>
        </div>

        {/* Profile Sticker Card */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
          <h3 className="text-base font-semibold text-gray-900">Escolha sua figurinha de perfil</h3>
          <p className="mt-1 text-sm text-gray-600">
            Escolha a vibe que mais combina com você hoje.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STICKER_OPTIONS.map((sticker) => {
              const isActive = form.figurinha === sticker.id
              return (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => setForm((previous) => ({ ...previous, figurinha: sticker.id }))}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center transition-all duration-300 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                    isActive
                      ? 'border-primary-300 bg-primary-50 shadow-[0_4px_24px_rgba(47,58,86,0.08)]'
                      : 'border-gray-200 bg-white hover:border-primary-200 shadow-sm'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Selecionar figurinha ${sticker.label}`}
                >
                  <span className={`inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-100 ring-2 ring-primary-200'
                      : 'bg-gray-100'
                  }`}>
                    <Image
                      src={sticker.asset}
                      alt={sticker.label}
                      width={128}
                      height={128}
                      className="h-9 w-9 object-contain"
                      loading="lazy"
                    />
                  </span>
                  <span className="text-xs font-semibold text-gray-900">{sticker.label}</span>
                  <span className="text-[10px] text-gray-500 line-clamp-2">{STICKER_DESCRIPTIONS[sticker.id]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit Section */}
        <div className="space-y-3 pt-4">
          <Button type="submit" variant="primary" disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar e continuar'}
          </Button>
          <p className="text-center text-[11px] text-gray-500">Você poderá editar essas informações no seu Perfil.</p>
          {statusMessage && (
            <p className="text-center text-xs font-semibold text-gray-900">{statusMessage}</p>
          )}
        </div>
      </form>
    </Reveal>
  )
}
