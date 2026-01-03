// app/(tabs)/maternar/meu-filho/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

import {
  addTaskToMyDay,
  listMyDayTasks,
  MY_DAY_SOURCES,
  type MyDayTaskItem,
} from '@/app/lib/myDayTasks.client'

import { markJourneyFamilyDone } from '@/app/lib/journey.client'
import {
  getActiveChildOrNull,
  getProfileSnapshot,
  type ProfileSource,
} from '@/app/lib/profile.client'

import { safeMeuFilhoBloco1Text } from '@/app/lib/ai/validators/bloco1'

import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'brincadeiras' | 'desenvolvimento' | 'rotina' | 'conexao'
type TimeMode = '5' | '10' | '15'
type AgeBand = '0-2' | '3-4' | '5-6' | '6+'

type PlanItem = {
  title: string
  how: string
  time: TimeMode
  tag: string
}

type Kit = {
  id: string
  title: string
  subtitle: string
  time: TimeMode
  plan: { a: PlanItem; b: PlanItem; c: PlanItem }
  development: { label: string; note: string }
  routine: { label: string; note: string }
  connection: { label: string; note: string }
}

const LS_PREFIX = 'm360:'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
    window.localStorage.setItem(key, value)
  } catch {}
}

function stepIndex(s: Step) {
  return s === 'brincadeiras' ? 1 : s === 'desenvolvimento' ? 2 : s === 'rotina' ? 3 : 4
}

function timeLabel(t: TimeMode) {
  return t === '5' ? '5 min' : t === '10' ? '10 min' : '15 min'
}

function timeTitle(t: TimeMode) {
  return t === '5' ? 'Ligação rápida' : t === '10' ? 'Presença prática' : 'Momento completo'
}

function timeHint(t: TimeMode) {
  return t === '5'
    ? 'Para quando você só precisa conectar e seguir.'
    : t === '10'
    ? 'Para quando dá para brincar sem complicar.'
    : 'Para fechar o dia com presença.'
}

/* =========================
   BLOCO 1 — Fallback local
========================= */

const BLOCO1_FALLBACK: Record<AgeBand, Record<TimeMode, string>> = {
  '0-2': {
    '5': 'Sente no chão com ele e faça três gestos simples para ele copiar. Repita cada um duas vezes e comemore com um sorriso. No final, abrace e diga que agora vão guardar.',
    '10': 'Faça um caminho curto com almofadas e atravessem juntos três vezes. Em cada volta, nomeie um movimento. No final, guardem uma almofada por vez lado a lado.',
    '15': 'Separe cinco itens seguros da casa e explore um por um com ele. Repita os que ele mais gostar e mantenha o ritmo curto. No final, guardem tudo juntos e abrace.',
  },
  '3-4': {
    '5': 'Escolham três objetos da casa para procurar juntos. Cada achado vira uma pequena comemoração. No final, guardem tudo lado a lado.',
    '10': 'Crie uma pista simples no chão e façam duas rodadas juntos. Na última, ele escolhe um movimento para você copiar. No final, guardem e abracem.',
    '15': 'Faça uma missão com três tarefas rápidas: buscar, entregar e organizar um cantinho. Narre como aventura. No final, guardem juntos e diga missão cumprida.',
  },
  '5-6': {
    '5': 'Faça duas perguntas curtas sobre o dia e escute sem corrigir. Depois, escolham um desafio rápido de um minuto. No final, abrace e agradeça.',
    '10': 'Monte um circuito com três movimentos e façam duas rodadas. Na segunda, ele escolhe a ordem. No final, guardem algo juntos e elogie o esforço.',
    '15': 'Brinquem dez minutos de algo simples que ele escolha. Depois, ajude cinco minutos em uma tarefa pequena. No final, agradeça e abrace.',
  },
  '6+': {
    '5': 'Pergunte de zero a dez como foi o dia e escute inteiro. Façam dois minutos de alongamento e dois de respiração juntos. No final, combinem o próximo passo.',
    '10': 'Faça duas perguntas objetivas e deixe ele escolher uma atividade rápida. Depois, organizem um cantinho com música. No final, agradeça.',
    '15': 'Deixe ele escolher dez minutos de algo simples para fazerem lado a lado. Em seguida, organizem cinco minutos o espaço. No final, reconheça o esforço.',
  },
}

/* =========================
   BLOCO 1 — Fetch IA
========================= */

async function fetchBloco1Plan(args: { tempoDisponivel: number }): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/rotina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        feature: 'quick-ideas',
        origin: 'maternar/meu-filho',
        tempoDisponivel: args.tempoDisponivel,
        comQuem: 'eu-e-meu-filho',
        tipoIdeia: 'meu-filho-bloco-1',
      }),
    })

    if (!res.ok) return null

    const data = (await res.json().catch(() => null)) as
      | { suggestions?: { description?: string }[] }
      | null

    const desc = data?.suggestions?.[0]?.description
    const cleaned = safeMeuFilhoBloco1Text(desc)

    if (!cleaned) return null
    return cleaned
  } catch {
    return null
  }
}

/* =========================
   COMPONENT
========================= */

export default function MeuFilhoClient() {
  const [step, setStep] = useState<Step>('brincadeiras')
  const [time, setTime] = useState<TimeMode>('15')
  const [age, setAge] = useState<AgeBand>('3-4')

  const [bloco1Text, setBloco1Text] = useState<string | null>(null)
  const bloco1ReqSeq = useRef(0)

  useEffect(() => {
    const seq = ++bloco1ReqSeq.current
    setBloco1Text(null)

    async function run() {
      const ai = await fetchBloco1Plan({ tempoDisponivel: Number(time) })
      if (seq !== bloco1ReqSeq.current) return

      if (ai) {
        setBloco1Text(ai)
        track('meu_filho.bloco1.done', { source: 'ai', time, age })
        return
      }

      const fb = BLOCO1_FALLBACK[age][time]
      setBloco1Text(fb)
      track('meu_filho.bloco1.done', { source: 'fallback', time, age })
    }

    run()
  }, [time, age])

  return (
    <main className="min-h-screen bg-[#ffe1f1]">
      <ClientOnly>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-semibold text-white mb-4">Meu Filho</h1>

          <SoftCard className="p-5 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
              <span className="text-sm font-semibold text-[#b8236b]">
                Plano pronto para agora
              </span>
            </div>

            <div className="text-[#2f3a56] font-semibold text-sm leading-relaxed">
              {bloco1Text ?? 'Gerando um plano para agora…'}
            </div>
          </SoftCard>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
