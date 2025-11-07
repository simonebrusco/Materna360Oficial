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
 * Client-side flag resolution (Unified API)
 * Reads from: URL param > cookie > env > Preview default
 * Safe to call only on client
 */
export function getClientFlagsUnified(): Flags {
  // URL params (always available on client)
  const search =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const queryParam = search.get('ff_maternar');

  // Cookie parsing
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
 * Helper to check a single flag on client
 * Supports URL override: ?ff_maternar=1|0
 */
export function isEnabled(flag: FlagName): boolean {
  const flags = getClientFlagsUnified();
  return flags[flag];
}

/**
 * Legacy helper for Discover flags (backward compatible)
 * @deprecated - use getClientFlagsUnified() instead
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
 * Legacy server-side equivalent
 * @deprecated - use getServerFlags() from flags.server.ts instead
 */
export async function getServerDiscoverFlags(): Promise<DiscoverFlags> {
  // This is deprecated - use the server module directly
  const on = true; // Default value
  return {
    recShelf: on,
    recShelfAI: on,
    flashRoutine: on,
    flashRoutineAI: on,
    selfCare: on,
    selfCareAI: on,
  };
}
