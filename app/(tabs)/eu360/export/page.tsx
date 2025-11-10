'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMoodEntries } from '@/app/lib/moodStore.client';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import { isEnabled } from '@/app/lib/flags.client';
import { trackTelemetry } from '@/app/lib/telemetry';

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function ExportReportPage() {
  const router = useRouter();
  const qs = useSearchParams();
  const ffEnabled = isEnabled('FF_EXPORT_PDF');
  const range = (qs.get('range') as 'weekly' | 'monthly') || 'weekly';
  const today = new Date();
  const start = range === 'monthly' ? addDays(today, -27) : addDays(today, -6);
  const mood = getMoodEntries().filter((e) => new Date(e.date) >= start);

  if (!ffEnabled) {
    return (
      <div className="mx-auto max-w-[800px] p-4 md:p-8 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink-1 mb-4">Recurso não disponível</h1>
          <p className="text-support-2 mb-6">A exportação de PDF está em fase de testes. Por favor, tente novamente mais tarde.</p>
          <Button variant="primary" onClick={() => router.push('/eu360')}>
            Voltar ao Eu360
          </Button>
        </div>
      </div>
    );
  }

  // Basic stats
  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0);
  const avgMood = avg(mood.map((m) => m.mood));
  const avgEnergy = avg(mood.map((m) => m.energy));

  React.useEffect(() => {
    // Remove visual clutter when printing
    document.body.classList.add('print-bg-white');
    return () => document.body.classList.remove('print-bg-white');
  }, []);

  return (
    <div className="mx-auto max-w-[800px] p-4 md:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-1">
            Relatório {range === 'monthly' ? 'Mensal' : 'Semanal'}
          </h1>
          <p className="text-sm text-support-2 mt-2">
            Período: {formatDate(start)} – {formatDate(today)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 print-hidden">
          <select
            className="rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm font-medium text-support-1 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={range}
            onChange={(e) => router.replace(`/eu360/export?range=${e.target.value}`)}
          >
            <option value="weekly">Semanal (7 dias)</option>
            <option value="monthly">Mensal (28 dias)</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2"
          >
            <AppIcon name="download" size={16} decorative />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Resumo de Humor e Energia</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
            <p className="text-xs text-support-2">Registros no período</p>
            <p className="text-2xl font-bold text-primary mt-2">{mood.length}</p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
            <p className="text-xs text-support-2">Dias acompanhados</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {new Set(mood.map((m) => m.date)).size} de {Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1}
            </p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
            <p className="text-xs text-support-2">Humor médio</p>
            <p className="text-2xl font-bold text-primary mt-2">{avgMood.toFixed(1)}/5</p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft">
            <p className="text-xs text-support-2">Energia média</p>
            <p className="text-2xl font-bold text-primary mt-2">{avgEnergy.toFixed(1)}/5</p>
          </div>
        </div>
      </section>

      {/* Trend Data Table */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Dados por Dia</h2>
        <div className="rounded-xl border border-white/60 bg-white/80 overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 bg-white/60">
                <th className="px-4 py-2 text-left font-semibold text-support-1">Data</th>
                <th className="px-4 py-2 text-center font-semibold text-support-1">Humor</th>
                <th className="px-4 py-2 text-center font-semibold text-support-1">Energia</th>
              </tr>
            </thead>
            <tbody>
              {mood.length > 0 ? (
                mood.map((entry, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white/40' : 'bg-white/80'}>
                    <td className="px-4 py-2 text-support-1">{entry.date}</td>
                    <td className="px-4 py-2 text-center text-primary font-semibold">{entry.mood}</td>
                    <td className="px-4 py-2 text-center text-primary font-semibold">{entry.energy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-support-2">
                    Nenhum registro no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Achievements & Highlights */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Conquistas & Destaques</h2>
        <ul className="space-y-2 text-sm text-support-1">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">•</span>
            <span>Pequena vitória da semana: (preencha aqui)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">•</span>
            <span>Um momento especial para lembrar: (preencha aqui)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">•</span>
            <span>Intenção para a próxima semana: (preencha aqui)</span>
          </li>
        </ul>
      </section>

      {/* Notes Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink-1 mb-3">Reflexões Pessoais</h2>
        <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-soft text-sm text-support-2">
          <p className="italic">
            Use este espaço para anotar reflexões sobre o período, padrões identificados ou aprendizados importantes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-white/60 text-center">
        <p className="text-xs text-support-2">
          Materna360 — Relatório gerado em {formatDate(today)}. Este documento é para uso pessoal e não substitui
          orientação profissional.
        </p>
      </footer>

      <style jsx global>{`
        @media print {
          .print-hidden {
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
