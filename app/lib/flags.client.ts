'use client';

export function isEnabled(name: string): boolean {
  if (typeof window === 'undefined') return false;

  // Preview toggle via localStorage OR NEXT_PUBLIC_ env OR default list
  const ls = (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const env =
    (typeof process !== 'undefined' && process?.env?.[`NEXT_PUBLIC_${name}`]) || '';
  const localOverride = ls(name);
  const defaultsOn = ['FF_EMOTION_TRENDS', 'FF_LAYOUT_V1'];

  // Priority: localStorage > env > defaults
  if (localOverride === '1') return true;
  if (localOverride === '0') return false;
  if (env === '1' || env === 'true') return true;
  return defaultsOn.includes(name);
}
