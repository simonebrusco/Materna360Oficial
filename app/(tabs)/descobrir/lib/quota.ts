'use client'

import { gate } from '@/app/lib/gate'

export function getBrazilDateKeyFor(d: Date) {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return iso.replaceAll('-', '')
}

const KEY = (dk: string) => `descobrir:${dk}:savedCount`

export function readTodayCount() {
  try {
    const dk = getBrazilDateKeyFor(new Date())
    const raw = localStorage.getItem(KEY(dk))
    return { dateKey: dk, count: raw ? Number(raw) || 0 : 0 }
  } catch {
    return { dateKey: getBrazilDateKeyFor(new Date()), count: 0 }
  }
}

export function incTodayCount() {
  try {
    const { dateKey, count } = readTodayCount()
    localStorage.setItem(KEY(dateKey), String(count + 1))
  } catch {
    // Silent fail - local storage not available
  }
}

export function canSaveMore() {
  const { count } = readTodayCount()
  const q = gate('ideas.dailyQuota')
  const limit = typeof q.limit === 'number' ? q.limit : Infinity
  return { allowed: count < limit, count, limit }
}
