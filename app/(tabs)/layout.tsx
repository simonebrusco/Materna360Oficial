import BottomNav from '@/components/common/BottomNav';
import { GlobalHeader } from '@/components/common/GlobalHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative
        min-h-[100dvh]
        flex
        flex-col
        bg-white
      "
      data-layout="page-template-v1"
    >
      <GlobalHeader />

      {/* área principal onde as páginas aplicam o degradê próprio */}
      <div className="flex-1 pb-24">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
