'use client';

import React, { type ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // Só controla o espaço da página; o BottomNav fica em layout.tsx
  return <div className="relative min-h-[100dvh] pb-24">{children}</div>;
};

export default AppShell;
