import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { trackTelemetry } from '@/app/lib/telemetry'
import {
  PLANNER_COOKIE_NAME,
  buildPlannerPayload,
  mergePlannerPayload,
  parsePlannerCookie,
} from '@/app/lib/plannerServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  let payload
  try {
    payload = buildPlannerPayload(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dados inválidos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

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

  trackTelemetry('planner.save', { category: payload.category })

  return NextResponse.json({ id: payload.id })
}
