'use server';

import { cookies, headers } from 'next/headers';

export type Flags = {
  FF_LAYOUT_V1: boolean;
  FF_FEEDBACK_KIT: boolean;
  FF_HOME_V1: boolean;
  FF_MATERNAR_HUB: boolean;
};

const coerce = (v: string | undefined, fallback: boolean) =>
  v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : fallback;

/**
 * Server-side flag resolution - single source of truth
 * Reads from: URL (via referer header) > cookie > env > Preview default
 * Preview force switch via NEXT_PUBLIC_FORCE_MATERNAR guarantees visibility
 */
export function getServerFlags(): Flags {
  // Preview force switch (TEMP): guarantees visibility in Vercel preview / Builder
  const force = coerce(process.env.NEXT_PUBLIC_FORCE_MATERNAR, false);

  const hdrs = headers();
  const referer = hdrs.get('referer') ?? '';
  const search = referer.includes('?')
    ? new URLSearchParams(referer.split('?')[1])
    : new URLSearchParams();

  const qp = search.get('ff_maternar');
  const cookieVal = cookies().get('ff_maternar')?.value ?? null;

  const isPreview = process.env.VERCEL_ENV === 'preview';
  const envDefault = coerce(process.env.NEXT_PUBLIC_FF_MATERNAR_HUB, isPreview);

  let mat = envDefault;
  if (qp === '1') mat = true;
  if (qp === '0') mat = false;
  if (cookieVal === '1') mat = true;
  if (cookieVal === '0') mat = false;
  if (force) mat = true; // hard-enable in Preview if needed

  return {
    FF_LAYOUT_V1: true,
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: mat,
  };
}
