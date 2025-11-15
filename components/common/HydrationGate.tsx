'use client';

import * as React from 'react';

/**
 * Renders a stable wrapper on SSR and only reveals children after mount.
 * Prevents hydration mismatches caused by Date, localStorage, or other client-only state.
 */
export default function HydrationGate({
  children,
  fallback = null,
  as: Tag = 'div',
  className = '',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const Component = Tag as React.ElementType;

  return (
    <Component className={className}>
      {mounted ? children : fallback}
    </Component>
  );
}
