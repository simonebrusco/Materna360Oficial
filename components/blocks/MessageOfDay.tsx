'use client'

'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DAILY_MESSAGES_PT } from '@/lib/dailyMessagesPt'

const STORAGE_KEY = 'materna_daily_message_v2'
const FALLBACK_NAME = 'Mãe'
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

type StoredMessage = {
  dateKey: string
  message: string
}

const getTodayDateKey = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

const hashDateKey = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash += value.charCodeAt(index)
  }
  return Math.abs(hash)
}

const selectTemplateForDate = (dateKey: string) => {
  const pool = DAILY_MESSAGES_PT

  if (pool.length === 0) {
    return { id: 'fallback', text: '{name}, respire fundo — você está fazendo o seu melhor hoje.' }
  }

  const index = hashDateKey(dateKey) % pool.length
  return pool[index]
}

const replaceNamePlaceholder = (templateText: string, name: string) => {
  const safeName = name.trim() || FALLBACK_NAME

  if (templateText.includes('{name}')) {
    return templateText.split('{name}').join(safeName)
  }

  return `${safeName}, ${templateText}`
}

const readCachedMessage = (): StoredMessage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredMessage>
    if (typeof parsed.dateKey !== 'string' || typeof parsed.message !== 'string') {
      return null
    }

    return {
      dateKey: parsed.dateKey,
      message: parsed.message,
    }
  } catch (error) {
    console.error('Falha ao ler mensagem diária do cache:', error)
    return null
  }
}

const persistMessage = (record: StoredMessage) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.error('Falha ao salvar mensagem diária no cache:', error)
  }
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

export function MessageOfDay() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let active = true
    const todayKey = getTodayDateKey()
    const cached = readCachedMessage()

    if (cached?.dateKey === todayKey) {
      setMessage(cached.message)
    }

    const load = async () => {
      const name = await fetchMotherName()
      if (!active) {
        return
      }

      const template = selectTemplateForDate(todayKey)
      const computedMessage = replaceNamePlaceholder(template.text, name)

      if (cached?.dateKey !== todayKey || cached.message !== computedMessage) {
        persistMessage({ dateKey: todayKey, message: computedMessage })
        setMessage(computedMessage)
      } else {
        setMessage(cached.message)
      }

      if (active) {
        setIsLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    const todayKey = getTodayDateKey()

    void fetchMotherName().then((name) => {
      const template = selectTemplateForDate(todayKey)
      const computedMessage = replaceNamePlaceholder(template.text, name)
      persistMessage({ dateKey: todayKey, message: computedMessage })
      setMessage(computedMessage)
      setIsLoading(false)
    })
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✨ Mensagem do Dia</h2>
        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">
          “{isLoading && !message ? '...' : message}”
        </p>
      </div>
      <div className="mt-2" aria-hidden />
      <Button variant="primary" size="sm" onClick={handleRefresh} className="w-full">
        Nova Mensagem
      </Button>
      <span className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl" aria-hidden />
    </Card>
  )
}
