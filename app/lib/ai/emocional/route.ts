import { NextResponse } from 'next/server'
import { buildWeeklyInsight, type WeeklyInsightContext } from '@/app/lib/ai/weeklyInsight'
import { isAiEnabled } from '@/app/lib/ai/aiFlags'
import { track } from '@/app/lib/telemetry'

export const dynamic = 'force-dynamic'

type Body = {
  feature?: string
  origin?: string
  context?: WeeklyInsightContext
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    // Telemetria mínima (sem conteúdo sensível)
    try {
      track('ai.request', {
        feature: body?.feature ?? 'unknown',
        origin: body?.origin ?? 'unknown',
        enabled: isAiEnabled(),
      })
    } catch {}

    // Feature flag: se desligado, devolve insight determinístico (fallback “inteligente”)
    const ctx = (body?.context ?? {}) as WeeklyInsightContext

    const weeklyInsight = buildWeeklyInsight(ctx)

    const latencyMs = Date.now() - t0
    try {
      track('ai.response', {
        feature: body?.feature ?? 'unknown',
        origin: body?.origin ?? 'unknown',
        latencyMs,
        mode: isAiEnabled() ? 'progressive' : 'fallback',
      })
    } catch {}

    return NextResponse.json({ weeklyInsight })
  } catch (e) {
    const latencyMs = Date.now() - t0
    try {
      track('ai.response', { latencyMs, ok: false })
    } catch {}

    // fallback de emergência (nunca quebra UI)
    return NextResponse.json(
      {
        weeklyInsight: {
          title: 'Seu resumo emocional da semana',
          summary:
            'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Um passo por vez já é muito.',
          suggestions: [
            'Escolha uma prioridade mínima para hoje.',
            'Se algo não for para agora, adie sem culpa.',
          ],
        },
      },
      { status: 200 },
    )
  }
}
