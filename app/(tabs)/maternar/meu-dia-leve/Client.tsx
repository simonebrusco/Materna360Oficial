'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'inspiracao' | 'ideias' | 'receitas' | 'passo'
type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'
type Focus = 'casa' | 'voce' | 'filho' | 'comida'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

const LS_RECENT_SAVE = 'my_day_recent_save_v1'
const MIN_MONTHS_BLOCK = 6
const MIN_MONTHS_INTRO_START = 6
const MIN_MONTHS_ALLOW_RECIPES = 12
const LS_PREFIX = 'm360:'

type RecentSavePayload = {
  ts: number
  origin: TaskOrigin
  source: string
}

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
  } catch {}
}

function safeSetJSON(key: string, value: unknown) {
  try {
    safeSetLS(key, JSON.stringify(value))
  } catch {}
}

function safeParseJSON(raw: string | null): any | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function monthsBetween(from: Date, to: Date) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return Math.max(0, months)
}

type ChildProfile = {
  id: string
  label: string
  months: number | null
}

function inferChildrenFromEu360(): ChildProfile[] {
  if (typeof window === 'undefined') return []

  const candidates = [
    'eu360_children',
    'eu360_children_v1',
    'eu360_profile',
    'eu360_profile_v1',
    'eu360_state',
    'eu360_data',
    'eu360_form',
    'eu360_form_v1',
  ]

  const collected: any[] = []

  for (const k of candidates) {
    const obj = safeParseJSON(safeGetLS(k))
    if (!obj) continue

    const arr =
      Array.isArray(obj)
        ? obj
        : obj?.children ?? obj?.kids ?? obj?.filhos ?? obj?.data?.children

    if (Array.isArray(arr)) collected.push(...arr)
  }

  const out: ChildProfile[] = []
  let idx = 1

  for (const c of collected) {
    const id = String(c?.id ?? `child_${idx++}`)
    const name = String(c?.name ?? c?.nome ?? '').trim()

    const months =
      typeof c?.ageMonths === 'number'
        ? c.ageMonths
        : c?.birthdate
        ? monthsBetween(new Date(c.birthdate), new Date())
        : null

    out.push({
      id,
      label: name || `Filho ${out.length + 1}`,
      months,
    })
  }

  return out
}

function originFromFocus(f: Focus): TaskOrigin {
  if (f === 'filho') return 'family'
  if (f === 'voce') return 'selfcare'
  if (f === 'casa') return 'home'
  if (f === 'comida') return 'today'
  return 'other'
}

export default function MeuDiaLeveClient() {
  const [step, setStep] = useState<Step>('inspiracao')
  const [slot, setSlot] = useState<Slot>('5')
  const [mood, setMood] = useState<Mood>('corrida')
  const [focus, setFocus] = useState<Focus>('filho')

  const [children, setChildren] = useState<ChildProfile[]>([])
  const [activeChildId, setActiveChildId] = useState<string>('')

  const [pantry, setPantry] = useState('')
  const [aiRecipeText, setAiRecipeText] = useState('')
  const [aiRecipeLoading, setAiRecipeLoading] = useState(false)
  const [aiRecipeHint, setAiRecipeHint] = useState('')

  useEffect(() => {
    const kids = inferChildrenFromEu360()
    setChildren(kids)
    if (kids.length) setActiveChildId(kids[0].id)
  }, [])

  const activeChild = useMemo(
    () => children.find((c) => c.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  const activeMonths = activeChild?.months ?? null

  const gate = useMemo(() => {
    if (!children.length) {
      return {
        blocked: true,
        reason: 'no_children' as const,
        title: 'Para sugerir receitas com segurança',
        message: 'Complete o cadastro do(s) filho(s) no Eu360.',
      }
    }

    if (!activeChild || activeMonths === null) {
      return {
        blocked: true,
        reason: 'age_missing' as const,
        title: 'Para sugerir receitas com segurança',
        message: 'Complete a idade do(s) filho(s) no Eu360.',
      }
    }

    if (activeMonths < MIN_MONTHS_BLOCK) {
      return {
        blocked: true,
        reason: 'under_6' as const,
        title: 'Sem receitas por enquanto',
        message:
          'Para essa fase, aqui a gente não sugere receitas. Siga a orientação que você já usa com sua rede de saúde.',
      }
    }

    if (activeMonths < MIN_MONTHS_ALLOW_RECIPES) {
      return {
        blocked: true,
        reason: 'intro_6_11' as const,
        title: 'Introdução alimentar',
        message:
          'Entre 6 e 11 meses, as orientações variam. Aqui, por enquanto, a gente não sugere receitas.',
      }
    }

    return { blocked: false, reason: 'ok' as const, title: '', message: '' }
  }, [children.length, activeChild, activeMonths])

  async function onGenerateAIRecipe() {
    if (gate.blocked) {
      toast.info(gate.message)
      return
    }

    if (!pantry.trim()) {
      toast.info('Escreva curto o que você tem em casa.')
      return
    }

    setAiRecipeLoading(true)
    setAiRecipeText('')
    setAiRecipeHint('')

    try {
      const res = await fetch('/api/ai/meu-dia-leve/receita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot,
          mood,
          pantry,
          childAgeMonths: activeMonths,
        }),
      })

      const data = await res.json()

      if (!data?.ok || !data.text) {
        setAiRecipeHint(data?.hint || 'Se quiser, use uma opção pronta abaixo.')
        return
      }

      setAiRecipeText(data.text)
    } catch {
      setAiRecipeHint('Falhou agora. Se quiser, use uma opção pronta abaixo.')
    } finally {
      setAiRecipeLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] pb-32 bg-[#ffe1f1]">
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <section className="rounded-3xl bg-white p-5">
              {/* BLOCO DE FILHOS */}
              {children.length ? null : (
                <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                  <div className="text-[11px] font-semibold uppercase text-[#b8236b]">observação</div>
                  <div className="mt-2 text-[13px] text-[#6a6a6a]">
                    Para sugerir receitas com segurança, complete o cadastro do(s) filho(s) no Eu360.
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/eu360"
                      className="inline-flex rounded-full border border-[#f5d7e5] px-4 py-2 text-[12px]"
                    >
                      Ir para Eu360
                    </Link>
                  </div>
                </div>
              )}

              {/* GATE MESSAGE — NÃO MOSTRA QUANDO no_children */}
              {gate.blocked && gate.reason !== 'no_children' ? (
                <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                  <div className="text-[11px] font-semibold uppercase text-[#b8236b]">{gate.title}</div>
                  <div className="mt-2 text-[13px] text-[#6a6a6a]">{gate.message}</div>
                </div>
              ) : null}

              {/* INPUT */}
              <div className="mt-4">
                <textarea
                  value={pantry}
                  onChange={(e) => setPantry(e.target.value)}
                  rows={3}
                  placeholder="o que você tem em casa…"
                  className="w-full rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-3 text-[13px]"
                />

                <button
                  onClick={onGenerateAIRecipe}
                  disabled={aiRecipeLoading || gate.blocked}
                  className="mt-3 rounded-full bg-[#fd2597] px-4 py-2 text-[12px] text-white"
                >
                  {aiRecipeLoading ? 'Gerando…' : 'Gerar receita'}
                </button>
              </div>

              {aiRecipeText ? (
                <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5 whitespace-pre-wrap text-[13px]">
                  {aiRecipeText}
                </div>
              ) : null}

              {aiRecipeHint ? (
                <div className="mt-2 text-[12px] text-[#6a6a6a]">{aiRecipeHint}</div>
              ) : null}
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
