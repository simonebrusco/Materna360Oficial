// app/(tabs)/maternar/minha-jornada/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { load, save } from '@/app/lib/persist'

import {
  resolveMinhaJornadaState,
  type MinhaJornadaRecord,
  type MinhaJornadaState,
} from './state'

import ContextBlock from '@/components/minha-jornada/ContextBlock'
import RecordsBlock from '@/components/minha-jornada/RecordsBlock'
import ReflectiveReading from '@/components/minha-jornada/ReflectiveReading'
import PresenceMark from '@/components/minha-jornada/PresenceMark'
import ClosingBlock from '@/components/minha-jornada/ClosingBlock'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * P33.8 — Minha Jornada (Camada 3)
 * - Leitura do vivido, sem ação
 * - Sem comparação, sem métrica, sem “progresso”
 * - IA apenas como espelho descritivo
 * - Usa apenas dados existentes (se houver), sem criar novos fluxos
 */

const LS_CONQUESTS = 'minha-jornada:conquests:v1'
const LS_MEMORIES = 'minha-jornada:memories:v1'
const PERSIST_TIMELINE = 'minha-jornada:timeline'

// controle interno (não UI)
const PERSIST_LAST_VISIT = 'm360.minha_jornada.last_visit_datekey.v1'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function normalizeRecordsFromExistingSources(): MinhaJornadaRecord[] {
  const out: MinhaJornadaRecord[] = []

  // 1) Timeline (persist) — formato legado: Record<string, { humor?; energia?; nota? }>
  try {
    const rawTimeline = load<unknown>(PERSIST_TIMELINE, null)
    if (rawTimeline && typeof rawTimeline === 'object') {
      const obj = rawTimeline as Record<string, any>
      for (const [dayKey, v] of Object.entries(obj)) {
        const note = typeof v?.nota === 'string' ? v.nota.trim() : ''
        if (!note) continue

        // timestamp neutro: dia em horário local 00:00
        const ts = `${dayKey}T00:00:00.000Z`
        out.push({
          id: `timeline:${dayKey}`,
          kind: 'note',
          text: note,
          timestamp: ts,
        })
      }
    }
  } catch {}

  // 2) Conquests (localStorage) — legado: [{ id, description, timestamp, icon }]
  try {
    const raw = safeGetLS(LS_CONQUESTS)
    const parsed = safeParseJSON<any[]>(raw) ?? []
    for (const it of parsed) {
      const desc = typeof it?.description === 'string' ? it.description.trim() : ''
      const ts = typeof it?.timestamp === 'string' ? it.timestamp : ''
      const id = typeof it?.id === 'string' ? it.id : ''
      if (!desc || !ts) continue

      out.push({
        id: `conquest:${id || ts}`,
        kind: 'memory',
        text: desc,
        timestamp: ts,
      })
    }
  } catch {}

  // 3) Memories (localStorage) — legado: [{ id, description, timestamp, day? }]
  try {
    const raw = safeGetLS(LS_MEMORIES)
    const parsed = safeParseJSON<any[]>(raw) ?? []
    for (const it of parsed) {
      const desc = typeof it?.description === 'string' ? it.description.trim() : ''
      const ts = typeof it?.timestamp === 'string' ? it.timestamp : ''
      const id = typeof it?.id === 'string' ? it.id : ''
      if (!desc || !ts) continue

      out.push({
        id: `mem:${id || ts}`,
        kind: 'memory',
        text: desc,
        timestamp: ts,
      })
    }
  } catch {}

  // ordem temporal simples (quando aconteceu) — mais recente primeiro
  return out
    .filter(r => !!r.text?.trim() && !!r.timestamp)
    .sort((a, b) => {
      const ta = Date.parse(a.timestamp)
      const tb = Date.parse(b.timestamp)
      const na = Number.isFinite(ta) ? ta : 0
      const nb = Number.isFinite(tb) ? tb : 0
      return nb - na
    })
}

export default function MinhaJornadaClient() {
  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const [records, setRecords] = useState<MinhaJornadaRecord[]>([])
  const [state, setState] = useState<MinhaJornadaState>('first_access')

  useEffect(() => {
    try {
      const existing = normalizeRecordsFromExistingSources()
      setRecords(existing)

      const last = load<string | null>(PERSIST_LAST_VISIT, null)
      const resolved = resolveMinhaJornadaState({
        todayKey,
        records: existing,
        lastVisitKey: typeof last === 'string' ? last : null,
      })
      setState(resolved)

      // marca visita (sem UI, sem efeito comportamental)
      save(PERSIST_LAST_VISIT, todayKey)
    } catch {
      setRecords([])
      setState('first_access')
    }
  }, [todayKey])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#ff005e_0%,#ff005e_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          {/* HERO (sem “como usar”, sem CTA) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Minha Jornada
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um espaço de leitura do vivido.
              </p>
            </div>
          </header>

          <Reveal>
            <section
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                overflow-hidden
              "
            >
              <div className="p-4 md:p-6 space-y-4 md:space-y-5">
                <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                  <ContextBlock state={state} />
                </SoftCard>

                <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                  <RecordsBlock state={state} records={records} />
                </SoftCard>

                <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                  <ReflectiveReading state={state} records={records} />
                </SoftCard>

                <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                  <PresenceMark todayKey={todayKey} state={state} records={records} />
                </SoftCard>

                <SoftCard className="p-5 md:p-6 rounded-2xl bg-white/95 border border-[#f5d7e5] shadow-[0_6px_18px_rgba(184,35,107,0.09)]">
                  <ClosingBlock />
                </SoftCard>
              </div>
            </section>
          </Reveal>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
