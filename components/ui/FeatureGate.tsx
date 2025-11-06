'use client';

import React from 'react';
import AppIcon from './AppIcon';
import { Button } from './Button';

export type FeatureKey =
  | 'ideas.dailyQuota'
  | 'weekly.pdf'
  | 'journeys.concurrentSlots'
  | 'weekly.summary'
  | 'mentorship.access';

type PlanTier = 'Free' | 'Plus' | 'Premium';

interface FeatureGateProps {
  featureKey: FeatureKey;
  currentPlan: PlanTier;
  children: React.ReactNode;
  onUpgradeClick?: () => void;
}

/**
 * Feature availability matrix:
 * Free: basic features only
 * Plus: unlocks ideas, PDF export, concurrent journeys
 * Premium: everything
 */
const FEATURE_ACCESS: Record<FeatureKey, PlanTier[]> = {
  'ideas.dailyQuota': ['Plus', 'Premium'],
  'weekly.pdf': ['Plus', 'Premium'],
  'journeys.concurrentSlots': ['Plus', 'Premium'],
  'weekly.summary': ['Free', 'Plus', 'Premium'], // Summary visible to all, but some features locked
  'mentorship.access': ['Plus', 'Premium'],
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  'ideas.dailyQuota': 'Gerador de Ideias',
  'weekly.pdf': 'Exportar em PDF',
  'journeys.concurrentSlots': 'Jornadas Simultâneas',
  'weekly.summary': 'Resumo Semanal',
  'mentorship.access': 'Acesso à Mentoria',
};

export function FeatureGate({
  featureKey,
  currentPlan,
  children,
  onUpgradeClick,
}: FeatureGateProps) {
  const isAllowed = FEATURE_ACCESS[featureKey].includes(currentPlan);

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/40 rounded-2xl z-10 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-xl p-4 shadow-lg text-center max-w-xs pointer-events-auto">
          <div className="mb-2 flex justify-center">
            <AppIcon name="crown" variant="brand" size={32} />
          </div>
          <p className="text-sm font-semibold text-support-1 mb-1">
            {FEATURE_LABELS[featureKey]}
          </p>
          <p className="text-xs text-support-2 mb-3">
            Recurso do plano Plus ou Premium
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onUpgradeClick}
            className="w-full"
          >
            Conheça os planos
          </Button>
        </div>
      </div>

      {/* Blurred content below overlay */}
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
}
