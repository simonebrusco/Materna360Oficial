'use client'

import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/Card'

const LOCAL_STORAGE_KEY = 'materna_daily_message'
const FALLBACK_NAME = 'Mãe'
const FALLBACK_MESSAGE = 'Você está fazendo um ótimo trabalho!'

const getCurrentDateKey = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

type CachedDailyMessage = {
  message: string
  dateKey: string
}

const sanitizeMessage = (value: string | null | undefined) => {
  if (!value) {
    return FALLBACK_MESSAGE
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return FALLBACK_MESSAGE
  }

  const withoutQuotes = trimmed.replace(/^["“”]+/, '').replace(/["“”]+$/, '').trim()
  return withoutQuotes || FALLBACK_MESSAGE
}

const hasPersonalizedPrefix = (value: string) => /^[^,]+,\s/.test(value.trim())

const personalizeMessage = (name: string, baseMessage: string) => {
  const safeName = name.trim() || FALLBACK_NAME
  const safeMessage = sanitizeMessage(baseMessage)
  return `${safeName}, ${safeMessage}`
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

    const loadMessage = async () => {
      const dateKey = getCurrentDateKey()
      const motherName = await fetchMotherName()

      if (!active) {
        return
      }

      try {
        const cachedRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY)

        if (cachedRaw) {
          const cached: CachedDailyMessage = JSON.parse(cachedRaw)

          if (cached?.dateKey === dateKey && cached?.message) {
            const cachedMessage = cached.message

            if (hasPersonalizedPrefix(cachedMessage)) {
              setMessage(cachedMessage)
              setIsLoading(false)
              return
            }

            const updated = personalizeMessage(motherName, cachedMessage)
            setMessage(updated)
            setIsLoading(false)

            try {
              window.localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify({ message: updated, dateKey })
              )
            } catch (writeError) {
              console.error('Falha ao atualizar mensagem diária em cache:', writeError)
            }

            return
          }
        }
      } catch (error) {
        console.error('Falha ao ler mensagem diária em cache:', error)
      }

      const params = new URLSearchParams({ name: motherName })

      try {
        const response = await fetch(`/api/daily-message?${params.toString()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch daily message (${response.status})`)
        }

        const data = (await response.json()) as CachedDailyMessage & { generatedAt?: string }
        const baseMessage = sanitizeMessage(data?.message)
        const personalized = personalizeMessage(motherName, baseMessage)

        if (!active) {
          return
        }

        setMessage(personalized)

        try {
          window.localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({ message: personalized, dateKey })
          )
        } catch (error) {
          console.error('Failed to cache daily message:', error)
        }
      } catch (error) {
        console.error('Failed to load daily message:', error)

        const fallbackPersonalized = personalizeMessage(motherName, FALLBACK_MESSAGE)

        if (active) {
          setMessage((previous) => previous || fallbackPersonalized)

          try {
            window.localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({ message: fallbackPersonalized, dateKey })
            )
          } catch (writeError) {
            console.error('Failed to cache fallback daily message:', writeError)
          }
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadMessage()

    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✨ Mensagem do Dia</h2>
        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">
          “{isLoading && !message ? '...' : message}”
        </p>
      </div>
      <div className="mt-2" aria-hidden />
      <span className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl" aria-hidden />
    </Card>
  )
}
