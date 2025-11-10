'use client';

import * as React from 'react';
import HydrationGate from '@/components/common/HydrationGate';
import EmotionTrendChart, { EmotionPoint } from '@/components/charts/EmotionTrendChart';

type Props = {
  open: boolean;
  onClose: () => void;
  resolveData?: () => EmotionPoint[];
};

export function EmotionTrendDrawer({ open, onClose, resolveData }: Props) {
  const [range, setRange] = React.useState<'7d' | '28d'>('7d');
  // Lock 'now' to first client mount to prevent SSR/client drift
  const [now] = React.useState<Date>(() => new Date());
  const data = React.useMemo(() => (resolveData ? resolveData() : []), [resolveData, open]);

  if (!open) return null;

  return (
    <HydrationGate
      as="div"
      className="fixed inset-0 z-50"
      fallback={
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-[0_8px_28px_rgba(47,58,86,0.12)] p-4 md:p-5 max-h-[90vh] overflow-y-auto animate-pulse"
            style={{ minHeight: 200 }}
          />
        </div>
      }
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <InnerEmotionTrendDrawer open={open} onClose={onClose} range={range} setRange={setRange} data={data} />
    </HydrationGate>
  );
}

function InnerEmotionTrendDrawer({
  open,
  onClose,
  range,
  setRange,
  data,
}: {
  open: boolean;
  onClose: () => void;
  range: '7d' | '28d';
  setRange: (r: '7d' | '28d') => void;
  data: EmotionPoint[];
}) {
  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-[0_8px_28px_rgba(47,58,86,0.12)] p-4 md:p-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Tendência de humor e energia"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="m360-card-title">Tendência de humor e energia</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 bg-black/8 text-support-1 font-medium text-sm hover:bg-black/12 transition-colors"
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setRange('7d')}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              range === '7d'
                ? 'bg-[#ff005e] text-white border-[#ff005e]'
                : 'border-white/60 text-support-2 hover:bg-white/60'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setRange('28d')}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              range === '28d'
                ? 'bg-[#ff005e] text-white border-[#ff005e]'
                : 'border-white/60 text-support-2 hover:bg-white/60'
            }`}
          >
            28 dias
          </button>
        </div>

        <div className="bg-white/60 rounded-2xl p-4 mb-3">
          <EmotionTrendChart data={data} range={range} />
        </div>

        <p className="m360-micro text-center">Dica: observe padrões, sem julgamentos. Foque em pequenas vitórias.</p>
      </div>
    </div>
  );
}

export default EmotionTrendDrawer;
