'use client';

export function isEnabled(name: string): boolean {
  // Evaluate flag logic consistently for both server and client
  // Priority: localStorage > env > defaults

  const env =
    (typeof process !== 'undefined' && process?.env?.[`NEXT_PUBLIC_${name}`]) || '';

  // Try localStorage only on client (safe to check window here)
  let localOverride: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      localOverride = window.localStorage.getItem(name);
    } catch {
      localOverride = null;
    }
  }

  // Check environment variable first (consistent on server and client)
  if (env === '1' || env === 'true') return true;
  if (env === '0' || env === 'false') return false;

  // Then check localStorage override (client-side only)
  if (localOverride === '1') return true;
  if (localOverride === '0') return false;

  // Default list for backward compatibility - use actual env values instead of hardcoding
  // If env variable is not set, use false as default to match production
  return false;
}
