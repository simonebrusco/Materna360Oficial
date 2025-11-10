'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { getMoodEntries } from '@/app/lib/moodStore.client';
import { getPlannerItemsWithin } from '@/app/lib/plannerStore.client';
import { getSavedCoachFocus } from '@/app/lib/coachMaterno.client';
import { readLocalEvents } from '@/app/lib/telemetry';
import { trackTelemetry } from '@/app/lib/telemetry';
import { isEnabled } from '@/app/lib/flags.client';

interface ExportButtonProps {
  variant: 'wellness' | 'insights';
}

export default function ExportButton({
  variant,
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check feature flag
  const ffEnabled = isEnabled('FF_PDF_EXPORT');
  if (!ffEnabled) {
    return null;
  }

  // Check data availability
  const moodData = getMoodEntries();
  const hasData = moodData.length > 0;

  const handleExport = async () => {
    if (isLoading || !hasData) return;

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      // Track start
      trackTelemetry('pdf.export_start', { variant });

      // Dynamically import PDF builder
      const { buildReport, downloadBlob } = await import(
        '@/app/lib/pdf/buildReport'
      );

      let reportData: any;
      let filename: string;

      if (variant === 'wellness') {
        // Gather wellness data
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayTasks = getPlannerItemsWithin(1).filter(
          (t) => t.date === todayStr
        );

        reportData = {
          moodEntries: getMoodEntries(),
          todayTasks,
          coachTips: [
            { title: 'Dar um tempo para si mesma', description: 'Reserve 15 minutos para uma atividade que te relaxa.' },
            { title: 'Conectar com seu filho', description: 'Uma conversa de qualidade fortalece o vínculo.' },
            { title: 'Respiração consciente', description: 'Pratique 3 respirações profundas quando se sentir estressada.' },
          ],
        };
        filename = `materna360-wellness-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.pdf`;
      } else if (variant === 'insights') {
        // Gather insights data
        const events = readLocalEvents();
        const now = Date.now();
        const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
        const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;

        const events7d = events.filter((e) => e.ts >= cutoff7d);
        const events30d = events.filter((e) => e.ts >= cutoff30d);

        // Count by event type
        const counters7d: Record<string, number> = {};
        const counters30d: Record<string, number> = {};

        events7d.forEach((e) => {
          counters7d[e.event] = (counters7d[e.event] || 0) + 1;
        });
        events30d.forEach((e) => {
          counters30d[e.event] = (counters30d[e.event] || 0) + 1;
        });

        // Top actions
        const topActions = Object.entries(counters30d)
          .map(([event, count]) => ({ event, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Mood/energy trends
        const moodData = getMoodEntries();
        const moodSeries = moodData.map((m) => m.mood);
        const energySeries = moodData.map((m) => m.energy);

        reportData = {
          counters7d,
          counters30d,
          topActions,
          moodSeries,
          energySeries,
        };
        filename = `materna360-insights-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.pdf`;
      } else {
        throw new Error(`Unknown variant: ${variant}`);
      }

      // Build PDF
      const blob = await buildReport(variant, reportData);
      const bytes = blob.size;
      const durationMs = Math.round(performance.now() - startTime);

      // Track success
      trackTelemetry('pdf.export_success', {
        variant,
        bytes,
        durationMs,
      });

      // Download
      downloadBlob(blob, filename);
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // Track error
      trackTelemetry('pdf.export_error', {
        variant,
        error: errorMsg,
        durationMs,
      });

      setError(errorMsg);
      console.error('PDF export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = variant === 'wellness' ? 'Exportar Relatório' : 'Exportar Insights';

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading || !hasData}
        aria-label="Export as PDF (Beta)"
        className={`
          inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-xs font-medium text-support-1
          hover:bg-white/95 transition-colors
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <FileDown
          size={16}
          aria-hidden="true"
          className={`${isLoading ? 'animate-pulse' : ''}`}
        />
        <span>{isLoading ? 'Exportando...' : buttonText}</span>
      </button>

      {error && (
        <div
          className="mt-2 text-xs text-primary rounded-md bg-primary/10 p-2"
          role="alert"
        >
          Erro ao exportar: {error}
        </div>
      )}

      {!hasData && (
        <div
          className="mt-2 text-xs text-support-2 rounded-md bg-support-3/10 p-2"
          role="note"
        >
          Nenhum dado disponível para exportar
        </div>
      )}
    </div>
  );
}
