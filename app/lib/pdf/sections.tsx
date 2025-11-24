/**
 * @react-pdf/renderer section components
 * Reusable PDF sections for Wellness and Insights reports
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfTheme, pdfStyles } from './theme';

// ============ Cover Section ============
export function Cover({
  title,
  subtitle,
  date,
}: {
  title: string;
  subtitle: string;
  date: string;
}) {
  return (
    <View
      style={{
        ...pdfStyles.cover,
        justifyContent: 'center',
        minHeight: 400,
        backgroundColor: pdfTheme.colors.softBg,
        borderRadius: pdfTheme.radius.cardLg,
        padding: pdfTheme.spacing.l,
      }}
    >
      <Text
        style={{
          ...pdfTheme.typography.display,
          color: pdfTheme.colors.primary,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        {subtitle}
      </Text>
      <Text
        style={{
          ...pdfTheme.typography.bodySm,
          color: pdfTheme.colors.ink2,
        }}
      >
        {date}
      </Text>
    </View>
  );
}

// ============ Table of Contents ============
export function ToC({
  entries,
}: {
  entries: Array<{ label: string; pageNumber?: number }>;
}) {
  return (
    <View style={pdfStyles.toc}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.l,
        }}
      >
        Índice
      </Text>
      {entries.map((entry, idx) => (
        <View key={idx} style={pdfStyles.tocEntry}>
          <Text style={{ fontSize: 12, color: pdfTheme.colors.ink1 }}>
            • {entry.label}
            {entry.pageNumber && ` .... ${entry.pageNumber}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============ Mood & Energy (30-day) ============
export function MoodEnergy30d({
  data,
}: {
  data: Array<{
    date: string;
    mood: number;
    energy: number;
  }>;
}) {
  const avgMood =
    data.length > 0
      ? (data.reduce((a, b) => a + b.mood, 0) / data.length).toFixed(1)
      : '—';
  const avgEnergy =
    data.length > 0
      ? (data.reduce((a, b) => a + b.energy, 0) / data.length).toFixed(1)
      : '—';

  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Humor & Energia (últimos 30 dias)
      </Text>

      {/* Stats */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          marginBottom: pdfTheme.spacing.l,
          gap: pdfTheme.spacing.m,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: pdfTheme.spacing.m,
            backgroundColor: pdfTheme.colors.softBg,
            borderRadius: pdfTheme.radius.card,
          }}
        >
          <Text
            style={{
              ...pdfTheme.typography.bodySm,
              color: pdfTheme.colors.ink2,
              marginBottom: 4,
            }}
          >
            Humor Médio
          </Text>
          <Text
            style={{
              ...pdfTheme.typography.h3,
              color: pdfTheme.colors.primary,
            }}
          >
            {avgMood}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: pdfTheme.spacing.m,
            backgroundColor: pdfTheme.colors.softBg,
            borderRadius: pdfTheme.radius.card,
          }}
        >
          <Text
            style={{
              ...pdfTheme.typography.bodySm,
              color: pdfTheme.colors.ink2,
              marginBottom: 4,
            }}
          >
            Energia Média
          </Text>
          <Text
            style={{
              ...pdfTheme.typography.h3,
              color: pdfTheme.colors.primary,
            }}
          >
            {avgEnergy}
          </Text>
        </View>
      </View>

      {/* Data note */}
      <Text
        style={{
          ...pdfTheme.typography.bodySm,
          color: pdfTheme.colors.ink2,
        }}
      >
        Total de registros: {data.length} dias
      </Text>
    </View>
  );
}

// ============ Today's Planner Snapshot ============
export function PlannerSnapshot({
  today,
}: {
  today: Array<{ title: string; done?: boolean }>;
}) {
  const total = today.length;
  const completed = today.filter((t) => t.done).length;

  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Planner de Hoje
      </Text>

      {/* Progress */}
      <View
        style={{
          padding: pdfTheme.spacing.m,
          backgroundColor: pdfTheme.colors.softBg,
          borderRadius: pdfTheme.radius.card,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        <Text
          style={{
            ...pdfTheme.typography.bodySm,
            color: pdfTheme.colors.ink2,
            marginBottom: 8,
          }}
        >
          Progresso: {completed}/{total} tarefas
        </Text>
        <Text
          style={{
            ...pdfTheme.typography.body,
            color: pdfTheme.colors.primary,
            fontWeight: 600,
          }}
        >
          {total > 0 ? Math.round((completed / total) * 100) : 0}% concluído
        </Text>
      </View>

      {/* Tasks list */}
      {today.length > 0 ? (
        <View>
          {today.slice(0, 5).map((task, idx) => (
            <Text
              key={idx}
              style={{
                ...pdfTheme.typography.body,
                color: pdfTheme.colors.ink1,
                marginBottom: 4,
                textDecoration: task.done ? 'line-through' : 'none',
                opacity: task.done ? 0.6 : 1,
              }}
            >
              {task.done ? '✓' : '○'} {task.title}
            </Text>
          ))}
          {today.length > 5 && (
            <Text
              style={{
                ...pdfTheme.typography.bodySm,
                color: pdfTheme.colors.ink2,
                fontStyle: 'italic',
                marginTop: 8,
              }}
            >
              +{today.length - 5} mais tarefas
            </Text>
          )}
        </View>
      ) : (
        <Text
          style={{
            ...pdfTheme.typography.bodySm,
            color: pdfTheme.colors.ink2,
            fontStyle: 'italic',
          }}
        >
          Nenhuma tarefa para hoje
        </Text>
      )}
    </View>
  );
}

// ============ Coach v0.2 Tips ============
export function CoachTips({
  tips,
}: {
  tips: Array<{ title: string; description?: string }>;
}) {
  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Dicas Personalizadas
      </Text>

      {tips.length > 0 ? (
        tips.slice(0, 3).map((tip, idx) => (
          <View
            key={idx}
            style={{
              marginBottom: pdfTheme.spacing.m,
              paddingBottom: pdfTheme.spacing.m,
              borderBottom:
                idx < tips.length - 1
                  ? `1px solid ${pdfTheme.colors.borderLight}`
                  : 'none',
            }}
          >
            <Text
              style={{
                ...pdfTheme.typography.h3,
                color: pdfTheme.colors.primary,
                marginBottom: 4,
              }}
            >
              {tip.title}
            </Text>
            {tip.description && (
              <Text
                style={{
                  ...pdfTheme.typography.body,
                  color: pdfTheme.colors.ink2,
                }}
              >
                {tip.description}
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text
          style={{
            ...pdfTheme.typography.bodySm,
            color: pdfTheme.colors.ink2,
            fontStyle: 'italic',
          }}
        >
          Nenhuma dica disponível no momento
        </Text>
      )}
    </View>
  );
}

// ============ Highlights ============
export function Highlights({
  items,
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Destaques
      </Text>

      <View style={{ display: 'flex', flexDirection: 'row', gap: pdfTheme.spacing.m, flexWrap: 'wrap' }}>
        {items.map((item, idx) => (
          <View
            key={idx}
            style={{
              flex: 1,
              minWidth: 120,
              padding: pdfTheme.spacing.m,
              backgroundColor: pdfTheme.colors.softBg,
              borderRadius: pdfTheme.radius.card,
            }}
          >
            <Text
              style={{
                ...pdfTheme.typography.bodySm,
                color: pdfTheme.colors.ink2,
                marginBottom: 4,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                ...pdfTheme.typography.h3,
                color: pdfTheme.colors.primary,
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============ Insights Metrics ============
export function InsightsMetrics({
  counters7d,
  counters30d,
  topActions,
}: {
  counters7d: Record<string, number>;
  counters30d: Record<string, number>;
  topActions: Array<{ event: string; count: number }>;
}) {
  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Métricas de Engajamento
      </Text>

      {/* 7d / 30d summary */}
      <View style={{ marginBottom: pdfTheme.spacing.l }}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: pdfTheme.spacing.m,
            marginBottom: pdfTheme.spacing.m,
          }}
        >
          <View
            style={{
              flex: 1,
              padding: pdfTheme.spacing.m,
              backgroundColor: pdfTheme.colors.softBg,
              borderRadius: pdfTheme.radius.card,
            }}
          >
            <Text
              style={{
                ...pdfTheme.typography.bodySm,
                color: pdfTheme.colors.ink2,
                marginBottom: 4,
              }}
            >
              Últimos 7 dias
            </Text>
            <Text
              style={{
                ...pdfTheme.typography.h3,
                color: pdfTheme.colors.primary,
              }}
            >
              {Object.values(counters7d).reduce((a, b) => a + b, 0)}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: pdfTheme.spacing.m,
              backgroundColor: pdfTheme.colors.softBg,
              borderRadius: pdfTheme.radius.card,
            }}
          >
            <Text
              style={{
                ...pdfTheme.typography.bodySm,
                color: pdfTheme.colors.ink2,
                marginBottom: 4,
              }}
            >
              Últimos 30 dias
            </Text>
            <Text
              style={{
                ...pdfTheme.typography.h3,
                color: pdfTheme.colors.primary,
              }}
            >
              {Object.values(counters30d).reduce((a, b) => a + b, 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Top actions */}
      <Text
        style={{
          ...pdfTheme.typography.h3,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Ações Principais
      </Text>
      {topActions.slice(0, 5).map((action, idx) => (
        <View
          key={idx}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom:
              idx < topActions.length - 1
                ? `1px solid ${pdfTheme.colors.borderLight}`
                : 'none',
          }}
        >
          <Text
            style={{
              ...pdfTheme.typography.body,
              color: pdfTheme.colors.ink1,
              flex: 1,
            }}
          >
            {action.event}
          </Text>
          <Text
            style={{
              ...pdfTheme.typography.body,
              color: pdfTheme.colors.primary,
              fontWeight: 600,
            }}
          >
            {action.count}x
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============ Aggregated Trends ============
export function AggregatedTrends({
  series,
  label,
}: {
  series: number[];
  label: string;
}) {
  const avg = series.length > 0 ? (series.reduce((a, b) => a + b, 0) / series.length).toFixed(1) : '—';

  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.h2,
          color: pdfTheme.colors.ink1,
          marginBottom: pdfTheme.spacing.m,
        }}
      >
        Tendência: {label}
      </Text>

      <View
        style={{
          padding: pdfTheme.spacing.m,
          backgroundColor: pdfTheme.colors.softBg,
          borderRadius: pdfTheme.radius.card,
        }}
      >
        <Text
          style={{
            ...pdfTheme.typography.bodySm,
            color: pdfTheme.colors.ink2,
            marginBottom: 8,
          }}
        >
          Média: <Text style={{ fontWeight: 600, color: pdfTheme.colors.primary }}>{avg}</Text>
        </Text>
        <Text
          style={{
            ...pdfTheme.typography.bodySm,
            color: pdfTheme.colors.ink2,
          }}
        >
          Dias com dados: {series.length}
        </Text>
      </View>
    </View>
  );
}

// ============ Privacy Note ============
export function PrivacyNote() {
  return (
    <View style={{ marginBottom: pdfTheme.spacing.l }}>
      <Text
        style={{
          ...pdfTheme.typography.bodySm,
          color: pdfTheme.colors.ink2,
          fontStyle: 'italic',
        }}
      >
        Nota de Privacidade: Este relatório foi gerado localmente usando dados armazenados no seu dispositivo. Nenhuma informação pessoal foi enviada para servidores externos.
      </Text>
    </View>
  );
}

// ============ Footer ============
export function Footer({
  pageNumber,
  totalPages,
}: {
  pageNumber: number;
  totalPages?: number;
}) {
  return (
    <View
      style={{
        ...pdfStyles.pageNumber,
        borderTop: `1px solid ${pdfTheme.colors.borderLight}`,
        paddingTop: pdfTheme.spacing.m,
      }}
    >
      <Text>
        {pageNumber}
        {totalPages && ` / ${totalPages}`}
      </Text>
    </View>
  );
}
