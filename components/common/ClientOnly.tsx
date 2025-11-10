'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only on the client after hydration.
 * On server, renders fallback (default: nothing).
 * Uses suppressHydrationWarning to allow content to differ between server/client.
 */
export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder on server that matches fallback
  // This ensures HTML structure is consistent during hydration
  if (!mounted) {
    return fallback ? <>{fallback}</> : null;
  }

  // After hydration, render actual children with suppressed warnings
  return (
    <>
      {children}
    </>
  );
}
