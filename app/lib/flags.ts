/**
 * Unified Flags type - single source of truth for all feature flags
 */
export type Flags = {
  FF_LAYOUT_V1: boolean;
  FF_FEEDBACK_KIT: boolean;
  FF_HOME_V1: boolean;
  FF_MATERNAR_HUB: boolean;
};

export type FlagName = keyof Flags;

/**
 * Discover surface flags (UI toggles derived from FF_LAYOUT_V1 by default)
 * @deprecated - use Flags type instead
 */
export type DiscoverFlags = {
  recShelf: boolean;
  recShelfAI: boolean;
  flashRoutine: boolean;
  flashRoutineAI: boolean;
  selfCare: boolean;
  selfCareAI: boolean;
};

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
 * Server-side flag resolution
 * Reads from: URL (via x-current-url header) > cookie > env > Preview default
 */
export function getServerFlags(): Flags {
  // Try to extract URL from headers if available
  let queryParam: string | null = null;
  try {
    // This will only work if called in a Server Component with headers()
    // For now, we'll just use env defaults
    queryParam = null;
  } catch {
    // headers() not available, fall back to env
  }

  // Try to read cookie (requires 'use server' or cookies() call)
  let cookieValue: string | null = null;
  try {
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    cookieValue = cookieStore.get('ff_maternar')?.value ?? null;
  } catch {
    // cookies() not available in this context
  }

  // Get env defaults
  const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development';
  const envDefault = coerceEnv(process.env.NEXT_PUBLIC_FF_MATERNAR_HUB, isPreview ? '1' : '0');

  // Resolve with precedence
  const maternarHub = resolveMaternarFrom(queryParam, cookieValue, envDefault);

  return {
    FF_LAYOUT_V1: true, // default to on
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: maternarHub,
  };
}

/**
 * Client-side flag resolution
 * Reads from: URL param > cookie > env > Preview default
 * Safe to call on client only
 */
export function getClientFlags(): Flags {
  // URL params (always available on client)
  const search =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const queryParam = search.get('ff_maternar');

  // Cookie parsing (safe on client with document access)
  let cookieValue: string | null = null;
  if (typeof document !== 'undefined') {
    const match = /(?:^|; )ff_maternar=([^;]*)/.exec(document.cookie);
    cookieValue = match?.[1] ?? null;
  }

  // Get env defaults
  const isPreview =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'development';
  const envDefault = coerceEnv(
    process.env.NEXT_PUBLIC_FF_MATERNAR_HUB,
    isPreview ? '1' : '0'
  );

  // Resolve with precedence
  const maternarHub = resolveMaternarFrom(queryParam, cookieValue, envDefault);

  return {
    FF_LAYOUT_V1: true,
    FF_FEEDBACK_KIT: true,
    FF_HOME_V1: true,
    FF_MATERNAR_HUB: maternarHub,
  };
}

/**
 * Deprecated: use getServerFlags() or getClientFlags() instead
 * Main helper: isEnabled(flag) with proper per-flag policy
 */
export function isEnabled(flag: FlagName): boolean {
  const vercelEnv =
    (process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.VERCEL_ENV ||
      'local')!.toLowerCase();

  // QA override for layout flag (URL ?ff=1|0) - client-side only
  if (flag === 'FF_LAYOUT_V1' && typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('ff');
    if (q != null) return q === '1' || q.toLowerCase() === 'true';
  }

  // QA override for maternar flag (URL ?ff_maternar=1|0) - client-side only
  if (flag === 'FF_MATERNAR_HUB' && typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('ff_maternar');
    if (q != null) return q === '1' || q.toLowerCase() === 'true';
  }

  const raw = process.env[`NEXT_PUBLIC_${flag}` as keyof NodeJS.ProcessEnv] as
    | string
    | undefined;

  if (flag === 'FF_LAYOUT_V1') {
    if (vercelEnv === 'production') {
      const v = (raw ?? '').trim().toLowerCase();
      return v !== 'false' && v !== '0';
    }
    return coerceEnv(raw, '0');
  }

  if (flag === 'FF_MATERNAR_HUB') {
    if (vercelEnv === 'production') {
      return false;
    }
    return coerceEnv(raw, '1'); // Preview default true
  }

  return coerceEnv(raw, '0');
}

/**
 * Client-friendly pack of toggles for Descobrir (derived from layout flag by default)
 * @deprecated - use getClientFlags() for Flags type instead
 */
export function getClientFlags(
  overrides?: Partial<DiscoverFlags>
): DiscoverFlags {
  const on = isEnabled('FF_LAYOUT_V1');
  const base: DiscoverFlags = {
    recShelf: on,
    recShelfAI: on,
    flashRoutine: on,
    flashRoutineAI: on,
    selfCare: on,
    selfCareAI: on,
  };
  return { ...base, ...overrides };
}

/**
 * Server-side equivalent (keeps same defaults)
 * @deprecated - use getServerFlags() for Flags type instead
 */
export function getServerFlags(): DiscoverFlags {
  return getClientFlags();
}
