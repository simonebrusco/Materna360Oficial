'use client'

import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/card'
import Emoji from '@/components/ui/Emoji'
import { DAILY_MESSAGES_PT } from '@/lib/dailyMessagesPt'

const STORAGE_KEY = 'materna_daily_message_v2'
const FALLBACK_NAME = 'Mãe'
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

type StoredMessage = {
  dateKey: string
  message: string
}

type DateParts = Record<'year' | 'month' | 'day', string>

const getTodayDateKey = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date()).reduce<DateParts>(
    (acc, part) => {
      if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
        acc[part.type] = part.value
      }
      return acc
    },
    { year: '', month: '', day: '' },
  )

  return `${parts.year}-${parts.month}-${parts.day}`
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

  if (!pool || pool.length === 0) {
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
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredMessage>
    if (typeof parsed.dateKey !== 'string' || typeof parsed.message !== 'string') return null

    return { dateKey: parsed.dateKey, message: parsed.message }
  } catch {
    return null
  }
}

const persistMessage = (record: StoredMessage) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // silencioso: cache nunca pode quebrar UI
  }
}

const fetchMotherName = async (): Promise<string> => {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`Failed to load profile (${response.status})`)

    const data = await response.json()
    const rawName = typeof data?.motherName === 'string' ? data.motherName : data?.nomeMae
    return typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : FALLBACK_NAME
  } catch {
    return FALLBACK_NAME
  }
}

export function MessageOfDay() {
  //  estado inicial estável (SSR/primeiro render)
  const [message, setMessage] = useState<string>('…')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true

    const todayKey = getTodayDateKey()
    const cached = readCachedMessage()

    //  se houver cache válido de hoje, já mostra imediatamente
    if (cached?.dateKey === todayKey && cached.message.trim().length > 0) {
      setMessage(cached.message)
      setIsLoading(false)
    }

    const load = async () => {
      const name = await fetchMotherName()
      if (!active) return

      const template = selectTemplateForDate(todayKey)
      const computedMessage = replaceNamePlaceholder(template.text, name)

      // Atualiza se não houver cache do dia ou se tiver divergido
      if (cached?.dateKey !== todayKey || cached.message !== computedMessage) {
        persistMessage({ dateKey: todayKey, message: computedMessage })
        setMessage(computedMessage)
      } else {
        setMessage(cached.message)
      }

      if (active) setIsLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">
          Mensagem do Dia
        </h2>

        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">
          “{isLoading && message === '…' ? '…' : message}”
        </p>
      </div>

      <div className="mt-2" aria-hidden />

      <span
        className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl"
        aria-hidden
      />
    </Card>
  )
}
