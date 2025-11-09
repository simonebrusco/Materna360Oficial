'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { Smile, Meh, Frown, Activity } from 'lucide-react'

type Entry = { date: string; mood: number; energy: number }
type Props = { dateKey: string; storageKey?: string }

const MAX_DAYS = 7

export function MoodEnergyCheckin({ dateKey, storageKey = 'meu-dia:mood' }: Props) {
  const [mood, setMood] = React.useState<number | null>(null)
  const [energy, setEnergy] = React.useState<number | null>(null)
  const [history, setHistory] = React.useState<Entry[]>([])

  const key = storageKey

  // Load
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [key])

  // Persist
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(history))
    } catch {}
  }, [key, history])

  const save = (m: number, e: number) => {
    const next = [{ date: dateKey, mood: m, energy: e }, ...history.filter(h => h.date !== dateKey)]
      .slice(0, 28) // keep some history
    setHistory(next)
    track('mood.checkin', { tab: 'meu-dia', mood: m, energy: e, date: dateKey })
  }

  const commitIfReady = (m: number | null, e: number | null) => {
    if (m != null && e != null) save(m, e)
  }

  // Sparkline data (last 7 days, newest first in history)
  const last7 = [...history]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_DAYS)
    .reverse()

  const points = last7.map((h, idx) => {
    // normalize mood 1..3 and energy 1..3 into 0..100
    const v = (h.mood + h.energy - 2) / 4 // min 0, max 1
    return { x: idx, y: Math.round(100 - v * 100) }
  })

  const width = 140
  const height = 36
  const step = points.length > 1 ? width / (points.length - 1) : width

  const polyPoints =
    points.length > 0
      ? points.map((p, i) => `${i * step},${p.y}`).join(' ')
      : ''

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <Activity className="h-4 w-4 text-[#ff005e]" aria-hidden />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold">Como você está hoje?</h3>
          <p className="text-[12px] text-[#545454]">Registre seu humor e energia</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <fieldset>
          <legend className="text-[12px] text-[#545454] mb-1">Humor</legend>
          <div className="flex gap-2">
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${mood===1 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setMood(1); commitIfReady(1, energy) }}>
              <Frown className="h-4 w-4 inline" /> Baixo
            </button>
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${mood===2 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setMood(2); commitIfReady(2, energy) }}>
              <Meh className="h-4 w-4 inline" /> Médio
            </button>
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${mood===3 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setMood(3); commitIfReady(3, energy) }}>
              <Smile className="h-4 w-4 inline" /> Alto
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] text-[#545454] mb-1">Energia</legend>
          <div className="flex gap-2">
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${energy===1 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setEnergy(1); commitIfReady(mood, 1) }}>
              Baixa
            </button>
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${energy===2 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setEnergy(2); commitIfReady(mood, 2) }}>
              Média
            </button>
            <button type="button" className={`rounded-xl border px-3 py-2 text-[12px] hover:bg-[#ffd8e6]/40 ${energy===3 ? 'bg-[#ffd8e6]/60' : ''}`} onClick={() => { setEnergy(3); commitIfReady(mood, 3) }}>
              Alta
            </button>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#545454]">Últimos 7 dias</p>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Sparkline 7 dias">
          <polyline
            points={polyPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[#2f3a56]"
          />
        </svg>
      </div>
    </div>
  )
}
