import BottomNav from '@/components/common/BottomNav';
import { GlobalHeader } from '@/components/common/GlobalHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" data-layout="page-template-v1">
      <GlobalHeader />
      <div className="pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
