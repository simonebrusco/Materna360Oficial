import { NextResponse } from 'next/server';

export async function GET() {
  const raw = process.env.NEXT_PUBLIC_FF_LAYOUT_V1 ?? '';
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || 'local';
  const prodLike = vercelEnv === 'production';

  const enabled = (() => {
    const v = raw.trim().toLowerCase();
    if (prodLike) return v !== 'false' && v !== '0'; // production fallback ON
    return v === 'true' || v === '1';                // preview/dev: literal
  })();

  return NextResponse.json({ vercelEnv, raw, resolved: enabled });
}
