'use client'

import * as React from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { BookmarkCheck, CalendarClock, Bell, Activity } from 'lucide-react'
import { SectionH2 } from '@/components/common/Headings'

type Highlight =
  | { id: 'saved'; title: string; subtitle: string; href: string; priority: number }
  | { id: 'appt'; title: string; subtitle: string; href: string; priority: number }
  | { id: 'reminder'; title: string; subtitle: string; href: string; priority: number }
  | { id: 'mood'; title: string; subtitle: string; href: string; priority: number }

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function HighlightsSection() {
  const [items, setItems] = React.useState<Highlight[] | null>(null)

  React.useEffect(() => {
    const dateKey = getBrazilDateKey()

    // Saved ideas
    const savedA = safeParse<string[]>(localStorage.getItem('descobrir:saved')) ?? []
    const savedB = safeParse<string[]>(localStorage.getItem('m360:saved:discover')) ?? []
    const savedTotal = new Set([...(savedA ?? []), ...(savedB ?? [])]).size

    // Appointments
    type Appt = { id: string; kind: 'vaccine' | 'consult'; title: string; date: string }
    const appts = (safeParse<Appt[]>(localStorage.getItem('cuidar:appointments')) ?? [])
      .filter(a => a?.date)
      .sort((a, b) => a.date.localeCompare(b.date))
    const nextAppt = appts.find(a => new Date(a.date).getTime() >= Date.now())

    // Reminders
    type Rem = { id: string; title: string; when: string }
    const reminders =
      safeParse<Rem[]>(localStorage.getItem(`meu-dia:${dateKey}:reminders`)) ?? []
    const dueSoon = reminders.find(r => r?.when)

    // Mood
    type Mood = { date: string; mood: number; energy: number }
    const moodAll = safeParse<Mood[]>(localStorage.getItem('meu-dia:mood')) ?? []
    const moodToday = moodAll.find(m => m.date === dateKey)

    const highlights: Highlight[] = []
    if (savedTotal > 0) {
      highlights.push({
        id: 'saved',
        title: 'Ideias salvas',
        subtitle: `${savedTotal} para explorar`,
        href: '/descobrir',
        priority: 80,
      })
    }
    if (nextAppt) {
      const when = new Date(nextAppt.date).toLocaleDateString()
      highlights.push({
        id: 'appt',
        title: 'Próximo cuidado',
        subtitle: `${nextAppt.title} • ${when}`,
        href: '/cuidar',
        priority: 90,
      })
    }
    if (dueSoon) {
      const when = dueSoon.when
        ? new Date(dueSoon.when).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Hoje'
      highlights.push({
        id: 'reminder',
        title: 'Lembretes do dia',
        subtitle: `${dueSoon.title} • ${when}`,
        href: '/meu-dia',
        priority: 85,
      })
    }
    if (!moodToday) {
      highlights.push({
        id: 'mood',
        title: 'Como você está hoje?',
        subtitle: 'Registre humor e energia',
        href: '/meu-dia',
        priority: 70,
      })
    }

    highlights.sort((a, b) => b.priority - a.priority)
    setItems(highlights.slice(0, 2))
  }, [])

  if (!items || items.length === 0) return null

  const IconOf = (id: Highlight['id']) =>
    id === 'saved'
      ? BookmarkCheck
      : id === 'appt'
        ? CalendarClock
        : id === 'reminder'
          ? Bell
          : Activity

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <h3 className="text-[16px] font-semibold mb-3">Destaques do dia</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(h => {
          const Icon = IconOf(h.id)
          return (
            <Link
              key={h.id}
              href={h.href}
              onClick={() => track('nav.click', { tab: 'maternar', dest: h.href })}
              className="flex items-center gap-3 rounded-xl border px-3 py-2 hover:bg-[#ffd8e6]/20 focus:outline-none focus:ring-2 focus:ring-[#ffd8e6]"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
                <Icon className="h-4 w-4 text-[#ff005e]" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate">{h.title}</div>
                <div className="text-[12px] text-[#545454] truncate">{h.subtitle}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
