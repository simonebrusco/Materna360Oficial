/**
 * Runtime utilities for client-safe code
 * Guards against SSR execution and Builder iframe issues
 */

/**
 * Check if code is running in browser (client-side)
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Safely read from localStorage with fallback
 * Returns fallback value if not in browser or on error
 */
export const safeLocalStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) {
    return fallback;
  }
  
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/**
 * Safely write to localStorage
 * No-op if not in browser or on error
 */
export const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely access document
 * Returns null if not in browser
 */
export const safeDocument = (): Document | null => {
  if (!isBrowser()) {
    return null;
  }
  
  try {
    return document;
  } catch {
    return null;
  }
};

/**
 * Safely get URL search params
 * Returns empty URLSearchParams if not in browser
 */
export const safeSearchParams = (): URLSearchParams => {
  if (!isBrowser()) {
    return new URLSearchParams();
  }
  
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
};

/**
 * Check if running in Builder preview mode
 */
export const isBuilderPreview = (): boolean => {
  const params = safeSearchParams();
  return params.has('builder.preview') || params.get('builder.preview') === '1';
};

/**
 * Check if running inside an iframe
 */
export const isInIframe = (): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    return window.self !== window.top;
  } catch {
    return true; // Likely in iframe if cross-origin
  }
};
