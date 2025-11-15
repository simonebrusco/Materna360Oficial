'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';

interface MentorCardProps {
  name: string;
  specialty: string;
  bullets: string[];
  avatarUrl?: string;
  onViewAvailability?: () => void;
}

export function MentorCard({
  name,
  specialty,
  bullets,
  avatarUrl,
  onViewAvailability,
}: MentorCardProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      {/* Avatar + Name + Specialty */}
      <div className="flex gap-3 mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-base font-semibold text-support-1">{name}</h3>
          <p className="text-xs text-primary font-medium">{specialty}</p>
        </div>
      </div>

      {/* Bullets */}
      <ul className="mb-4 space-y-1">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-support-2">
            <AppIcon name="check" size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant="primary"
        size="sm"
        onClick={onViewAvailability}
        className="w-full"
      >
        Ver disponibilidade
      </Button>
    </Card>
  );
}
