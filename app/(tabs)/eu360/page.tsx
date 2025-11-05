import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Eu360ClientWrapper() {
  const Eu360Client = require('./Client').default;
  return <Eu360Client />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
      <Eu360ClientWrapper />
    </Suspense>
  );
}
