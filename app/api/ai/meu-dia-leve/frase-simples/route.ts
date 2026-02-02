// app/api/ai/meu-dia-leve/frase-simples/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Focus = 'filho' | 'casa' | 'comida' | 'voce'

type Body = {
  slot?: Slot
  focus?: Focus
  avoidIds?: string[]
  count?: number // opcional (default 1)
}

type ApiResponse =
  | {
      ok: true
      meta?: { source: 'adm'; poolSize: number; returnedCount: number; exhausted: boolean; avoidCount: number }
      items: Array<{ id: string; title: string; how: string; slot: Slot; focus: Focus }>
    }
  | { ok: false; error: string }

function isSlot(v: any): v is Slot {
  return v === '3' || v === '5' || v === '10'
}

function isFocus(v: any): v is Focus {
  return v === 'filho' || v === 'casa' || v === 'comida' || v === 'voce'
}

// Fisher–Yates (in-place)
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const slot = String(body?.slot ?? '') as Slot
    const focus = String(body?.focus ?? '') as Focus
    const avoidIds = (Array.isArray(body?.avoidIds) ? body.avoidIds : []).map((x) => String(x))

    const countRaw = Number(body?.count ?? 1)
    const count = Number.isFinite(countRaw) ? Math.max(1, Math.min(5, Math.floor(countRaw))) : 1

    if (!isSlot(slot) || !isFocus(focus)) {
      return NextResponse.json({ ok: false, error: 'bad_request' } satisfies ApiResponse, { status: 400 })
    }

    const sb = supabaseAdmin()

    const { data, error } = await sb
      .from('adm_ideas')
      .select('id,title,short_description,duration_minutes,environment,tags,status,hub')
      .eq('hub', 'meu-dia-leve')
      .eq('status', 'published')
      .eq('environment', focus)
      .eq('duration_minutes', Number(slot))
      .ilike('tags', '%frase_simples%')
      .ilike('tags', '%para_agora%')
      .limit(200)

    if (error) {
      return NextResponse.json({ ok: false, error: `supabase:${error.message}` } satisfies ApiResponse, { status: 200 })
    }

    const allItems = (Array.isArray(data) ? data : [])
      .map((row: any) => ({
        id: String(row.id ?? ''),
        title: String(row.title ?? '').trim(),
        how: String(row.short_description ?? '').trim(),
        slot,
        focus,
      }))
      .filter((x) => x.id && x.title && x.how)

    const poolSize = allItems.length

    const remaining = avoidIds.length ? allItems.filter((x) => !avoidIds.includes(String(x.id))) : allItems
    const exhausted = avoidIds.length > 0 && remaining.length === 0

    const picked = shuffle([...remaining]).slice(0, count)

    return NextResponse.json(
      {
        ok: true,
        meta: { source: 'adm', poolSize, returnedCount: picked.length, exhausted, avoidCount: avoidIds.length },
        items: picked,
      } satisfies ApiResponse,
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' } satisfies ApiResponse, { status: 200 })
  }
}
