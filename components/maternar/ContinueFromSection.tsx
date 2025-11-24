'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { load, getCurrentWeekKey, getCurrentDateKey } from '@/app/lib/persist';

export interface ContinueItem {
  label: string;
  href: string;
  icon: string;
  priority: number;
}

export default function ContinueFromSection() {
  const [continueItem, setContinueItem] = useState<ContinueItem | null>(null);

  useEffect(() => {
    // Determine which persistence key was last updated
    const weekKey = getCurrentWeekKey();
    const dateKey = getCurrentDateKey();

    const items: ContinueItem[] = [];

    // Check planner (current week)
    const plannerData = load(`planner:${weekKey}`);
    if (plannerData && Array.isArray(plannerData) && plannerData.length > 0) {
      items.push({
        label: 'Retomar seu planner',
        href: '/meu-dia',
        icon: 'calendar',
        priority: 1,
      });
    }

    // Check care logs (current day)
    const careData = load(`care:child:${dateKey}`);
    if (careData && Array.isArray(careData) && careData.length > 0) {
      items.push({
        label: 'Abrir timeline de cuidados',
        href: '/cuidar',
        icon: 'care',
        priority: 2,
      });
    }

    // Check mood (current week)
    const moodData = load(`mood:${weekKey}`);
    if (moodData && Array.isArray(moodData) && moodData.length > 0) {
      items.push({
        label: 'Ver seu humor da semana',
        href: '/meu-dia',
        icon: 'smile',
        priority: 3,
      });
    }

    // Check diary (current week)
    const diaryData = load(`diary:${weekKey}`);
    if (diaryData && Array.isArray(diaryData) && diaryData.length > 0) {
      items.push({
        label: 'Abrir diário',
        href: '/eu360',
        icon: 'bookmark',
        priority: 4,
      });
    }

    // Check saved discover items (global, not scoped by date)
    const savedData = load<string[]>('saved:discover', []);
    if (savedData && Array.isArray(savedData) && savedData.length > 0) {
      items.push({
        label: 'Ver ideias salvas',
        href: '/descobrir',
        icon: 'bookmark',
        priority: 5,
      });
    }

    // Show the highest priority item
    if (items.length > 0) {
      items.sort((a, b) => a.priority - b.priority);
      setContinueItem(items[0]);
    }
  }, []);

  // Don't render if no continue item found
  if (!continueItem) {
    return null;
  }

  return (
    <div className="px-4 pb-8 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Link href={continueItem.href}>
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/60 bg-white/80 shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-shadow hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] cursor-pointer">
            {/* Icon */}
            <div className="flex-shrink-0">
              <AppIcon
                name={continueItem.icon}
                size={24}
                decorative
                variant="brand"
              />
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-support-1">
                Continue de onde parou
              </p>
              <p className="text-sm text-support-2 mt-0.5">
                {continueItem.label}
              </p>
            </div>

            {/* Chevron */}
            <div className="flex-shrink-0 text-support-3">
              <AppIcon
                name="chevron"
                size={20}
                decorative
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
