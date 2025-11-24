import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { track } from '@/app/lib/telemetry'
import {
  PLANNER_COOKIE_NAME,
  buildPlannerPayload,
  mergePlannerPayload,
  parsePlannerCookie,
  saveToPlannerSafe,
} from '@/app/lib/plannerServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PlannerBody = { payload?: unknown }

export async function POST(request: Request) {
  // 1) JSON do corpo
  let body: PlannerBody = {}
  try {
    body = (await request.json()) as PlannerBody
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  // 2) Validar e normalizar item
  const plannerValidation = await saveToPlannerSafe(body?.payload)
  if (!plannerValidation.ok) {
    return NextResponse.json({ error: plannerValidation.reason }, { status: 400 })
  }

  // 3) Montar payload final
  let payload: any
  try {
    payload = buildPlannerPayload(body, { plannerItem: plannerValidation.item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dados inválidos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // 4) Mesclar cookie (não derruba a request se falhar)
  try {
    const cookieStore = cookies()
    const existingRaw = cookieStore.get(PLANNER_COOKIE_NAME)?.value
    const plannerMap = parsePlannerCookie(existingRaw)
    const nextMap = mergePlannerPayload(plannerMap, payload)
    cookieStore.set({
      name: PLANNER_COOKIE_NAME,
      value: JSON.stringify(nextMap),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  } catch {
    // silencioso
  }

  // 5) Telemetria
  track('todos.add', { category: payload?.category })

  // 6) OK
  return NextResponse.json({ id: payload?.id }, { status: 200 })
}
