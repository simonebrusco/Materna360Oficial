import type { ReactNode } from 'react';
import BottomNav from '@/components/common/BottomNav';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
