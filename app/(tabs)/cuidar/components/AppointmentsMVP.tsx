'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { CalendarPlus, CalendarClock, Syringe, Stethoscope } from 'lucide-react'

type Kind = 'vaccine' | 'consult'
type Entry = { id: string; kind: Kind; title: string; date: string; notes?: string; dateStr?: string }

type Props = { storageKey?: string }
const keyOf = (s?: string) => s ?? 'cuidar:appointments'

export function AppointmentsMVP({ storageKey }: Props) {
  const key = keyOf(storageKey)
  const [list, setList] = React.useState<Entry[]>([])
  const [title, setTitle] = React.useState('')
  const [kind, setKind] = React.useState<Kind>('vaccine')
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setList(JSON.parse(raw))
    } catch {}
  }, [key])

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(list))
    } catch {}
  }, [key, list])

  const add = () => {
    const t = title.trim()
    if (!t || !date) return
    const rec: Entry = { id: crypto.randomUUID(), kind, title: t, date }
    setList((prev) => [rec, ...prev])
    track('care.appointment_add', { tab: 'cuidar', type: kind, date })
    setTitle('')
    setDate('')
  }

  const [displayData, setDisplayData] = React.useState<{
    upcoming: (Entry & { dateStr: string })[]
    past: (Entry & { dateStr: string })[]
  }>({ upcoming: [], past: [] })

  // Format dates on client after mount
  React.useEffect(() => {
    const withDates = list.map(e => ({
      ...e,
      dateStr: new Date(e.date).toLocaleDateString()
    }))

    const upcoming = withDates
      .filter((e) => new Date(e.date).getTime() >= Date.now())
      .sort((a, b) => a.date.localeCompare(b.date))

    const past = withDates
      .filter((e) => new Date(e.date).getTime() < Date.now())
      .sort((a, b) => b.date.localeCompare(a.date))

    setDisplayData({ upcoming, past })
  }, [list])

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5" suppressHydrationWarning>
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <CalendarPlus className="h-4 w-4 text-[#ff005e]" aria-hidden />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold">Vacinas &amp; Consultas</h3>
          <p id="ap-desc" className="text-[12px] text-[#545454]">
            Registre e visualize seus próximos cuidados
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        role="group"
        aria-describedby="ap-desc"
        className="grid gap-2 mb-3 md:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          className="rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          placeholder="Título (ex.: Influenza, Pediatra…)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          name="title"
        />
        <select
          className="rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          name="kind"
          aria-label="Tipo do cuidado"
        >
          <option value="vaccine">Vacina</option>
          <option value="consult">Consulta</option>
        </select>
        <input
          type="date"
          className="rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          name="date"
        />
        <button
          type="button"
          className="rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium hover:opacity-95 active:scale-[0.99]"
          onClick={add}
        >
          Adicionar
        </button>
      </div>

      {/* Próximos */}
      <section className="mb-4">
        <h4 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#2f3a56]" /> Próximos
        </h4>
        <ul className="flex flex-col gap-2">
          {displayData.upcoming.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
              <div className="flex items-center gap-2">
                {e.kind === 'vaccine' ? (
                  <Syringe className="h-4 w-4 text-[#2f3a56]" />
                ) : (
                  <Stethoscope className="h-4 w-4 text-[#2f3a56]" />
                )}
                <div>
                  <div className="text-[14px] font-medium">{e.title}</div>
                  <div className="text-[12px] text-[#545454]">
                    {e.dateStr}
                  </div>
                </div>
              </div>
              <span className="rounded-full border px-2 py-0.5 text-[11px]">Agendado</span>
            </li>
          ))}
          {displayData.upcoming.length === 0 && (
            <li className="text-[12px] text-[#545454]">Sem registros futuros.</li>
          )}
        </ul>
      </section>

      {/* Passados */}
      <section>
        <h4 className="text-[14px] font-semibold mb-2">Passados</h4>
        <ul className="flex flex-col gap-2">
          {displayData.past.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
              <div className="flex items-center gap-2">
                {e.kind === 'vaccine' ? (
                  <Syringe className="h-4 w-4 text-[#2f3a56]" />
                ) : (
                  <Stethoscope className="h-4 w-4 text-[#2f3a56]" />
                )}
                <div>
                  <div className="text-[14px] font-medium">{e.title}</div>
                  <div className="text-[12px] text-[#545454]">
                    {e.dateStr}
                  </div>
                </div>
              </div>
              <span className="rounded-full border px-2 py-0.5 text-[11px] bg-[#ffd8e6]/60">
                Concluído
              </span>
            </li>
          ))}
          {displayData.past.length === 0 && <li className="text-[12px] text-[#545454]">Sem registros passados.</li>}
        </ul>
      </section>
    </div>
  )
}
