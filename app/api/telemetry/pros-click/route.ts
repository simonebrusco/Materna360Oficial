export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}))
  console.log('[pros-click]', { ...data, ts: new Date().toISOString() })
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
