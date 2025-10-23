import { cookies } from 'next/headers'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { trackTelemetry } from '@/app/lib/telemetry'

const PLANNER_COOKIE = 'materna360-planner'

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

const VALID_CATEGORIES = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'] as const

type PlannerPayload = {
  id: string
  title: string
  dateISO: string
  timeISO: string
  category: (typeof VALID_CATEGORIES)[number]
  link?: string
  payload?: unknown
  tags?: string[]
  createdAt: string
}

type PlannerCookieShape = Record<string, PlannerPayload[]>

const parseCookie = (value?: string | null): PlannerCookieShape => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value) as PlannerCookieShape
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('Falha ao ler cookie do planner:', error)
  }

  return {}
}

const isValidDateISO = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const isValidTimeISO = (value: string) => /^\d{2}:\d{2}$/.test(value)

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const dateISO = typeof body?.dateISO === 'string' ? body.dateISO : ''
  const timeISO = typeof body?.timeISO === 'string' ? body.timeISO : ''
  const category = body?.category

  if (!title) {
    return NextResponse.json({ error: 'Informe um título.' }, { status: 400 })
  }

  if (!isValidDateISO(dateISO)) {
    return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
  }

  if (!isValidTimeISO(timeISO)) {
    return NextResponse.json({ error: 'Horário inválido.' }, { status: 400 })
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 })
  }

  const tags = Array.isArray(body?.tags)
    ? body.tags
        .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag: string) => tag.length > 0)
    : []

  const payload: PlannerPayload = {
    id: createId(),
    title,
    dateISO,
    timeISO,
    category,
    link: typeof body?.link === 'string' ? body.link.trim() || undefined : undefined,
    payload: body?.payload ?? undefined,
    tags,
    createdAt: new Date().toISOString(),
  }

  const cookieStore = cookies()
  const existingRaw = cookieStore.get(PLANNER_COOKIE)?.value
  const plannerMap = parseCookie(existingRaw)

  plannerMap[dateISO] = [payload, ...(plannerMap[dateISO] ?? [])].slice(0, 20)

  cookieStore.set({
    name: PLANNER_COOKIE,
    value: JSON.stringify(plannerMap),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  trackTelemetry('planner.save', { category })

  return NextResponse.json({ id: payload.id })
}
