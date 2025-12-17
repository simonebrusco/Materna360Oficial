'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { MyDayGroups } from '@/components/my-day/MyDayGroups'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'
type GroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

const LS_RECENT_SAVE = 'my_day_recent_save_v1'

type RecentSavePayload = {
  ts: number
  origin: TaskOrigin
  source: string
}

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function groupIdFromOrigin(origin: TaskOrigin): GroupId {
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  if (origin === 'today') return 'para-hoje'
  return 'outros'
}

function groupDomId(groupId: GroupId) {
  return `myday-group-${groupId}`
}

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // P9.3 — banner "salvei pra você" + scroll
  const [recentSave, setRecentSave] = useState<RecentSavePayload | null>(null)
  const [highlightGroupId, setHighlightGroupId] = useState<GroupId | undefined>(undefined)

  const dateKey = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // tracking
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  // saudação
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))
    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [name])

  // mensagem do dia
  useEffect(() => {
    const index = getDailyIndex(new Date(), DAILY_MESSAGES.length)
    setDailyMessage(DAILY_MESSAGES[index] ?? '…')
  }, [])

  // reload meia-noite
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const t = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(t)
  }, [])

  // P9.3 — ler “sinal” de save vindo do Maternar/Meu Dia Leve
  useEffect(() => {
    const raw = safeGetLS(LS_RECENT_SAVE)
    const payload = safeParseJSON<RecentSavePayload>(raw)

    // só mostra se for recente (ex: até 20 minutos)
    if (!payload?.ts) return
    const ageMs = Date.now() - payload.ts
    const maxAge = 20 * 60 * 1000
    if (ageMs < 0 || ageMs > maxAge) {
      safeRemoveLS(LS_RECENT_SAVE)
      return
    }

    setRecentSave(payload)

    try {
      track('my_day.recent_save.banner_show', {
        dateKey,
        origin: payload.origin,
        source: payload.source,
      })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function closeRecentSave() {
    setRecentSave(null)
    setHighlightGroupId(undefined)
    safeRemoveLS(LS_RECENT_SAVE)

    try {
      track('my_day.recent_save.banner_close', { dateKey })
    } catch {}
  }

  function goToRecentSave() {
    if (!recentSave?.origin) return

    const gid = groupIdFromOrigin(recentSave.origin)
    setHighlightGroupId(gid)

    // scroll suave para o bloco
    const el = document.getElementById(groupDomId(gid))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    try {
      track('my_day.recent_save.banner_go', { dateKey, groupId: gid, origin: recentSave.origin })
    } catch {}

    // remove highlight após alguns segundos (sem “piscar”)
    window.setTimeout(() => {
      setHighlightGroupId(undefined)
    }, 4500)
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="
        eu360-hub-bg
        relative min-h-[100dvh] pb-24 flex flex-col overflow-hidden
      "
    >
      <div className="relative z-10 flex-1 mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            MEU DIA
          </span>

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
            Organização do seu dia
          </h1>

          <p className="mt-1 text-sm md:text-base text-white/90 max-w-xl">
            Aqui você organiza compromissos, lembretes e tudo que salvou no app — sem precisar procurar.
          </p>

          <div className="pt-4 space-y-1">
            <ClientOnly>
              <h2 className="text-[22px] md:text-[24px] font-semibold text-white">{greeting || 'Bom dia'}</h2>
            </ClientOnly>

            <p className="text-sm md:text-base text-white/95 max-w-xl">“{dailyMessage}”</p>
          </div>
        </header>

        {/* P9.3 — BANNER (legível, com CTA claro) */}
        {recentSave ? (
          <section
            className="
              mb-5
              rounded-3xl
              border border-white/40
              bg-white/14
              backdrop-blur-xl
              shadow-[0_18px_45px_rgba(0,0,0,0.18)]
              p-5
            "
          >
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-[18px] font-semibold text-white leading-tight">Salvei pra você.</h3>
                <p className="mt-1 text-[14px] text-white/90">
                  Hoje pode ser menos. O essencial já está aqui.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goToRecentSave}
                  className="
                    rounded-full
                    bg-white
                    text-[#2f3a56]
                    px-4 py-2
                    text-[14px]
                    font-semibold
                    shadow-lg
                    hover:bg-white/95
                    transition
                  "
                >
                  Ver no bloco
                </button>

                <button
                  type="button"
                  onClick={closeRecentSave}
                  className="
                    rounded-full
                    border border-white/55
                    bg-white/12
                    text-white
                    px-4 py-2
                    text-[14px]
                    font-semibold
                    hover:bg-white/18
                    transition
                  "
                >
                  Ok
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* P8 — BLOCOS ORGANIZADOS */}
        <MyDayGroups highlightGroupId={highlightGroupId} />

        {/* PLANNER (legado protegido) */}
        <section
          className="
            mt-6 md:mt-8
            rounded-3xl
            bg-white/10
            border border-white/35
            backdrop-blur-xl
            shadow-[0_18px_45px_rgba(0,0,0,0.18)]
            p-3 md:p-4
          "
        >
          <WeeklyPlannerShell />
        </section>

        {/* FOOTER MOTIVACIONAL */}
        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      {/* RODAPÉ LEGAL */}
      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-[#6A6A6A]/85">
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
