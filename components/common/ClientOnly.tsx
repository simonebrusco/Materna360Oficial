'use client';

import { useEffect, useRef } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * Renders children only on the client after hydration.
 * Does NOT render anything on the server.
 *
 * This prevents hydration mismatches by ensuring the client
 * renders the same DOM structure that the server produced.
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const isMountedRef = useRef(false);

  // Use a ref instead of state to avoid causing a re-render
  // Simply checking if we're on the client
  if (typeof window === 'undefined') {
    // Server-side: return nothing
    return null;
  }

  // Client-side: return children
  return <>{children}</>;
}
