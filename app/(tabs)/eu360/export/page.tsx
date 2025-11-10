'use client';

import * as React from 'react';
import HydrationGate from '@/components/common/HydrationGate';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMoodEntries } from '@/app/lib/moodStore.client';
import { getPlannerItemsWithin } from '@/app/lib/plannerStore.client';
import { getSavedCoachFocus } from '@/app/lib/coachMaterno.client';
import { EmotionTrendMini } from '@/components/charts/EmotionTrendChart';
import { isEnabled } from '@/app/lib/flags.client';
import { trackTelemetry } from '@/app/lib/telemetry';
import { PremiumCover } from '@/components/pdf/PremiumCover';
import { SummaryBlock } from '@/components/pdf/SummaryBlock';
import PaywallModal from '@/components/paywall/PaywallModal';

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function ExportReportPage() {
  const [paywall, setPaywall] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();
  const qs = useSearchParams();

  // Freeze "today" once on client to avoid SSR/client drift
  const [today] = React.useState<Date>(() => new Date());

  // Initialize client flag after hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const ffEnabled = isEnabled('FF_EXPORT_PDF');
  const range = (qs.get('range') as 'weekly' | 'monthly') || 'weekly';
  const start = range === 'monthly' ? addDays(today, -27) : addDays(today, -6);
  const periodText = `Período: ${formatDate(start)} – ${formatDate(today)}`;

  // Data
  const mood = getMoodEntries().filter((e) => new Date(e.date) >= start);
  const planner = getPlannerItemsWithin(range === 'monthly' ? 28 : 7);
  const coachFocus = getSavedCoachFocus();

  // Stats
  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  const avgMood = avg(mood.map((m) => m.mood)) || '—';
  const avgEnergy = avg(mood.map((m) => m.energy)) || '—';

  React.useEffect(() => {
    // Track export page view
    try {
      trackTelemetry('pdf.export_view', { range, tab: 'eu360' });
    } catch {}

    // Remove visual clutter when printing
    document.body.classList.add('print-bg-white');
    return () => document.body.classList.remove('print-bg-white');
  }, [range]);

  if (!ffEnabled) {
    return (
      <div className="mx-auto max-w-[840px] p-4 md:p-8 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink-1 mb-4">Recurso não disponível</h1>
          <p className="text-support-2 mb-6">
            A exportação de PDF está em fase de testes. Por favor, tente novamente mais tarde.
          </p>
          <button
            onClick={() => router.push('/eu360')}
            className="rounded-xl px-4 py-2 bg-primary text-white font-medium hover:opacity-95"
          >
            Voltar ao Eu360
          </button>
        </div>
      </div>
    );
  }

  return (
    <HydrationGate
      as="div"
      className="mx-auto max-w-[840px] p-4 md:p-8 bg-white text-ink-1 min-h-screen"
      fallback={
        <div className="mx-auto max-w-[840px] p-4 md:p-8 bg-white rounded-2xl border animate-pulse" style={{ minHeight: 480 }} />
      }
    >
      {/* ===== Branded Premium Cover ===== */}
      <PremiumCover
        title={`Relatório ${range === 'monthly' ? 'Mensal' : 'Semanal'}`}
        period={periodText}
        kpis={[
          { label: 'Humor médio', value: avgMood },
          { label: 'Energia média', value: avgEnergy },
          { label: 'Registros', value: mood.length },
          { label: 'Itens do planner', value: planner.length },
        ]}
      />

      {/* ===== Dynamic Summary Block ===== */}
      <SummaryBlock
        focus={coachFocus}
        avgMood={avgMood as number | string}
        avgEnergy={avgEnergy as number | string}
        totalEntries={mood.length}
        plannerCount={planner.length}
      />

      {/* ===== Trend Chart (inline SVG) ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">
          Tendência (últimos {range === 'monthly' ? 28 : 7} dias)
        </h2>
        <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft">
          {mood.length > 0 ? (
            <>
              <EmotionTrendMini data={mood} />
              <p className="text-xs text-support-2 mt-2">
                Linha 1 = Humor (#ff005e) · Linha 2 = Energia (#2f3a56)
              </p>
            </>
          ) : (
            <p className="text-sm text-support-2 py-8">
              Sem dados suficientes por enquanto. Registre seu humor no Meu Dia para visualizar a tendência.
            </p>
          )}
        </div>
      </section>

      {/* ===== Weekly/Monthly Planner Table ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">
          Planner {range === 'monthly' ? 'do período' : 'da semana'}
        </h2>
        {planner.length > 0 ? (
          <div className="rounded-xl border border-white/60 bg-white/90 overflow-hidden shadow-soft text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/60 bg-white/60">
                  <th className="text-left p-2.5 font-semibold text-support-1">Data</th>
                  <th className="text-left p-2.5 font-semibold text-support-1">Item</th>
                  <th className="text-left p-2.5 font-semibold text-support-1">Status</th>
                  <th className="text-left p-2.5 font-semibold text-support-1">Notas</th>
                </tr>
              </thead>
              <tbody>
                {planner.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-white/60 last:border-b-0 ${
                      idx % 2 === 0 ? 'bg-white/40' : 'bg-white/80'
                    }`}
                  >
                    <td className="p-2.5 text-support-1">{item.date}</td>
                    <td className="p-2.5 text-support-1 font-medium">{item.title}</td>
                    <td className="p-2.5 text-center">
                      {item.done ? (
                        <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          Concluído
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-full bg-support-2/10 text-xs font-semibold text-support-2">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-support-2">{item.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-soft text-sm text-support-2">
            Sem itens planejados. Adicione tarefas no Meu Dia para vê-las aqui.
          </div>
        )}
      </section>

      {/* ===== Achievements & Highlights ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Conquistas & Destaques</h2>
        <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-soft text-sm text-support-1">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Pequena vitória da semana: _________________________________</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Um momento especial para lembrar: __________________________</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Intenção para a próxima semana: ______________________________</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== Reflection Space ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Reflexões Pessoais</h2>
        <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-soft text-sm text-support-2 min-h-[120px]">
          <p className="italic">
            Use este espaço para anotar reflexões sobre o período, padrões identificados ou aprendizados importantes.
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="mt-12 pt-6 border-t border-white/60 text-center print-avoid-break-inside">
        <p className="text-xs text-support-2">
          Materna360 — Relatório gerado em {formatDate(today)}. Para uso pessoal. Este documento não substitui
          orientação profissional.
        </p>
      </footer>

      {/* ===== Print Controls (hidden on print) ===== */}
      {isClient && (
        <div className="no-print fixed right-4 bottom-4 flex flex-col gap-2 md:flex-row md:gap-2 sm:gap-2">
          <select
            className="rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm font-medium text-support-1 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={range}
            onChange={(e) => router.replace(`/eu360/export?range=${e.target.value}`)}
            suppressHydrationWarning
          >
            <option value="weekly">Semanal (7 dias)</option>
            <option value="monthly">Mensal (28 dias)</option>
          </select>
          <button
            className="rounded-xl px-3 py-2 bg-primary text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all shadow-soft"
            onClick={() => {
              if (isEnabled('FF_PAYWALL_MODAL')) {
                const premium = localStorage.getItem('m360_premium') === '1';
                if (!premium) {
                  setPaywall(true);
                  try {
                    trackTelemetry('paywall.block_trigger', { feature: 'export_pdf' });
                  } catch {}
                  return;
                }
              }
              try {
                trackTelemetry('pdf.export_print', { range, tab: 'eu360' });
              } catch {}
              window.print();
            }}
          >
            Baixar PDF
          </button>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        open={paywall}
        onClose={() => {
          setPaywall(false);
          try {
            trackTelemetry('paywall.dismiss', { feature: 'export_pdf' });
          } catch {}
        }}
        onUpgrade={() => {
          try {
            trackTelemetry('paywall.upgrade_click', { feature: 'export_pdf' });
          } catch {}
          window.location.href = '/planos';
        }}
      />

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body.print-bg-white {
            background: #fff !important;
          }
          @page {
            margin: 12mm;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </HydrationGate>
  );
}
