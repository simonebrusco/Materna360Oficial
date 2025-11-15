'use client'

const KEY = (id: string) => `m360:audio:${id}:progress`

export function readProgress(id: string): number {
  try {
    const raw = localStorage.getItem(KEY(id))
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export function writeProgress(id: string, seconds: number) {
  try {
    localStorage.setItem(KEY(id), String(Math.max(0, Math.floor(seconds))))
  } catch {}
}

export function clearProgress(id: string) {
  try {
    localStorage.removeItem(KEY(id))
  } catch {}
}
