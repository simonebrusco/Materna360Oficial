import { NextResponse } from 'next/server';
import { trackTelemetry } from '@/app/lib/telemetry';

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({} as any));
  trackTelemetry('planner.save', { category: payload?.category });
  return NextResponse.json({ id: payload?.id ?? null });
}
