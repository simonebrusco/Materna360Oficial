import { cookies } from 'next/headers';

export type Flags = {
  FF_LAYOUT_V1: boolean;
  FF_FEEDBACK_KIT: boolean;
  FF_HOME_V1: boolean;
  FF_MATERNAR_HUB: boolean;
};

const toBool = (v: string | undefined, fallback: boolean) => {
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return fallback;
};

/**
 * Server-side flag resolution - deterministic and single source of truth
 * Precedence:
 * 1. FORCE_MATERNAR_SSR (server-only, highest priority, not public)
 * 2. Cookie override (set by QA/UI if needed)
 * 3. Environment variables with Preview default
 *
 * No longer reads referer header (unreliable in Builder/Preview contexts)
 */
export function getServerFlags(): Flags {
  // 1) Hard server override (highest priority, server-only env):
  const forceSSR = toBool(process.env.FORCE_MATERNAR_SSR, false);
  if (forceSSR) {
    return {
      FF_LAYOUT_V1: true,
      FF_FEEDBACK_KIT: true,
      FF_HOME_V1: true,
      FF_MATERNAR_HUB: true,
    };
  }

  // 2) Cookie override (set by QA/UI if any)
  const cookieVal = cookies().get('ff_maternar')?.value ?? null;
  const cookieBool =
    cookieVal === '1' ? true : cookieVal === '0' ? false : null;

  // 3) Environment defaults (Preview vs Prod) + public env
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const envDefault = toBool(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview
  );

  const mat = cookieBool !== null ? cookieBool : envDefault;

  return {
    FF_LAYOUT_V1: true,
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: mat,
  };
}
