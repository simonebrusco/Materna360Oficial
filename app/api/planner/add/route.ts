import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  buildPlannerPayload,
  saveToPlannerSafe,
} from '@/app/lib/plannerServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = buildPlannerPayload(body)

    const jar = cookies()
    const supabaseToken = jar.get('sb-token')?.value ?? ''

    const result = await saveToPlannerSafe({
      supabaseToken,
      payload,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Não foi possível salvar no Planner' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('[planner/add] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar o pedido' },
      { status: 500 }
    )
  }
}
