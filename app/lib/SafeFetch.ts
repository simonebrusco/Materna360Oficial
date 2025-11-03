/**
 * SafeFetch polyfill for FullStory compatibility
 * Detects FullStory and uses XMLHttpRequest for internal RSC fetches
 */

const isFullStoryPresent = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return !!(window as any).__FULLSTORY && typeof (window as any).__FULLSTORY === 'object';
  } catch {
    return false;
  }
};

const originalFetch = globalThis.fetch;

export const initSafeFetch = () => {
  if (typeof window === 'undefined' || !originalFetch) {
    return;
  }

  // Override window.fetch with a wrapper
  (globalThis as any).fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // If FullStory is present and this is an internal RSC request, use XMLHttpRequest instead
    if (isFullStoryPresent() && isInternalRSCRequest(url)) {
      return fetchViaXHR(url, init);
    }

    // Otherwise use original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // If original fetch fails and FullStory is present, try XMLHttpRequest fallback
      if (isFullStoryPresent() && isInternalRequest(url)) {
        return fetchViaXHR(url, init);
      }
      throw error;
    }
  };

  // Copy over static methods that might be called
  if (originalFetch.blob) {
    (globalThis.fetch as any).blob = originalFetch.blob;
  }
  if (originalFetch.json) {
    (globalThis.fetch as any).json = originalFetch.json;
  }
  if (originalFetch.text) {
    (globalThis.fetch as any).text = originalFetch.text;
  }
};

const isInternalRSCRequest = (url: string): boolean => {
  // Detect RSC payload requests - they typically don't have file extensions
  // and are from the same origin
  try {
    const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
    const isInternal = !url.startsWith('http') || urlObj.origin === window.location.origin;

    if (!isInternal) return false;

    const pathname = urlObj.pathname;
    // RSC payloads typically don't have extensions or have .rsc extension
    return !pathname.match(/\.(js|css|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
  } catch {
    return false;
  }
};

const isInternalRequest = (url: string): boolean => {
  try {
    if (!url.startsWith('http')) return true;
    const urlObj = new URL(url);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
};

const fetchViaXHR = (url: string, init?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders()),
      });
      resolve(response);
    };

    xhr.onerror = () => {
      reject(new TypeError('Failed to fetch via XHR'));
    };

    xhr.ontimeout = () => {
      reject(new TypeError('XHR request timeout'));
    };

    try {
      xhr.open(init?.method || 'GET', url, true);

      // Set headers
      if (init?.headers) {
        const headers = init.headers as Record<string, string>;
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value);
        }
      }

      // Set body
      const body = init?.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined;

      xhr.send(body);
    } catch (error) {
      reject(error);
    }
  });
};

const parseHeaders = (headerStr: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!headerStr) return headers;

  const headerPairs = headerStr.split('\u000d\u000a');
  for (const header of headerPairs) {
    const index = header.indexOf('\u003a\u0020');
    if (index > 0) {
      const name = header.substring(0, index);
      const value = header.substring(index + 2);
      headers[name] = value;
    }
  }
  return headers;
};
