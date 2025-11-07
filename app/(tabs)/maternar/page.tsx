import { redirect } from 'next/navigation';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
import { isEnabled } from '@/app/lib/flags';
import { trackTelemetry } from '@/app/lib/telemetry';

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
};

export default function MaternarPage() {
  // Redirect if flag is disabled
  if (!isEnabled('FF_MATERNAR_HUB')) {
    redirect('/meu-dia');
  }

  // Log page view for telemetry (client-side will also log)
  void trackTelemetry('maternar.page_view', {
    timestamp: new Date().toISOString(),
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <div className="mx-auto max-w-6xl px-0">
        <HubHeader
          greeting="Bem-vinda ao Maternar"
          subtitle="Como você quer se cuidar hoje?"
        />
        <CardHub />
      </div>
    </main>
  );
}
