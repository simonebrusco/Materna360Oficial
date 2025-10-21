'use client'

import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/Card'

const LOCAL_STORAGE_KEY = 'materna_daily_message'

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

export function MessageOfDay() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const dateKey = getCurrentDateKey()

    try {
      const cachedRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY)

      if (cachedRaw) {
        const cached: CachedDailyMessage = JSON.parse(cachedRaw)

        if (cached?.dateKey === dateKey && cached?.message) {
          setMessage(cached.message)
          setIsLoading(false)
          return
        }
      }
    } catch (error) {
      console.error('Failed to read cached daily message:', error)
    }

    const fetchMessage = async () => {
      try {
        const response = await fetch('/api/daily-message', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch daily message (${response.status})`)
        }

        const data = (await response.json()) as CachedDailyMessage & { generatedAt?: string }

        if (data?.message) {
          setMessage(data.message)

          try {
            window.localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({ message: data.message, dateKey })
            )
          } catch (error) {
            console.error('Failed to cache daily message:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load daily message:', error)

        try {
          const cachedRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
          if (cachedRaw) {
            const cached: CachedDailyMessage = JSON.parse(cachedRaw)
            if (cached?.message) {
              setMessage(cached.message)
              return
            }
          }
        } catch (readError) {
          console.error('Failed to fallback to cached daily message:', readError)
        }

        setMessage((previous) => previous || 'Você está fazendo um ótimo trabalho!')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchMessage()
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
