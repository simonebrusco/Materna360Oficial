'use client';

import * as React from 'react';

function isInsightsEnabled() {
  if (process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1') {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      const search = new URLSearchParams(window.location.search);
      if (search.get('insights') === '1') return true;
      if (localStorage.getItem('m360.insights_override') === '1') return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export default function AdminInsightsPage() {
  const enabled = isInsightsEnabled();

  if (!enabled) {
    return (
      <main className="max-w-screen-md mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Insights (restricted)
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          This page is only available when the internal insights feature flag is enabled.
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Ask the team to enable <code>NEXT_PUBLIC_FF_INTERNAL_INSIGHTS</code> for Preview
          if you need to use this internal panel.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-screen-md mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Telemetry Insights (coming soon)
      </h1>
      <p className="mt-3 text-sm text-neutral-600">
        The internal telemetry panel is enabled, but this environment is currently running a
        minimal placeholder page. It is safe to deploy and will not affect end users.
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        Future versions will show local telemetry events, filters, KPIs and charts for QA.
      </p>
    </main>
  );
}
