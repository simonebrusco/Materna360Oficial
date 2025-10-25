import { NextResponse } from 'next/server'

import { buildWeekLabels, getWeekStartKey } from '@/app/lib/weekLabels'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawWeekStart = searchParams.get('weekStart')

  if (!rawWeekStart) {
    return NextResponse.json({ error: 'weekStart parameter is required.' }, { status: 400 })
  }

  const weekStartKey = getWeekStartKey(rawWeekStart)
  const { labels } = buildWeekLabels(weekStartKey)

  if (labels.length === 0) {
    return NextResponse.json({ error: 'Invalid weekStart parameter.' }, { status: 400 })
  }

  return NextResponse.json({ weekStartKey, weekLabels: labels }, { headers: { 'Cache-Control': 'no-store' } })
}
