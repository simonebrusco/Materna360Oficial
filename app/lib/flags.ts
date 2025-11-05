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
