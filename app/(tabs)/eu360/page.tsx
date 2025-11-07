import { Suspense } from 'react';
import Eu360Client from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <main data-layout="page-template-v1" className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6 md:px-8">
      <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
        <Eu360Client />
      </Suspense>
    </main>
  );
}
