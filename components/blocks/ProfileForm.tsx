'use client'

import { FormEvent, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import {
  AboutYouBlock,
  ChildrenBlock,
  RoutineBlock,
  SupportBlock,
  PreferencesBlock,
} from './ProfileFormBlocks'
import { Eu360Stepper, type Eu360Step } from '@/components/eu360/Eu360Stepper'
import { WizardBand } from '@/components/eu360/WizardBand'

import { DEFAULT_STICKER_ID, STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

export type ChildProfile = {
  id: string
  genero: 'menino' | 'menina'
  idadeMeses: number
  nome: string
  alergias: string[]
  ageRange?: '0-1' | '1-3' | '3-6' | '6-8' | '8+'
  currentPhase?: 'sono' | 'birras' | 'escolar' | 'socializacao' | 'alimentacao'
  notes?: string
}

export type ProfileFormState = {
  nomeMae: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  filhos: ChildProfile[]
  routineChaosMoments?: string[]
  routineScreenTime?: 'nada' | 'ate1h' | '1-2h' | 'mais2h'
  routineDesiredSupport?: string[]
  supportNetwork?: string[]
  supportAvailability?: 'sempre' | 'as-vezes' | 'raramente'
  userContentPreferences?: string[]
  userGuidanceStyle?: 'diretas' | 'explicacao' | 'motivacionais'
  userSelfcareFrequency?: 'diario' | 'semana' | 'pedido'
  figurinha: ProfileStickerId | ''
}

export type FormErrors = {
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

const STICKER_DESCRIPTIONS: Record<ProfileStickerId, string> = {
  'mae-carinhosa': 'Amor nos pequenos gestos.',
  'mae-leve': 'Equilíbrio e presença.',
  'mae-determinada': 'Força com doçura.',
  'mae-criativa': 'Inventa e transforma.',
  'mae-tranquila': 'Serenidade e autocuidado.',
  'mae-resiliente': 'Cai, respira fundo e recomeça.',
}

const createEmptyChild = (index: number): ChildProfile => ({
  id: `child-${index}`,
  genero: 'menino',
  idadeMeses: 0,
  nome: '',
  alergias: [],
})

const defaultState = (): ProfileFormState => ({
  nomeMae: '',
  userPreferredName: undefined,
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
  const [todayISO, setTodayISO] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<Eu360Step>('about-you')
  const [autoSaveStatus, setAutoSaveStatus] = useState<Record<Eu360Step, 'idle' | 'saving' | 'saved'>>({
    'about-you': 'idle',
    children: 'idle',
    routine: 'idle',
    support: 'idle',
  })
  const autoSaveTimeoutRef = useRef<Record<Eu360Step, NodeJS.Timeout>>({
    'about-you': undefined as any,
    children: undefined as any,
    routine: undefined as any,
    support: undefined as any,
  })

  useEffect(() => {
    const date = new Date().toISOString().split('T')[0]
    setTodayISO(date)
  }, [])

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
            userPreferredName: data?.userPreferredName || '',
            userRole: data?.userRole || undefined,
            userEmotionalBaseline: data?.userEmotionalBaseline || undefined,
            userMainChallenges: data?.userMainChallenges || [],
            userEnergyPeakTime: data?.userEnergyPeakTime || undefined,
            filhos: data?.children && Array.isArray(data.children) && data.children.length > 0
              ? data.children
              : [createEmptyChild(0)],
            routineChaosMoments: data?.routineChaosMoments || [],
            routineScreenTime: data?.routineScreenTime || undefined,
            routineDesiredSupport: data?.routineDesiredSupport || [],
            supportNetwork: data?.supportNetwork || [],
            supportAvailability: data?.supportAvailability || undefined,
            userContentPreferences: data?.userContentPreferences || [],
            userGuidanceStyle: data?.userGuidanceStyle || undefined,
            userSelfcareFrequency: data?.userSelfcareFrequency || undefined,
            figurinha: (isProfileStickerId(data?.figurinha) ? data.figurinha : '') || '',
          }))
          setBabyBirthdate(data?.birthdate || '')
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

  const updateChild = (id: string, key: keyof ChildProfile, value: string | number | string[]) => {
    setForm((previous) => ({
      ...previous,
      filhos: previous.filhos.map((child) => {
        if (child.id !== id) return child

        if (key === 'idadeMeses') {
          const parsed = Math.max(0, Number(value))
          return { ...child, idadeMeses: Number.isFinite(parsed) ? parsed : 0 }
        }

        if (key === 'genero') {
          return { ...child, genero: value === 'menina' ? 'menina' : 'menino' }
        }

        if (key === 'alergias') {
          const base = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
          const normalized = base
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0)
          const unique = Array.from(
            new Set(normalized.map((item) => item.toLocaleLowerCase('pt-BR')))
          )
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
      filhos:
        previous.filhos.length > 1 ? previous.filhos.filter((child) => child.id !== id) : previous.filhos,
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

  const triggerAutoSave = useCallback(
    async (step: Eu360Step) => {
      setAutoSaveStatus((prev) => ({ ...prev, [step]: 'saving' }))

      try {
        const normalizedBirthdate = babyBirthdate || null
        const firstChildAge = form.filhos[0]?.idadeMeses
        const normalizedAgeMonths =
          normalizedBirthdate !== null
            ? null
            : typeof firstChildAge === 'number' && Number.isFinite(firstChildAge) && firstChildAge >= 0
              ? Math.floor(firstChildAge)
              : null

        const response = await fetch('/api/eu360/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            name: form.nomeMae,
            birthdate: normalizedBirthdate,
            age_months: normalizedAgeMonths,
            userPreferredName: form.userPreferredName,
            userRole: form.userRole,
            userEmotionalBaseline: form.userEmotionalBaseline,
            userMainChallenges: form.userMainChallenges,
            userEnergyPeakTime: form.userEnergyPeakTime,
            routineChaosMoments: form.routineChaosMoments,
            routineScreenTime: form.routineScreenTime,
            routineDesiredSupport: form.routineDesiredSupport,
            supportNetwork: form.supportNetwork,
            supportAvailability: form.supportAvailability,
            userContentPreferences: form.userContentPreferences,
            userGuidanceStyle: form.userGuidanceStyle,
            userSelfcareFrequency: form.userSelfcareFrequency,
            figurinha: isProfileStickerId(form.figurinha) ? form.figurinha : DEFAULT_STICKER_ID,
            children: form.filhos,
          }),
        })

        if (response.ok) {
          setAutoSaveStatus((prev) => ({ ...prev, [step]: 'saved' }))
          // Clear saved status after 3 seconds
          if (autoSaveTimeoutRef.current[step]) {
            clearTimeout(autoSaveTimeoutRef.current[step])
          }
          autoSaveTimeoutRef.current[step] = setTimeout(() => {
            setAutoSaveStatus((prev) => ({ ...prev, [step]: 'idle' }))
          }, 3000)
        } else {
          setAutoSaveStatus((prev) => ({ ...prev, [step]: 'idle' }))
        }
      } catch (error) {
        console.warn('Autosave failed:', error)
        setAutoSaveStatus((prev) => ({ ...prev, [step]: 'idle' }))
      }
    },
    [form, babyBirthdate]
  )

  // Setup debounced autosave on form change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      triggerAutoSave(currentStep)
    }, 1500) // 1.5 second debounce

    return () => clearTimeout(timeoutId)
  }, [form, currentStep, triggerAutoSave])

  // Handle step change with smooth scroll
  const handleStepClick = (step: Eu360Step) => {
    setCurrentStep(step)
    triggerAutoSave(step) // Save when changing steps

    // Smooth scroll to the section
    const element = document.getElementById(step)
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage('')

    const validationErrors = validateForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      const normalizedBirthdate = babyBirthdate || null
      const firstChildAge = form.filhos[0]?.idadeMeses
      const normalizedAgeMonths =
        normalizedBirthdate !== null
          ? null
          : typeof firstChildAge === 'number' && Number.isFinite(firstChildAge) && firstChildAge >= 0
            ? Math.floor(firstChildAge)
            : null

      const eu360Response = await fetch('/api/eu360/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: form.nomeMae,
          birthdate: normalizedBirthdate,
          age_months: normalizedAgeMonths,
          userPreferredName: form.userPreferredName,
          userRole: form.userRole,
          userEmotionalBaseline: form.userEmotionalBaseline,
          userMainChallenges: form.userMainChallenges,
          userEnergyPeakTime: form.userEnergyPeakTime,
          routineChaosMoments: form.routineChaosMoments,
          routineScreenTime: form.routineScreenTime,
          routineDesiredSupport: form.routineDesiredSupport,
          supportNetwork: form.supportNetwork,
          supportAvailability: form.supportAvailability,
          userContentPreferences: form.userContentPreferences,
          userGuidanceStyle: form.userGuidanceStyle,
          userSelfcareFrequency: form.userSelfcareFrequency,
          figurinha: isProfileStickerId(form.figurinha) ? form.figurinha : DEFAULT_STICKER_ID,
          children: form.filhos,
        }),
      })

      if (eu360Response.ok) {
        setStatusMessage('Salvo com carinho!')

        if (typeof window !== 'undefined') {
          const figurinhaToPersist = isProfileStickerId(form.figurinha) ? form.figurinha : DEFAULT_STICKER_ID
          window.dispatchEvent(
            new CustomEvent('materna:profile-updated', {
              detail: {
                figurinha: figurinhaToPersist,
                nomeMae: form.nomeMae,
              },
            })
          )
        }

        router.push('/meu-dia')
        router.refresh()
      } else {
        const data = await eu360Response.json().catch(() => ({}))
        const message =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Não foi possível salvar agora. Tente novamente em instantes.'
        setStatusMessage(message)
      }
    } catch (error) {
      console.error('ProfileForm submit error:', error)
      setStatusMessage('Erro ao processar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (updates: Partial<ProfileFormState>) => {
    setForm((previous) => ({ ...previous, ...updates }))
  }

  return (
    <Reveal>
      <form className="w-full" onSubmit={handleSubmit} noValidate suppressHydrationWarning>
        {/* Stepper Navigation */}
        <Eu360Stepper currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Wizard Bands */}
        <div className="space-y-0">
          {/* Band 1: About You */}
          <WizardBand
            id="about-you"
            title="Sobre você"
            description="Isso nos ajuda a adaptar as sugestões à sua rotina real."
            autoSaveStatus={autoSaveStatus['about-you']}
          >
            <AboutYouBlock form={form} errors={errors} onChange={handleChange} />
          </WizardBand>

          {/* Band 2: Children */}
          <WizardBand
            id="children"
            title="Sobre seu(s) filho(s)"
            description="Isso ajuda a personalizar tudo: conteúdo, receitas, atividades."
            autoSaveStatus={autoSaveStatus['children']}
          >
            <ChildrenBlock
              form={form}
              errors={errors}
              babyBirthdate={babyBirthdate}
              todayISO={todayISO}
              onBirthdateChange={setBabyBirthdate}
              onUpdateChild={updateChild}
              onAddChild={addChild}
              onRemoveChild={removeChild}
            />
          </WizardBand>

          {/* Band 3: Routine & Moments */}
          <WizardBand
            id="routine"
            title="Rotina & momentos críticos"
            description="Aqui a gente entende onde o dia costuma apertar para te ajudar com soluções mais realistas."
            autoSaveStatus={autoSaveStatus['routine']}
          >
            <RoutineBlock form={form} errors={errors} onChange={handleChange} onToggleArrayField={toggleArrayField} />
          </WizardBand>

          {/* Band 4: Support Network */}
          <WizardBand
            id="support"
            title="Rede de apoio"
            description="Conectar você com sua rede pode ser a melhor ajuda."
            autoSaveStatus={autoSaveStatus['support']}
          >
            <SupportBlock form={form} onChange={handleChange} onToggleArrayField={toggleArrayField} />

            {/* Preferences in same band */}
            <div className="border-t border-[var(--color-pink-snow)] pt-6 mt-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Preferências no app</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Assim a gente personaliza tudo para você.</p>
              </div>
              <PreferencesBlock form={form} onChange={handleChange} onToggleArrayField={toggleArrayField} />
            </div>
          </WizardBand>

          {/* Submit Button Band */}
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="rounded-3xl bg-white border border-[var(--color-pink-snow)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-3">
              <Button type="submit" variant="primary" disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar e continuar'}
              </Button>
              <p className="text-center text-[11px] text-[var(--color-text-muted)]">Você poderá editar essas informações no seu Perfil.</p>
              {statusMessage && <p className="text-center text-xs font-semibold text-[var(--color-text-main)]">{statusMessage}</p>}
            </div>
          </div>
        </div>
      </form>
    </Reveal>
  )
}
