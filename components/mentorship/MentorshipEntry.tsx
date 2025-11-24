'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import { MentorshipSheet } from './MentorshipSheet';
import { FeatureGate } from '@/components/ui/FeatureGate';

interface MentorshipEntryProps {
  currentPlan?: 'Free' | 'Plus' | 'Premium';
}

export function MentorshipEntry({ currentPlan = 'Free' }: MentorshipEntryProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const content = (
    <Card className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <AppIcon name="heart" size={24} className="text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-support-1">Converse com uma mentora</h3>
          <p className="text-sm text-support-2 mt-1">
            Tire suas dúvidas com profissionais experientes em maternidade.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="flex-shrink-0"
        >
          Abrir
        </Button>
      </div>
    </Card>
  );

  return (
    <>
      <FeatureGate
        featureKey="mentorship.access"
        currentPlan={currentPlan}
        onUpgradeClick={() => {
          window.location.href = '/planos';
        }}
      >
        {content}
      </FeatureGate>

      <MentorshipSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
