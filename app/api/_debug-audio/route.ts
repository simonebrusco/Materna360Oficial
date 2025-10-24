export const runtime = 'edge'

export async function GET() {
  return new Response(
    JSON.stringify({
      NEXT_PUBLIC_SUPABASE_AUDIO_BASE: process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE ?? null,
      when: new Date().toISOString(),
    }),
    {
      headers: { 'content-type': 'application/json' },
    }
  )
}
