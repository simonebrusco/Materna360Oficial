'use client'

import * as React from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Clock4, ListChecks, Bell, Activity } from 'lucide-react'

type Resume =
  | { kind: 'todos'; label: string; href: string; updatedAt: number }
  | { kind: 'reminder'; label: string; href: string; updatedAt: number }
  | { kind: 'mood'; label: string; href: string; updatedAt: number }

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function pickLatest(dateKey: string, now: number): Resume | null {
  const todos = safeParse<{ id: string; text: string; done: boolean }[]>(
    localStorage.getItem(`meu-dia:${dateKey}:todos`)
  )
  const rems = safeParse<{ id: string; title: string; when: string }[]>(
    localStorage.getItem(`meu-dia:${dateKey}:reminders`)
  )
  const moods = safeParse<{ date: string; mood: number; energy: number }[]>(
    localStorage.getItem('meu-dia:mood')
  )

  const candidates: Resume[] = []

  if (todos && todos.length) {
    candidates.push({
      kind: 'todos',
      label: 'Continuar sua lista do dia',
      href: '/meu-dia',
      updatedAt: now - 1,
    })
  }
  if (rems && rems.length) {
    candidates.push({
      kind: 'reminder',
      label: 'Ver seus lembretes de hoje',
      href: '/meu-dia',
      updatedAt: now - 2,
    })
  }
  if (moods && moods.length) {
    const today = moods.find((m) => m.date === dateKey)
    if (today) {
      candidates.push({
        kind: 'mood',
        label: 'Registrar seu humor/energia',
        href: '/meu-dia',
        updatedAt: now - 3,
      })
    }
  }

  if (!candidates.length) return null
  return candidates.sort((a, b) => b.updatedAt - a.updatedAt)[0]
}

export function ContinueCard({ dateKey }: { dateKey: string }) {
  const [resume, setResume] = React.useState<Resume | null>(null)

  React.useEffect(() => {
    try {
      setResume(pickLatest(dateKey, Date.now()))
    } catch {
      setResume(null)
    }
  }, [dateKey])

  if (!resume) return null

  const Icon =
    resume.kind === 'todos' ? ListChecks : resume.kind === 'reminder' ? Bell : Activity

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]/60">
          <Icon className="h-4 w-4 text-[var(--color-brand)]" aria-hidden />
        </div>
        <h3 className="text-[16px] font-semibold">Continue de onde parou</h3>
      </div>
      <p className="text-[14px] text-[var(--color-text-main)] mb-3">{resume.label}</p>
      <Link
        href={resume.href}
        onClick={() => track('nav.click', { tab: 'maternar', dest: resume.href })}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-[var(--color-brand)] text-white font-medium hover:opacity-95 active:scale-[0.99]"
      >
        <Clock4 className="h-4 w-4" aria-hidden /> Retomar agora
      </Link>
    </div>
  )
}
