import { Suspense } from 'react';
import Client from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <main data-layout="page-template-v1">
      <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
        <Client />
      </Suspense>
    </main>
  );
}
