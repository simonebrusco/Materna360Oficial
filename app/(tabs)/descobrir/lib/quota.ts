'use client'

import { gate } from '@/app/lib/gate'

/**
 * Brazil YYYYMMDD key using Sao Paulo offset (no server needed)
 * Converts a Date to local YYYYMMDD format respecting Brazil timezone
 */
export function getBrazilDateKeyFor(d: Date) {
  const tzOffset = d.getTimezoneOffset() * 60000
  const local = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10) // YYYY-MM-DD
  return local.replaceAll('-', '')
}

const KEY = (dk: string) => `descobrir:${dk}:savedCount`

/**
 * Read today's save count from localStorage
 * Safe: returns { dateKey, count: 0 } on error
 */
export function readTodayCount() {
  const dk = getBrazilDateKeyFor(new Date())
  try {
    const raw = localStorage.getItem(KEY(dk))
    const n = raw ? Number(raw) : 0
    return { dateKey: dk, count: Number.isFinite(n) ? n : 0 }
  } catch {
    return { dateKey: dk, count: 0 }
  }
}

/**
 * Increment today's save count by 1
 * Idempotent: silently fails if localStorage unavailable
 */
export function incTodayCount() {
  try {
    const { dateKey, count } = readTodayCount()
    localStorage.setItem(KEY(dateKey), String(count + 1))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Reset counter if new day (noop by design, since count is keyed by date)
 * Kept for clarity and future extensibility
 */
export function resetIfNewDay() {
  // noop by design
  return
}

/**
 * Check if more saves are allowed today
 * Returns { allowed: boolean, count: number, limit: number | Infinity }
 */
export function canSaveMore() {
  const { count } = readTodayCount()
  const q = gate('ideas.dailyQuota')
  const limit = typeof q.limit === 'number' ? q.limit : Infinity
  return { allowed: count < limit, count, limit }
}
