export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { buildMoodQuote, hash, Mood, selectQuote, SUPPORTED_MOODS, todayBR } from './lib'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const moodParam = (url.searchParams.get('mood') || '').toLowerCase() as Mood
  const date = url.searchParams.get('date') || todayBR()

  if (!SUPPORTED_MOODS.includes(moodParam)) {
    return NextResponse.json(
      { error: 'invalid mood' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const jar = cookies()
  const profileCookie = jar.get('m360_profile')?.value
  let motherName: string | undefined
  if (profileCookie) {
    try {
      const parsed = JSON.parse(profileCookie) as { motherName?: string; nomeMae?: string }
      motherName = parsed.motherName || parsed.nomeMae
    } catch {
      motherName = undefined
    }
  }

  const anonSeed = jar.get('m360_anon')?.value || 'guest'
  const quote = buildMoodQuote({ mood: moodParam, date, anonSeed, motherName })

  return NextResponse.json(
    {
      mood: moodParam,
      date,
      quote,
      hash: hash(`${date}|${moodParam}|${anonSeed}`),
      index: selectQuote(moodParam, date, anonSeed),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
