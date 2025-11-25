'use client';

import { PageTemplate } from '@/components/common/PageTemplate';
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell';

export default function MeuDiaClient() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Seu Dia Organizado"
      subtitle="Um espaço para planejar com leveza."
    >
      {/* Toda a inteligência e o layout do Meu Dia ficam aqui dentro */}
      <WeeklyPlannerShell />
    </PageTemplate>
  );
}
