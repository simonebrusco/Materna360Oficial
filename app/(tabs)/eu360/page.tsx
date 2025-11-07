import { Suspense } from 'react';
import Eu360Client from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
      <Eu360Client />
    </Suspense>
  );
}
