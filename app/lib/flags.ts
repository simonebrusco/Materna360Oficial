/** Runtime feature flags used across the app. Extend this union when you add new flags. */
export type FlagName = 'FF_LAYOUT_V1' | 'FF_FEEDBACK_KIT' | 'FF_HOME_V1' | 'FF_MATERNAR_HUB';

/** Discover surface flags (UI toggles derived from FF_LAYOUT_V1 by default) */
export type DiscoverFlags = {
  recShelf: boolean;
  recShelfAI: boolean;
  flashRoutine: boolean;
  flashRoutineAI: boolean;
  selfCare: boolean;
  selfCareAI: boolean;
};

/** Read a NEXT_PUBLIC_* env and coerce to boolean (true/1) */
function coerceEnvBoolean(raw: string | undefined | null): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === 'true' || v === '1';
}

/** Main helper: isEnabled(flag) with proper per-flag policy */
export function isEnabled(flag: FlagName): boolean {
  const vercelEnv =
    (process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.VERCEL_ENV ||
      'local')!.toLowerCase();

  // QA override only for layout flag (URL ?ff=1|0)
  if (flag === 'FF_LAYOUT_V1' && typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('ff');
    if (q != null) return q === '1' || q.toLowerCase() === 'true';
  }

  const raw = process.env[`NEXT_PUBLIC_${flag}` as keyof NodeJS.ProcessEnv] as
    | string
    | undefined;

  if (flag === 'FF_LAYOUT_V1') {
    // Production fallback ON if missing/invalid (safe default to new UI)
    if (vercelEnv === 'production') {
      const v = (raw ?? '').trim().toLowerCase();
      return v !== 'false' && v !== '0';
    }
    // Preview/Dev literal only
    return coerceEnvBoolean(raw);
  }

  // Other flags: literal in all environments (no prod fallback)
  return coerceEnvBoolean(raw);
}

/** Client-friendly pack of toggles for Descobrir (derived from layout flag by default) */
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

/** Server-side equivalent (keeps same defaults) */
export function getServerFlags(): DiscoverFlags {
  return getClientFlags();
}
