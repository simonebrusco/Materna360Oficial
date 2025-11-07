import BottomNav from '@/components/common/BottomNav';
import { getServerFlags, type Flags } from '@/app/lib/flags.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  // Server-side: read flags once and pass down as props
  // This is the single source of truth for flag resolution
  const flags = getServerFlags();

  // Compute nav item count for debugging
  const itemCount = flags.FF_MATERNAR_HUB ? 5 : 4;
  const hubStatus = flags.FF_MATERNAR_HUB ? 'on' : 'off';

  return (
    <div className="relative">
      <div className="pb-24">{children}</div>
      <BottomNav
        flags={flags}
        data-debug-nav={`count:${itemCount};hub:${hubStatus}`}
      />
    </div>
  );
}
