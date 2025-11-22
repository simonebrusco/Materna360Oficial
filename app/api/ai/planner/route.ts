// app/api/ai/planner/route.ts
import { NextRequest } from 'next/server'
import { createStubAIResponse } from '@/app/lib/ai/handlers'

export async function POST(req: NextRequest) {
  let body: unknown = null

  try {
    body = await req.json()
  } catch {
    body = null
  }

  const response = createStubAIResponse('planner')

  return Response.json({
    ...response,
    debug: {
      received: body,
    },
  })
}
