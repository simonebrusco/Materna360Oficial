'use client';

export type MoodEntry = { date: string; mood: number; energy: number };

const KEY = 'm360_mood_checkins';

export function getMoodEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MoodEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Optional: seed demo data if empty (dev/preview only)
export function seedIfEmpty() {
  const existing = getMoodEntries();
  if (existing.length > 0) return;

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const mk = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const demo = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (27 - i));
    const mood = 2 + Math.floor(Math.random() * 3); // 2..4
    const energy = 2 + Math.floor(Math.random() * 3);
    return { date: mk(d), mood, energy };
  });

  try {
    localStorage.setItem(KEY, JSON.stringify(demo));
  } catch {
    // silently fail if localStorage unavailable
  }
}
