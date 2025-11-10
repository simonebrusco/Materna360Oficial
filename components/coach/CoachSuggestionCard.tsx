'use client';

import * as React from 'react';
import SoftCard from '@/components/ui/SoftCard';
import { Badge } from '@/components/ui/Badge';
import WhyThisDrawer from '@/components/ui/WhyThisDrawer';
import type { CoachSuggestion } from '@/app/lib/coachMaterno.client';

export default function CoachSuggestionCard({
  resolve,
  onApply,
  onSave,
  onView,
  onWhyOpen,
}: {
  resolve: () => Promise<CoachSuggestion | null>;
  onApply?: (id: string) => void;
  onSave?: (id: string) => void;
  onView?: (id: string) => void;
  onWhyOpen?: (id: string) => void;
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

  return (
    <>
      <SoftCard className="mb-4">
        <Badge className="mb-2">Coach Materno</Badge>
        <h3 className="m360-card-title mb-1">{sug.title}</h3>
        <p className="m360-body mb-4">{sug.body}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="rounded-xl px-4 py-2 bg-[#ff005e] text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all"
            onClick={() => onApply && onApply(sug.id)}
          >
            {sug.actionLabel}
          </button>
          {sug.secondaryLabel && (
            <button
              className="rounded-xl px-4 py-2 border border-white/60 font-medium text-sm hover:bg-white/60 transition-colors"
              onClick={() => onSave && onSave(sug.id)}
            >
              {sug.secondaryLabel}
            </button>
          )}
          <button
            className="ml-auto underline m360-micro text-[#ff005e] hover:opacity-70 transition-opacity"
            onClick={() => {
              setWhyOpen(true);
              onWhyOpen && onWhyOpen(sug.id);
            }}
          >
            Por que estou vendo isso?
          </button>
        </div>
      </SoftCard>

      <WhyThisDrawer open={whyOpen} onClose={() => setWhyOpen(false)} text={sug.why} />
    </>
  );
}
