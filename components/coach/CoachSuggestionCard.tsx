'use client';

import * as React from 'react';
import SoftCard from '@/components/ui/SoftCard';
import { Badge } from '@/components/ui/Badge';
import WhyThisDrawer from '@/components/ui/WhyThisDrawer';
import HydrationGate from '@/components/common/HydrationGate';
import type { CoachSuggestion, CoachTone } from '@/app/lib/coachMaterno.client';
import { setCoachTone } from '@/app/lib/coachMaterno.client';

export default function CoachSuggestionCard({
  resolve,
  onApply,
  onSave,
  onView,
  onWhyOpen,
  onToneChange,
}: {
  resolve: () => Promise<CoachSuggestion | null>;
  onApply?: (id: string) => void;
  onSave?: (id: string) => void;
  onView?: (id: string) => void;
  onWhyOpen?: (id: string) => void;
  onToneChange?: (tone: CoachTone) => void;
}) {
  const [sug, setSug] = React.useState<CoachSuggestion | null>(null);
  const [whyOpen, setWhyOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    resolve().then((s) => {
      if (!alive) return;
      setSug(s);
      if (s && onView) onView(s.id);
    });
    return () => {
      alive = false;
    };
  }, [resolve, onView]);

  if (!sug) return null;

  const handleTone = (tone: CoachTone) => {
    setCoachTone(tone);
    onToneChange && onToneChange(tone);
  };

  return (
    <>
      <SoftCard className="mb-4">
        {/* Header with badge and focus */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className="mb-2">Coach Materno</Badge>
          <span className="text-xs text-support-2 rounded-full border border-white/60 bg-white/40 px-2.5 py-1 whitespace-nowrap">
            Foco: <strong>{sug.focus}</strong>
          </span>
        </div>

        {/* Title and body */}
        <h3 className="m360-card-title mb-1">{sug.title}</h3>
        <p className="m360-body mb-4">{sug.body}</p>

        {/* Tone selector */}
        <div className="mb-4 pb-4 border-b border-white/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-support-2 font-medium">Tom:</span>
            <button
              onClick={() => handleTone('acolhedor')}
              aria-pressed={sug.tone === 'acolhedor'}
              className={`text-xs rounded-full px-3 py-1 font-medium transition-colors ${
                sug.tone === 'acolhedor'
                  ? 'bg-primary/20 border border-primary text-primary'
                  : 'bg-white/60 border border-white/60 text-support-2 hover:bg-white/80'
              }`}
            >
              Acolhedor
            </button>
            <button
              onClick={() => handleTone('prático')}
              aria-pressed={sug.tone === 'prático'}
              className={`text-xs rounded-full px-3 py-1 font-medium transition-colors ${
                sug.tone === 'prático'
                  ? 'bg-primary/20 border border-primary text-primary'
                  : 'bg-white/60 border border-white/60 text-support-2 hover:bg-white/80'
              }`}
            >
              Prático
            </button>
            <button
              onClick={() => handleTone('motivador')}
              aria-pressed={sug.tone === 'motivador'}
              className={`text-xs rounded-full px-3 py-1 font-medium transition-colors ${
                sug.tone === 'motivador'
                  ? 'bg-primary/20 border border-primary text-primary'
                  : 'bg-white/60 border border-white/60 text-support-2 hover:bg-white/80'
              }`}
            >
              Motivador
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="rounded-xl px-4 py-2 bg-primary text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            onClick={() => onApply && onApply(sug.id)}
          >
            {sug.actionLabel}
          </button>
          {sug.secondaryLabel && (
            <button
              className="rounded-xl px-4 py-2 border border-white/60 bg-white/90 font-medium text-sm text-support-1 hover:bg-white/95 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => onSave && onSave(sug.id)}
            >
              {sug.secondaryLabel}
            </button>
          )}
          <button
            className="ml-auto underline text-sm text-primary hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/30 rounded px-2 py-1"
            onClick={() => {
              setWhyOpen(true);
              onWhyOpen && onWhyOpen(sug.id);
            }}
          >
            Por que?
          </button>
        </div>
      </SoftCard>

      <WhyThisDrawer open={whyOpen} onClose={() => setWhyOpen(false)} text={sug.why} />
    </>
  );
}
