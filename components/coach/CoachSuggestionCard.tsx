'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Reveal } from '@/components/ui/Reveal';
import WhyThisDrawer from '@/components/ui/WhyThisDrawer';

export type CoachSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;   // primary CTA (e.g. "Fazer agora (5 min)")
  saveLabel?: string;     // secondary CTA
  reason?: string;        // transparency text
};

type Props = {
  resolve: () => Promise<CoachSuggestion>;
  onView?: (id: string) => void;
  onApply?: (id: string) => void;
  onSave?: (id: string) => void;
  onWhyOpen?: (id: string) => void;
};

export default function CoachSuggestionCard({
  resolve,
  onView,
  onApply,
  onSave,
  onWhyOpen,
}: Props) {
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    resolve().then((s) => {
      if (!alive) return;
      setSuggestion(s);
      try {
        onView?.(s.id);
      } catch {}
    });
    return () => {
      alive = false;
    };
  }, [resolve, onView]);

  if (!suggestion) {
    return (
      <Card className="rounded-2xl bg-white/90 p-5">
        <div className="h-5 w-24 bg-black/10 rounded mb-4 animate-pulse" />
        <div className="h-6 w-2/3 bg-black/10 rounded mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-black/10 rounded animate-pulse" />
      </Card>
    );
  }

  return (
    <Reveal>
      <Card className="rounded-2xl bg-white/90 p-5">
        <div className="mb-3">
          <Badge>Coach Materno</Badge>
        </div>
        <h3 className="m360-card-title">{suggestion.title}</h3>
        {suggestion.subtitle && (
          <p className="m360-body mt-1 text-[#545454]">{suggestion.subtitle}</p>
        )}

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              try {
                onApply?.(suggestion.id);
              } catch {}
            }}
          >
            {suggestion.actionLabel ?? 'Fazer agora'}
          </Button>
          {suggestion.saveLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                try {
                  onSave?.(suggestion.id);
                } catch {}
              }}
            >
              {suggestion.saveLabel}
            </Button>
          )}
          <button
            className="m360-micro underline opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => {
              setWhyOpen(true);
              try {
                onWhyOpen?.(suggestion.id);
              } catch {}
            }}
          >
            Por que estou vendo isso?
          </button>
        </div>

        <WhyThisDrawer
          open={whyOpen}
          onClose={() => setWhyOpen(false)}
          text={suggestion.reason ?? 'Sugestão baseada no seu padrão recente de humor/energia.'}
        />
      </Card>
    </Reveal>
  );
}
