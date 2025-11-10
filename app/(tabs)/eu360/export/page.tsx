'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMoodEntries } from '@/app/lib/moodStore.client';
import { getPlannerItemsWithin } from '@/app/lib/plannerStore.client';
import { EmotionTrendMini } from '@/components/charts/EmotionTrendChart';
import { isEnabled } from '@/app/lib/flags.client';
import { trackTelemetry } from '@/app/lib/telemetry';
import { Button } from '@/components/ui/Button';
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
  const router = useRouter();
  const qs = useSearchParams();
  const ffEnabled = isEnabled('FF_EXPORT_PDF');
  const range = (qs.get('range') as 'weekly' | 'monthly') || 'weekly';
  const today = new Date();
  const start = range === 'monthly' ? addDays(today, -27) : addDays(today, -6);

  // Data
  const mood = getMoodEntries().filter((e) => new Date(e.date) >= start);
  const planner = getPlannerItemsWithin(range === 'monthly' ? 28 : 7);

  // Stats
  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  const avgMood = avg(mood.map((m) => m.mood));
  const avgEnergy = avg(mood.map((m) => m.energy));
  const totalDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const trackedDays = new Set(mood.map((m) => m.date)).size;

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
          <Button variant="primary" onClick={() => router.push('/eu360')}>
            Voltar ao Eu360
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[840px] p-4 md:p-8 bg-white text-ink-1 min-h-screen">
      {/* ===== Cover ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-[#FFE5EF] to-white p-6 md:p-8 shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-ink-1">
                Relatório {range === 'monthly' ? 'Mensal' : 'Semanal'}
              </h1>
              <p className="text-sm text-support-2 mt-2">
                Período: {formatDate(start)} – {formatDate(today)}
              </p>
            </div>
            {/* Brand circle placeholder */}
            <div className="rounded-full w-12 h-12 bg-[#ffd8e6] border border-white/60 flex-shrink-0" aria-hidden />
          </div>
          <div className="mt-4">
            <p className="text-sm text-support-1">
              Resumo do seu bem-estar emocional e das pequenas ações que fizeram a diferença.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft">
              <div className="text-xs text-support-2">Média de Humor</div>
              <div className="text-xl font-bold text-primary mt-2">{avgMood || '–'}</div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft">
              <div className="text-xs text-support-2">Média de Energia</div>
              <div className="text-xl font-bold text-primary mt-2">{avgEnergy || '–'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Quick Stats ===== */}
      <section className="mb-8 print-avoid-break-inside">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft text-center">
            <div className="text-xs text-support-2">Registros</div>
            <div className="text-lg font-bold text-primary mt-1">{mood.length}</div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft text-center">
            <div className="text-xs text-support-2">Dias Rastreados</div>
            <div className="text-lg font-bold text-primary mt-1">
              {trackedDays}/{totalDays}
            </div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft text-center">
            <div className="text-xs text-support-2">Taxa de Preenchimento</div>
            <div className="text-lg font-bold text-primary mt-1">
              {totalDays > 0 ? Math.round((trackedDays / totalDays) * 100) : 0}%
            </div>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft text-center">
            <div className="text-xs text-support-2">Itens Planejados</div>
            <div className="text-lg font-bold text-primary mt-1">{planner.length}</div>
          </div>
        </div>
      </section>

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

      {/* ===== Weekly/Monthly Planner ===== */}
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
      <div className="no-print fixed right-4 bottom-4 flex flex-col gap-2 md:flex-row md:gap-2 sm:gap-2">
        <select
          className="rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm font-medium text-support-1 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={range}
          onChange={(e) => router.replace(`/eu360/export?range=${e.target.value}`)}
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

      <style jsx global>{`
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
    </div>
  );
}
