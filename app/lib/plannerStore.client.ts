'use client';

export type PlannerItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  done?: boolean;
  note?: string;
};

const KEY = 'm360_planner_week';

export function getPlannerItemsWithin(days = 7): PlannerItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PlannerItem[];
    if (!Array.isArray(arr)) return [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    return arr.filter((i) => new Date(i.date) >= start);
  } catch {
    return [];
  }
}
