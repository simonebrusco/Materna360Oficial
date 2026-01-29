// app/api/ai/meu-dia-leve/para-hoje/route.ts
import { NextResponse } from 'next/server'
import { getAdmEditorialTextPublished } from '@/app/lib/adm/adm.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ApiResponse =
  | {
      ok: true
      meta?: { source: 'adm' }
      item: { id: string; title: string; body: string }
    }
  | { ok: false; error: string }

export async function POST() {
  try {
    // chave editorial diária do Meu Dia Leve (curada, sem IA livre)
    const it = await getAdmEditorialTextPublished({ hub: 'meu-dia-leve', key: 'para_hoje' }).catch(() => null)

    if (!it) {
      return NextResponse.json({ ok: false, error: 'not_found' } satisfies ApiResponse, { status: 200 })
    }

    const id = String((it as any)?.id ?? '').trim()
    const title = String((it as any)?.title ?? '').trim()
    const body = String((it as any)?.body ?? '').trim()

    if (!id || !body) {
      return NextResponse.json({ ok: false, error: 'bad_item' } satisfies ApiResponse, { status: 200 })
    }

    return NextResponse.json(
      { ok: true, meta: { source: 'adm' }, item: { id, title, body } } satisfies ApiResponse,
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? 'server_error') } satisfies ApiResponse, { status: 200 })
  }
}
