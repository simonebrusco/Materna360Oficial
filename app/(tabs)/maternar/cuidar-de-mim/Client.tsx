'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Energia = 'baixa' | 'media' | 'alta'
type Emocao = 'neutra' | 'sensivel' | 'tensa' | 'carente'
type Corpo = 'tenso' | 'cansado' | 'ok' | 'pedindo-pausa'

type Suggestion = {
  id: string
  title: string
  subtitle: string
  body: string
}

const DAILY_SUGGESTIONS: Suggestion[] = [
  {
    id: 'pausa-silencio',
    title: 'Pausa sem explicação',
    subtitle: 'Permissão para não responder nada agora.',
    body: 'Fique aí por alguns instantes.\nSolte os ombros.\nRespire do jeito que vier.\nIsso já é suficiente.',
  },
  {
    id: 'respirar-curto',
    title: 'Respirar por alguns instantes',
    subtitle: 'Só um pequeno intervalo para baixar o volume.',
    body: 'Inspire devagar.\nSolte mais devagar.\nRepita 3 vezes.\nSem corrigir nada. Só presença.',
  },
  {
    id: 'corpo-apoio',
    title: 'Sentir o corpo',
    subtitle: 'Apoie os pés no chão e solte os ombros.',
    body: 'Apoie os pés.\nSolte a mandíbula.\nDeixe o peito baixar um pouco.\nPor alguns instantes já está bom.',
  },
  {
    id: 'nao-agora',
    title: 'Não fazer nada agora',
    subtitle: 'Ficar aqui já é suficiente.',
    body: 'Não precisa decidir nada.\nNão precisa escolher nada.\nSó fique por um momento.\nIsso já conta.',
  },
]

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeDelLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// hash simples, auditável
function hashStringToInt(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function rotate<T>(arr: T[], by: number) {
  if (arr.length === 0) return arr
  const n = ((by % arr.length) + arr.length) % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function splitLines(s: string) {
  return s.split('\n').map((x) => x.trim()).filter(Boolean)
}

export default function Client() {
  // CAMADA 2 — check-in opcional, fragmentável, sem validação
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [emocao, setEmocao] = useState<Emocao | null>(null)
  const [corpo, setCorpo] = useState<Corpo | null>(null)

  // CAMADA 3 — deck determinístico diário + anti-repetição real
  const [cursor, setCursor] = useState(0)
  const [seen, setSeen] = useState<string[]>([])

  // CAMADA 4/5 — estado de experiência única
  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)

  const todayKey = useMemo(() => getTodayKey(), [])
  const seed = useMemo(() => hashStringToInt(todayKey), [todayKey])

  const LS_CURSOR = `cuidar_de_mim_cursor_${todayKey}`
  const LS_SEEN = `cuidar_de_mim_seen_${todayKey}`
  const LS_CHECKIN = `cuidar_de_mim_checkin_${todayKey}`

  useEffect(() => {
    // init determinístico diário + persistência local (cursor/seen)
    const storedCursor = parseInt(safeGetLS(LS_CURSOR) ?? '0', 10)
    const storedSeen = parseJSON<string[]>(safeGetLS(LS_SEEN), [])
    setCursor(Number.isFinite(storedCursor) ? storedCursor : 0)
    setSeen(Array.isArray(storedSeen) ? storedSeen : [])

    // restore check-in do dia (invisível, sem feedback)
    const storedCheckin = parseJSON<{
      ritmo: Ritmo | null
      energia: Energia | null
      emocao: Emocao | null
      corpo: Corpo | null
    }>(safeGetLS(LS_CHECKIN), { ritmo: null, energia: null, emocao: null, corpo: null })

    setRitmo(storedCheckin.ritmo ?? null)
    setEnergia(storedCheckin.energia ?? null)
    setEmocao(storedCheckin.emocao ?? null)
    setCorpo(storedCheckin.corpo ?? null)
  }, [LS_CURSOR, LS_SEEN, LS_CHECKIN])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day: todayKey })
    } catch {}
  }, [todayKey])

  // persist check-in silencioso (sem mensagens)
  useEffect(() => {
    safeSetLS(
      LS_CHECKIN,
      JSON.stringify({
        ritmo,
        energia,
        emocao,
        corpo,
      })
    )
  }, [LS_CHECKIN, ritmo, energia, emocao, corpo])

  const deck = useMemo(() => {
    const start = seed % (DAILY_SUGGESTIONS.length || 1)
    return rotate(DAILY_SUGGESTIONS, start)
  }, [seed])

  const suggestion = useMemo(() => {
    if (deck.length === 0) return null

    // encontra a próxima sugestão não vista hoje a partir do cursor
    const len = deck.length
    for (let step = 0; step < len; step++) {
      const idx = (cursor + step) % len
      const s = deck[idx]
      if (!seen.includes(s.id)) return s
    }

    // se todas foram vistas, volta a permitir (mecânica interna; sem UI)
    return deck[cursor % len]
  }, [deck, cursor, seen])

  function persistCursor(next: number) {
    setCursor(next)
    safeSetLS(LS_CURSOR, String(next))
  }

  function persistSeen(nextSeen: string[]) {
    setSeen(nextSeen)
    safeSetLS(LS_SEEN, JSON.stringify(nextSeen))
  }

  function nextOption() {
    if (!deck.length) return

    const len = deck.length
    let nextCursor = (cursor + 1) % len

    // tenta achar não vista
    let found = false
    for (let step = 0; step < len; step++) {
      const idx = (cursor + 1 + step) % len
      const s = deck[idx]
      if (!seen.includes(s.id)) {
        nextCursor = idx
        found = true
        break
      }
    }

    // se não achou nenhuma (todas vistas), reseta seen do dia e avança
    if (!found) {
      persistSeen([])
      nextCursor = (cursor + 1) % len
    }

    persistCursor(nextCursor)

    try {
      track('cuidar_de_mim.other_option', { day: todayKey })
    } catch {}
  }

  function openSuggestion(s: Suggestion) {
    setActive(s)

    // marca como vista hoje (anti-repetição real)
    if (!seen.includes(s.id)) {
      const nextSeen = [...seen, s.id]
      persistSeen(nextSeen)
    }

    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id, day: todayKey })
    } catch {}
  }

  function closeHere() {
    setClosed(true)
    setActive(null)
    try {
      track('cuidar_de_mim.close', { day: todayKey })
    } catch {}
  }

  function backToPossibilities() {
    setClosed(false)
    setActive(null)
    try {
      track('c
