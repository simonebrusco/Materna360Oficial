// app/api/ai/meu-dia-leve/plano-pronto/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Focus = 'filho' | 'casa' | 'comida' | 'voce'

type Body = {
  slot?: Slot
  focus?: Focus
}

type ApiResponse =
  | { ok: true; items: Array<{ id: string; title: string; how: string; slot: Slot; focus: Focus }> }
  | { ok: false; error: string }

function isSlot(v: any): v is Slot {
  return v === '3' || v === '5' || v === '10'
}

function isFocus(v: any): v is Focus {
  return v === 'filho' || v === 'casa' || v === 'comida' || v === 'voce'
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const slot = String(body?.slot ?? '') as Slot
    const focus = String(body?.focus ?? '') as Focus

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
      .ilike('tags', '%plano_pronto%')
      .ilike('tags', '%para_agora%')
      .limit(50)

    if (error) {
      return NextResponse.json({ ok: false, error: `supabase:${error.message}` } satisfies ApiResponse, { status: 200 })
    }

    const items = (Array.isArray(data) ? data : [])
      .map((row: any) => ({
        id: String(row.id ?? ''),
        title: String(row.title ?? '').trim(),
        how: String(row.short_description ?? '').trim(),
        slot,
        focus,
      }))
      .filter((x) => x.id && x.title && x.how)

    return NextResponse.json({ ok: true, items } satisfies ApiResponse, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' } satisfies ApiResponse, { status: 200 })
  }
}
