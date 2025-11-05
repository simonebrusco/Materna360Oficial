export type DiscoverFlags = {
  recShelf: boolean;
  recShelfAI: boolean;
  flashRoutine: boolean;
  flashRoutineAI: boolean;
  selfCare: boolean;
  selfCareAI: boolean;
};

export function isEnabled(flag: 'FF_LAYOUT_V1'): boolean {
  if (flag !== 'FF_LAYOUT_V1') return false;

  // QA override via URL (?ff=1 or ?ff=0)
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('ff');
    if (q != null) return q === '1' || q.toLowerCase() === 'true';
  }

  const raw = (process.env.NEXT_PUBLIC_FF_LAYOUT_V1 ?? '').toLowerCase().trim();
  const vercelEnv = (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || 'local').toLowerCase();

  // Production: fallback ON if missing/invalid
  if (vercelEnv === 'production') {
    return raw !== 'false' && raw !== '0';
  }
  // Preview/Dev: literal only
  return raw === 'true' || raw === '1';
}

export function getClientFlags(overrides?: Partial<DiscoverFlags>): DiscoverFlags {
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

export function getServerFlags(): DiscoverFlags {
  return getClientFlags();
}
