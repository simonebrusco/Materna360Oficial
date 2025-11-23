'use client';

export type MoodEntry = { date: string; mood: number; energy: number };

const KEY = 'm360_mood_checkins';

export function getMoodEntries(): MoodEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MoodEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Optional: seed demo data if empty (dev/preview only)
export function seedIfEmpty() {
  if (typeof window === 'undefined') return;

  const existing = getMoodEntries();
  if (existing.length > 0) return;

  // Freeze today to first call time to prevent SSR/client drift
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const mk = (d: Date) => {
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${year}-${month}-${day}`;
  };

  const demo = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (27 - i));
    const mood = 2 + Math.floor(Math.random() * 3); // 2..4
    const energy = 2 + Math.floor(Math.random() * 3);
    return { date: mk(d), mood, energy };
  });

  try {
    window.localStorage.setItem(KEY, JSON.stringify(demo));
  } catch {
    // silently fail if localStorage unavailable
  }
}
