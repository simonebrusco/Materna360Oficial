// app/api/planner/add/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { trackTelemetry } from '@/app/lib/telemetry'
import {
  PLANNER_COOKIE_NAME,
  buildPlannerPayload,
  mergePlannerPayload,
  parsePlannerCookie,
  saveToPlannerSafe,
} from '@/app/lib/plannerServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PlannerBody = {
  payload?: unknown
  // demais campos aceitos por buildPlannerPayload podem existir aqui
}

export async function POST(request: Request) {
  // 1) Ler e validar JSON do corpo
  let body: PlannerBody = {}
  try {
    body = (await request.json()) as PlannerBody
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  // 2) Validar e salvar de forma segura no “servidor” (ex.: gerar ID/normalizar)
  const plannerValidation = await saveToPlannerSafe(body?.payload)
  if (!plannerValidation.ok) {
    return NextResponse.json({ error: plannerValidation.reason }, { status: 400 })
  }

  // 3) Montar payload final (inclui o item validado)
  let payload: any
  try {
    payload = buildPlannerPayload(body, { plannerItem: plannerValidation.item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dados inválidos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // 4) Mesclar no cookie existente
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
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      path: '/',
    })
  } catch {
    // Se por algum motivo o set do cookie falhar, não derruba a requisição.
    // (A persistência em memória/DB via saveToPlannerSafe já ocorreu)
  }

  // 5) Telemetria (no-op em dev/prod sem provedor)
  trackTelemetry('planner.add', { category: payload?.category })

  // 6) Resposta OK
  return NextResponse.json({ id: payload?.id }, { status: 200 })
}
