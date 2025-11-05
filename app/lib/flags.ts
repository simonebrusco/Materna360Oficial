export type DiscoverFlags = {
  recShelf?: boolean;
  recShelfAI?: boolean;
  flashRoutine?: boolean;
  flashRoutineAI?: boolean;
  selfCare?: boolean;
  selfCareAI?: boolean;
};

export function isEnabled(flag: 'FF_LAYOUT_V1'): boolean {
  if (flag !== 'FF_LAYOUT_V1') return false;

  // QA override: ?ff=1 or ?ff=0 in the URL
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('ff');
    if (q != null) return q === '1' || q.toLowerCase() === 'true';
  }

  const raw = (process.env.NEXT_PUBLIC_FF_LAYOUT_V1 ?? '').toLowerCase().trim();
  const vercelEnv = (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || 'local').toLowerCase();

  // Production: fallback ON if env is missing/invalid
  if (vercelEnv === 'production') {
    return raw !== 'false' && raw !== '0';
  }
  // Preview/Dev: literal value only
  return raw === 'true' || raw === '1';
}

/**
 * Client-side flag resolver: takes server flags and returns client-safe flags
 */
export function getClientFlags(serverFlags?: DiscoverFlags): DiscoverFlags {
  if (!serverFlags) {
    return {
      recShelf: false,
      recShelfAI: false,
      flashRoutine: false,
      flashRoutineAI: false,
      selfCare: false,
      selfCareAI: false,
    };
  }
  return serverFlags;
}

/**
 * Server-side flag resolver: returns all available flags
 */
export function getServerFlags(): DiscoverFlags {
  return {
    recShelf: true,
    recShelfAI: true,
    flashRoutine: true,
    flashRoutineAI: true,
    selfCare: true,
    selfCareAI: true,
  };
}
