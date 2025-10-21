'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card } from '@/components/ui/Card'

const LOCAL_STORAGE_KEY = 'materna_daily_message'
const FALLBACK_NAME = 'Mãe'

type MessageTemplate = {
  id: string
  text: string
}

export const MESSAGE_POOL: ReadonlyArray<MessageTemplate> = [
  { id: 'amor-necessario', text: 'lembre-se: o amor que você dá é o que seu filho mais precisa hoje.' },
  { id: 'presenca', text: 'você não precisa ser perfeita, só precisa estar presente.' },
  { id: 'gestos-carinho', text: 'pequenos gestos de carinho fazem grandes memórias, {name}.' },
  { id: 'duvidas', text: 'você está fazendo um ótimo trabalho — mesmo nos dias em que duvida disso.' },
  { id: 'respire', text: 'respire fundo, {name}. ser mãe é um exercício diário de amor e paciência.' },
  { id: 'desacelerar', text: 'hoje é um bom dia pra desacelerar e abraçar um pouquinho mais.' },
  { id: 'sorrisos', text: 'cada sorriso do seu filho é um lembrete de que você está no caminho certo.' },
  { id: 'confie', text: '{name}, confie em você — ninguém entende seu filho como você.' },
  { id: 'cuidar-de-si', text: 'às vezes cuidar de si é o melhor jeito de cuidar deles também.' },
  { id: 'calma', text: 'você é a calma no meio do caos. não se esqueça disso, {name}.' },
]

const DEFAULT_FALLBACK_TEMPLATE = MESSAGE_POOL[3]?.text ?? MESSAGE_POOL[0]?.text ?? 'você está fazendo um ótimo trabalho — mesmo nos dias em que duvida disso.'

const getCurrentDateKey = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

type CachedDailyMessageLegacy = {
  message?: string
  dateKey?: string
  baseMessage?: string
}

type CacheReadResult = {
  baseMessage: string
  needsMigration: boolean
} | null

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const stripBoundaryQuotes = (value: string) => value.replace(/^["“”]+/, '').replace(/["“”]+$/, '').trim()

const sanitizeBaseMessage = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return stripBoundaryQuotes(trimmed)
}

const stripLeadingName = (text: string, name: string) => {
  return text.replace(new RegExp(`^${escapeRegExp(name)}\\s*,\\s*`, 'i'), '').trim()
}

const stripTrailingName = (text: string, name: string) => {
  return text.replace(
    new RegExp(`(,\\s*)?${escapeRegExp(name)}([.!?])?$`, 'i'),
    (_, __, punctuation) => (punctuation ?? '')
  ).trim()
}

const removeNameArtifacts = (value: string, name: string) => {
  let result = value.trim()
  if (!result) {
    return ''
  }

  result = stripLeadingName(result, name)
  result = stripLeadingName(result, FALLBACK_NAME)
  result = stripTrailingName(result, name)
  result = stripTrailingName(result, FALLBACK_NAME)

  return result.trim()
}

const stripExtraneousWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const buildPersonalizedMessage = (name: string, baseMessage: string) => {
  const safeName = name.trim() || FALLBACK_NAME
  const sanitizedBody = sanitizeBaseMessage(baseMessage)
  if (!sanitizedBody) {
    return `${safeName}, ${DEFAULT_FALLBACK_TEMPLATE.replaceAll('{name}', safeName)}`
  }

  const replacedBody = stripExtraneousWhitespace(sanitizedBody.replaceAll('{name}', safeName))
  const prefixPattern = new RegExp(`^${escapeRegExp(safeName)}\\s*,`, 'i')

  if (prefixPattern.test(replacedBody)) {
    return replacedBody.replace(prefixPattern, `${safeName}, `)
  }

  const withoutTrailing = stripTrailingName(stripTrailingName(replacedBody, safeName), FALLBACK_NAME)
  const finalBody = withoutTrailing.trim() || DEFAULT_FALLBACK_TEMPLATE.replaceAll('{name}', safeName)

  return `${safeName}, ${finalBody}`
}

const safeHash = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const getFallbackTemplate = (dateKey: string) => {
  const pool = MESSAGE_POOL
  if (pool.length === 0) {
    return DEFAULT_FALLBACK_TEMPLATE
  }

  const hash = safeHash(dateKey)
  const index = Math.abs(hash) % pool.length
  return pool[index]?.text ?? DEFAULT_FALLBACK_TEMPLATE
}

const persistBaseMessage = (dateKey: string, baseMessage: string) => {
  if (typeof window === 'undefined') {
    return
  }

  const sanitized = sanitizeBaseMessage(baseMessage)
  if (!sanitized) {
    return
  }

  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ dateKey, baseMessage: sanitized })
    )
  } catch (error) {
    console.error('Falha ao salvar mensagem diária no cache:', error)
  }
}

const readCachedBaseMessage = (dateKey: string, name: string): CacheReadResult => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: CachedDailyMessageLegacy = JSON.parse(raw)
    if (parsed?.dateKey !== dateKey) {
      return null
    }

    if (typeof parsed.baseMessage === 'string') {
      const sanitized = sanitizeBaseMessage(parsed.baseMessage)
      if (!sanitized) {
        return null
      }
      return { baseMessage: sanitized, needsMigration: false }
    }

    if (typeof parsed.message === 'string') {
      const sanitized = sanitizeBaseMessage(parsed.message)
      if (!sanitized) {
        return null
      }
      const stripped = removeNameArtifacts(sanitized, name) || sanitized
      return { baseMessage: stripped, needsMigration: true }
    }
  } catch (error) {
    console.error('Falha ao ler mensagem diária em cache:', error)
  }

  return null
}

const fetchMotherName = async (): Promise<string> => {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to load profile (${response.status})`)
    }

    const data = await response.json()
    const rawName = typeof data?.nomeMae === 'string' ? data.nomeMae.trim() : ''
    return rawName || FALLBACK_NAME
  } catch (error) {
    console.error('Não foi possível carregar o nome da mãe:', error)
    return FALLBACK_NAME
  }
}

const fetchDailyMessageBase = async (dateKey: string, name: string): Promise<string | null> => {
  const params = new URLSearchParams({ name })

  try {
    const response = await fetch(`/api/daily-message?${params.toString()}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch daily message (${response.status})`)
    }

    const data = (await response.json()) as { message?: string }
    const sanitized = sanitizeBaseMessage(data?.message)
    if (!sanitized) {
      return null
    }

    const normalized = removeNameArtifacts(sanitized, name)
    return normalized || sanitized
  } catch (error) {
    console.error('Falha ao carregar mensagem diária:', error)
    return null
  }
}

export function MessageOfDay() {
  const [motherName, setMotherName] = useState(FALLBACK_NAME)
  const [baseMessage, setBaseMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let active = true

    const loadMessage = async () => {
      const dateKey = getCurrentDateKey()
      const name = await fetchMotherName()

      if (!active) {
        return
      }

      setMotherName(name)

      const cached = readCachedBaseMessage(dateKey, name)
      if (cached?.baseMessage) {
        if (cached.needsMigration) {
          persistBaseMessage(dateKey, cached.baseMessage)
        }

        setBaseMessage(cached.baseMessage)
        setIsLoading(false)
        return
      }

      const fetchedBase = await fetchDailyMessageBase(dateKey, name)
      if (!active) {
        return
      }

      if (fetchedBase) {
        persistBaseMessage(dateKey, fetchedBase)
        setBaseMessage(fetchedBase)
        setIsLoading(false)
        return
      }

      const fallbackTemplate = getFallbackTemplate(dateKey)
      persistBaseMessage(dateKey, fallbackTemplate)
      setBaseMessage(fallbackTemplate)
      setIsLoading(false)
    }

    void loadMessage()

    return () => {
      active = false
    }
  }, [])

  const finalMessage = useMemo(() => {
    if (!baseMessage) {
      return ''
    }

    return buildPersonalizedMessage(motherName, baseMessage)
  }, [baseMessage, motherName])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✨ Mensagem do Dia</h2>
        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">
          “{isLoading && !finalMessage ? '...' : finalMessage}”
        </p>
      </div>
      <div className="mt-2" aria-hidden />
      <span className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl" aria-hidden />
    </Card>
  )
}
