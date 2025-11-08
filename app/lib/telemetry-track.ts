'use client'

export { trackTelemetry } from './telemetry'

/**
 * Unified event schema for telemetry tracking
 */
export interface EventBase {
  event: string
  tab?: 'meu-dia' | 'cuidar' | 'descobrir' | 'eu360' | 'maternar'
  component?: string
  action?: string
  id?: string
  payload?: Record<string, unknown>
  ts?: number
}

/**
 * Supported event names per tab
 */
export type EventName =
  // Navigation
  | 'nav.click'
  // Maternar
  | 'maternar.page_view'
  | 'maternar.card_click'
  | 'maternar.highlight_click'
  // Planner (Meu Dia)
  | 'planner.item_add'
  | 'planner.item_done'
  // Mood (Meu Dia)
  | 'mood.checkin'
  // Care (Cuidar)
  | 'care.log_add'
  | 'care.view_section'
  // Discover
  | 'discover.filter_changed'
  | 'discover.suggestion_started'
  | 'discover.suggestion_saved'
  // Eu360
  | 'eu360.diary_add'
  | 'eu360.summary_view'
  // Paywall
  | 'paywall.view'
  | 'paywall.click'
  // Allow custom events
  | (string & {})

/**
 * Fire-and-forget unified telemetry tracking
 * - Logs to console in dev mode
 * - Posts to endpoint in production
 * - Never blocks UI or throws errors
 */
export function track(event: EventBase & { event: EventName }): void {
  try {
    // Add timestamp if not provided
    const enriched = {
      ...event,
      ts: event.ts || Date.now(),
    }

    // Call existing telemetry system (fire-and-forget)
    trackTelemetry(enriched.event, enriched.payload ?? {}, {
      tab: enriched.tab,
      component: enriched.component,
      action: enriched.action,
      id: enriched.id,
    })

    // Optionally post to endpoint (non-blocking)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Fire-and-forget POST (don't await, don't care about response)
      void fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched),
      }).catch(() => {
        // Silently ignore network errors
      })
    }
  } catch {
    // Never propagate errors - logging should never break the app
  }
}

/**
 * Convenience helper to track navigation clicks
 */
export function trackNavClick(href: string, label: string, from?: string): void {
  track({
    event: 'nav.click',
    action: 'navigate',
    id: href,
    payload: { href, label, from },
  })
}

/**
 * Convenience helper to track card clicks
 */
export function trackCardClick(
  tab: string,
  cardName: string,
  cardId: string,
  href?: string
): void {
  track({
    event: `${tab}.card_click`,
    tab: tab as any,
    component: 'card',
    action: 'click',
    id: cardId,
    payload: { cardName, href },
  })
}

/**
 * Convenience helper to track filter changes
 */
export function trackFilterChange(
  filterType: string,
  filterValue?: string,
  appliedFilters?: Record<string, string>
): void {
  track({
    event: 'discover.filter_changed',
    tab: 'descobrir',
    component: 'filter',
    action: 'changed',
    payload: { filterType, filterValue, appliedFilters },
  })
}
