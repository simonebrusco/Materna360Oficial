'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * Renders children only on the client after hydration.
 *
 * Server rendering: null (no HTML)
 * Client initial render: null (matches server)
 * Client after hydration: children (rendered after mount)
 *
 * This prevents hydration mismatches because server and client
 * both render null initially, then client adds content after mount.
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Both server and client render null initially
  // This is consistent, so no hydration mismatch warning
  // After hydration, useEffect sets isMounted to true and children render
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
