'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render a consistent wrapper to prevent hydration mismatch
  // Use suppressHydrationWarning because content differs by design
  return (
    <div suppressHydrationWarning>
      {mounted ? children : fallback}
    </div>
  );
}
