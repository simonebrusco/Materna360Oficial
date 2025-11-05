import BottomNav from '@/components/common/BottomNav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Page content */}
      <div className="pb-24">{children}</div>
      {/* Floating bottom nav */}
      <BottomNav />
    </div>
  );
}
