'use client'
import * as React from 'react'

const BADGE_KEY = 'm360:badges'
const TOTAL = 3

function readCount(): number {
  try {
    const raw = localStorage.getItem(BADGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.length : 0
  } catch {
    return 0
  }
}

export function AchievementsCounter() {
  const [count, setCount] = React.useState(0)
  const [pulse, setPulse] = React.useState(false)

  React.useEffect(() => {
    setCount(readCount())
    const onStorage = (e: StorageEvent) => {
      if (e.key === BADGE_KEY) {
        const next = readCount()
        setPulse(next > count)
        setCount(next)
        setTimeout(() => setPulse(false), 600)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [count])

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] bg-white/80 border-[#e9ecf2] ${
        pulse ? 'animate-pulse' : ''
      }`}
      aria-live="polite"
    >
      Conquistas: {count}/{TOTAL}
    </div>
  )
}
