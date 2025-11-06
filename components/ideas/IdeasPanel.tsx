'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { useIdeasQuota, type PlanTier } from './useIdeasQuota';

interface IdeaCard {
  id: string;
  title: string;
  description: string;
  duration: string;
  age_range: string;
}

const MOCK_IDEAS: Record<number, IdeaCard> = {
  0: {
    id: 'idea-1',
    title: 'Brincadeira Sensorial: Exploração Tátil',
    description: 'Atividade para estimular os sentidos. Use texturas diferentes (algodão, papel, plástico).',
    duration: '10 minutos',
    age_range: '0-24 meses',
  },
  1: {
    id: 'idea-2',
    title: 'Respiração em 4 Tempos',
    description: 'Técnica simples para acalmar você e as crianças. Inspire por 4, segure por 4, expire por 4.',
    duration: '5 minutos',
    age_range: '12+ meses',
  },
  2: {
    id: 'idea-3',
    title: 'Receita Rápida: Papinha Caseira',
    description: 'Prepare uma papinha nutritiva em menos de 15 minutos com ingredientes que você tem em casa.',
    duration: '15 minutos',
    age_range: '6-36 meses',
  },
};

interface IdeasPanelProps {
  initialPlan?: PlanTier;
}

export function IdeasPanel({ initialPlan = 'Free' }: IdeasPanelProps) {
  const quota = useIdeasQuota(initialPlan);
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { show: showToast } = useToast();

  const handleGenerateIdea = async () => {
    if (!quota.canGenerate) {
      console.log('[telemetry] ideas.quota_exceeded', { tier: quota.tier });
      return;
    }

    setButtonDisabled(true);
    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate deterministic idea based on usedToday
    const ideaIndex = quota.usedToday % Object.keys(MOCK_IDEAS).length;
    const newIdea = MOCK_IDEAS[ideaIndex];

    setIdeas((prev) => [newIdea, ...prev]);
    quota.generateIdea();

    setIsGenerating(false);

    // Throttle button for UX (3-5s)
    setTimeout(() => {
      setButtonDisabled(false);
    }, 3000);

    showToast(`Ideia gerada: "${newIdea.title}"`, 'success');
    console.log('[telemetry] ideas.generated', { idea: newIdea.id, tier: quota.tier });
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleGenerateIdea}
        disabled={buttonDisabled || !quota.canGenerate}
        className="w-full"
      >
        {isGenerating ? 'Gerando ideia...' : 'Gerar Ideia'}
      </Button>

      {/* Error State when limit reached */}
      {quota.isLimitReached && (
        <ErrorState
          title="Você atingiu seu limite diário"
          description={`No plano ${quota.tier} você tem até ${quota.limit} ideias por dia. Volte amanhã ou experimente um plano superior.`}
          actionLabel="Conheça os planos"
          onAction={() => {
            window.location.href = '/planos';
          }}
        />
      )}

      {/* Loading State */}
      {isGenerating && (
        <Skeleton variant="card" count={1} />
      )}

      {/* Ideas List */}
      {ideas.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-support-1">Suas ideias ({ideas.length})</p>
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="rounded-2xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5"
            >
              <h4 className="text-base font-semibold text-support-1 mb-2">{idea.title}</h4>
              <p className="text-sm text-support-2 mb-3">{idea.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-support-3">
                <span>⏱️ {idea.duration}</span>
                <span>👶 {idea.age_range}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && ideas.length === 0 && (
        <p className="text-center text-sm text-support-2 py-6">
          Clique em "Gerar Ideia" para descobrir atividades personalizadas.
        </p>
      )}
    </div>
  );
}
