'use client';

import * as React from 'react';
import { SectionWrapper } from '@/components/common/SectionWrapper';
import { Button } from '@/components/ui/Button';
import { useTelemetry } from './store/useTelemetry';

const FLAG = process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1';

export default function InsightsPage(){
  if(!FLAG){
    return (
      <SectionWrapper className="p-6">
        <h1>Admin Insights</h1>
        <p>Flag disabled — enable NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1</p>
      </SectionWrapper>
    );
  }
  
  const {data,clear,seed}=useTelemetry();
  
  return (
    <SectionWrapper className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <h1 className="m360-title mb-2">Painel de Telemetria</h1>
      <div className="flex gap-2 mb-3">
        <Button size="sm" onClick={()=>seed(500)}>Seed 500</Button>
        <Button size="sm" variant="destructive" onClick={()=>clear()}>Clear</Button>
        <span className="m360-subtle">Eventos: {data.length}</span>
      </div>
      <div className="p-3 overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5 bg-white">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Data</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Rota</th>
            </tr>
          </thead>
          <tbody>
            {data.map(e=>(
              <tr key={e.id} className="border-b last:border-0">
                <td className="p-3">{new Date(e.ts).toLocaleString()}</td>
                <td className="p-3">{e.type}</td>
                <td className="p-3">{e.route}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
