'use client';
import * as React from 'react';
import { SoftCard } from '@/components/ui/card';

export default function Kpis({ kpis }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <SoftCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-600">Total</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total}</p>
      </SoftCard>

      <SoftCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-600">Top Type</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.topType}</p>
      </SoftCard>

      <SoftCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-600">Top Route</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.topRoute}</p>
      </SoftCard>
    </div>
  );
}
