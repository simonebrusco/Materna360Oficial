import { cookies } from 'next/headers';
import type { Flags } from './flags';

/**
 * Coerce env value to boolean with fallback
 */
function coerceEnv(v: string | undefined, fallback: '0' | '1'): boolean {
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return fallback === '1';
}

/**
 * Resolve FF_MATERNAR_HUB from URL param > cookie > env default
 */
function resolveMaternarFrom(
  queryParam: string | null,
  cookieValue: string | null,
  envDefault: boolean
): boolean {
  // URL param takes highest precedence
  if (queryParam === '1' || queryParam === 'true') return true;
  if (queryParam === '0' || queryParam === 'false') return false;

  // Cookie takes second precedence
  if (cookieValue === '1' || cookieValue === 'true') return true;
  if (cookieValue === '0' || cookieValue === 'false') return false;

  // Env default takes lowest precedence
  return envDefault;
}

/**
 * Server-side flag resolution (Unified API)
 * Reads from: cookie > env > Preview default
 * Note: URL params are not available on server without x-current-url header injection
 */
export async function getServerFlags(): Promise<Flags> {
  let cookieValue: string | null = null;

  try {
    const cookieStore = cookies();
    cookieValue = cookieStore.get('ff_maternar')?.value ?? null;
  } catch {
    // cookies() might not be available in all contexts
  }

  // Get env defaults
  const isPreview =
    process.env.VERCEL_ENV === 'preview' ||
    process.env.VERCEL_ENV === 'development';
  const envDefault = coerceEnv(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview ? '1' : '0'
  );

  // Resolve without URL params (requires manual injection via headers if needed)
  const maternarHub = resolveMaternarFrom(null, cookieValue, envDefault);

  return {
    FF_LAYOUT_V1: true,
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: maternarHub,
  };
}
