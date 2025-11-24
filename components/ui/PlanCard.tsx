'use client';

import React from 'react';
import AppIcon from './AppIcon';
import { Button } from './Button';
import { Card } from './card';

type PlanTier = 'Free' | 'Plus' | 'Premium';

interface PlanCardProps {
  currentPlan: PlanTier;
  onManagePlan?: () => void;
  onExplorePlans?: () => void;
}

const PLAN_INFO: Record<PlanTier, {
  label: string;
  icon: 'place' | 'star' | 'crown';
  benefits: string[];
  badge?: string;
}> = {
  Free: {
    label: 'Plano Gratuito',
    icon: 'place',
    benefits: [
      '3 ideias por dia',
      '1 jornada ativa',
      'Registrar humor diário',
    ],
    badge: 'Limites: 3 ideias/dia, 1 jornada ativa',
  },
  Plus: {
    label: 'Plano Plus',
    icon: 'star',
    benefits: [
      '✓ Ideias ilimitadas',
      '✓ Até 3 jornadas ativas',
      '✓ Exportar em PDF',
      '✓ Análises semanais',
    ],
  },
  Premium: {
    label: 'Plano Premium',
    icon: 'crown',
    benefits: [
      '✓ Tudo do Plus',
      '✓ Análises avançadas com IA',
      '✓ Mentorias com profissionais',
      '✓ Suporte prioritário',
    ],
  },
};

export function PlanCard({
  currentPlan,
  onManagePlan,
  onExplorePlans,
}: PlanCardProps) {
  const planInfo = PLAN_INFO[currentPlan];
  const isFree = currentPlan === 'Free';

  return (
    <Card className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-5 md:p-6">
      {/* Header with icon and plan name */}
      <div className="flex items-start gap-3 mb-4">
        <AppIcon name={planInfo.icon} variant="brand" size={28} />
        <div className="flex-1">
          <h3 className="text-title font-semibold text-support-1">
            {planInfo.label}
          </h3>
          {planInfo.badge && (
            <p className="text-xs text-primary font-medium mt-1">
              {planInfo.badge}
            </p>
          )}
        </div>
      </div>

      {/* Benefits list */}
      <ul className="mb-5 space-y-2">
        {planInfo.benefits.map((benefit, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-support-2">
            <AppIcon name="check" size={16} className="mt-0.5 text-primary flex-shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex gap-2">
        {isFree ? (
          <Button
            variant="primary"
            size="md"
            onClick={onExplorePlans}
            className="flex-1"
          >
            Conheça os planos
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onManagePlan}
            className="flex-1"
          >
            Gerenciar plano
          </Button>
        )}
      </div>
    </Card>
  );
}
