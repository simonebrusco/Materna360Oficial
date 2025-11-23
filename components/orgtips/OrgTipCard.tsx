'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface OrgTipCardProps {
  title: string;
  summary: string;
  tags: string[];
  details?: string;
  onSave?: () => void;
  onDetails?: () => void;
}

export function OrgTipCard({
  title,
  summary,
  tags,
  details,
  onSave,
  onDetails,
}: OrgTipCardProps) {
  return (
    <Card className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <h3 className="text-base font-semibold text-support-1 mb-2">{title}</h3>
      <p className="text-sm text-support-2 mb-3">{summary}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-support-3/10 px-2 py-1 text-xs text-support-2"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          className="flex-1"
        >
          Salvar no Planner
        </Button>
        {details && (
          <button
            onClick={onDetails}
            className="text-primary text-sm font-medium hover:underline px-2 py-2"
            aria-label={`Detalhes de ${title}`}
          >
            Detalhes
          </button>
        )}
      </div>
    </Card>
  );
}
