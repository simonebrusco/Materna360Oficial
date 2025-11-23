/**
 * PDF document builder for Wellness and Insights reports
 * Uses @react-pdf/renderer to compose Documents
 * Returns Promise<Blob>
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  pdf,
} from '@react-pdf/renderer';
import { pdfTheme, pdfStyles } from './theme';
import {
  Cover,
  ToC,
  MoodEnergy30d,
  PlannerSnapshot,
  CoachTips,
  Highlights,
  InsightsMetrics,
  AggregatedTrends,
  PrivacyNote,
  Footer,
} from './sections';

/**
 * Build wellness report document
 * Data sources: localStorage (mood, planner, coach)
 */
async function buildWellnessReport(data: {
  moodEntries: Array<{ date: string; mood: number; energy: number }>;
  todayTasks: Array<{ title: string; done?: boolean }>;
  coachTips: Array<{ title: string; description?: string }>;
}): Promise<Blob> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');

  const highlights = [
    { label: 'Dias Registrados', value: data.moodEntries.length },
    { label: 'Tarefas Hoje', value: data.todayTasks.length },
    {
      label: 'Concluídas',
      value: data.todayTasks.filter((t) => t.done).length,
    },
    { label: 'Taxa de Conclusão', value: data.todayTasks.length > 0 ? `${Math.round((data.todayTasks.filter((t) => t.done).length / data.todayTasks.length) * 100)}%` : '—' },
  ];

  const WellnessDocument = () => (
    <Document title={`Wellness Report - ${dateStr}`}>
      {/* Page 1: Cover + ToC */}
      <Page size="A4" style={pdfTheme.page}>
        <Cover
          title="Relatório de Bem-Estar"
          subtitle="Seu Resumo Pessoal"
          date={dateStr}
        />
        <ToC
          entries={[
            { label: 'Humor & Energia' },
            { label: 'Planner de Hoje' },
            { label: 'Dicas Personalizadas' },
            { label: 'Destaques' },
          ]}
        />
        <Footer pageNumber={1} totalPages={4} />
      </Page>

      {/* Page 2: Mood & Energy */}
      <Page size="A4" style={pdfTheme.page}>
        <MoodEnergy30d data={data.moodEntries} />
        <Footer pageNumber={2} totalPages={4} />
      </Page>

      {/* Page 3: Planner + Coach */}
      <Page size="A4" style={pdfTheme.page}>
        <PlannerSnapshot today={data.todayTasks} />
        <CoachTips tips={data.coachTips} />
        <Footer pageNumber={3} totalPages={4} />
      </Page>

      {/* Page 4: Highlights + Footer */}
      <Page size="A4" style={pdfTheme.page}>
        <Highlights items={highlights} />
        <View style={{ marginTop: pdfTheme.spacing.l }}>
          <Text
            style={{
              ...pdfTheme.typography.bodySm,
              color: pdfTheme.colors.ink2,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Relatório gerado em {now.toLocaleString('pt-BR')}
          </Text>
          <Text
            style={{
              ...pdfTheme.typography.meta,
              color: pdfTheme.colors.ink2,
              textAlign: 'center',
              marginTop: pdfTheme.spacing.m,
            }}
          >
            Materna360 • Bem-estar para Mães Conscientes
          </Text>
        </View>
        <Footer pageNumber={4} totalPages={4} />
      </Page>
    </Document>
  );

  return pdf(<WellnessDocument />).toBlob();
}

/**
 * Build internal insights report document
 * Data sources: localStorage (telemetry events, mood trends)
 */
async function buildInsightsReport(data: {
  counters7d: Record<string, number>;
  counters30d: Record<string, number>;
  topActions: Array<{ event: string; count: number }>;
  moodSeries: number[];
  energySeries: number[];
}): Promise<Blob> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');

  const InsightsDocument = () => (
    <Document title={`Internal Insights - ${dateStr}`}>
      {/* Page 1: Cover + ToC */}
      <Page size="A4" style={pdfTheme.page}>
        <Cover
          title="Relatório de Insights"
          subtitle="Métricas de Engajamento Interno"
          date={dateStr}
        />
        <ToC
          entries={[
            { label: 'Métricas de Engajamento' },
            { label: 'Tendências' },
            { label: 'Nota de Privacidade' },
          ]}
        />
        <Footer pageNumber={1} totalPages={3} />
      </Page>

      {/* Page 2: Metrics + Trends */}
      <Page size="A4" style={pdfTheme.page}>
        <InsightsMetrics
          counters7d={data.counters7d}
          counters30d={data.counters30d}
          topActions={data.topActions}
        />
        <Footer pageNumber={2} totalPages={3} />
      </Page>

      {/* Page 3: Trends + Privacy + Build Info */}
      <Page size="A4" style={pdfTheme.page}>
        <AggregatedTrends series={data.moodSeries} label="Humor" />
        <AggregatedTrends series={data.energySeries} label="Energia" />
        <PrivacyNote />
        <View style={{ marginTop: pdfTheme.spacing.l }}>
          <Text
            style={{
              ...pdfTheme.typography.bodySm,
              color: pdfTheme.colors.ink2,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Relatório gerado em {now.toLocaleString('pt-BR')}
          </Text>
          <Text
            style={{
              ...pdfTheme.typography.meta,
              color: pdfTheme.colors.ink2,
              textAlign: 'center',
              marginTop: pdfTheme.spacing.m,
            }}
          >
            Build: v1.0.0 (Beta) • Preview Mode
          </Text>
        </View>
        <Footer pageNumber={3} totalPages={3} />
      </Page>
    </Document>
  );

  return pdf(<InsightsDocument />).toBlob();
}

/**
 * Main export function
 * Routes to appropriate builder based on variant
 */
export async function buildReport(
  variant: 'wellness' | 'insights',
  data: any
): Promise<Blob> {
  if (variant === 'wellness') {
    return buildWellnessReport(data);
  } else if (variant === 'insights') {
    return buildInsightsReport(data);
  }
  throw new Error(`Unknown report variant: ${variant}`);
}

/**
 * Convenience function to download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
