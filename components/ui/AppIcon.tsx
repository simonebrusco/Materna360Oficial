'use client';

import * as React from 'react';
import * as Lucide from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type Variant = 'neutral' | 'brand';
type IconComponent = React.ComponentType<LucideProps>;

/** Normalize "search" | "sliders-horizontal" -> "Search" | "SlidersHorizontal" */
function toPascalCase(input: string): string {
  return input
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (m) => m.toUpperCase());
}

/** Aliases for friendly/short names -> lucide export keys */
const ALIASES: Record<string, keyof typeof Lucide> = {
  // Core UI
  place: 'Home',
  home: 'Home',
  house: 'Home',
  books: 'BookOpen',
  book: 'Book',
  'book-open': 'BookOpen',
  star: 'Star',
  care: 'Heart',
  heart: 'Heart',
  crown: 'Crown',
  sparkles: 'Sparkles',
  search: 'Search',
  filters: 'SlidersHorizontal',
  filter: 'SlidersHorizontal',
  settings: 'Settings',
  gear: 'Settings',
  info: 'Info',
  help: 'HelpCircle',
  question: 'HelpCircle',
  close: 'X',
  x: 'X',
  check: 'Check',
  plus: 'Plus',
  minus: 'Minus',

  // Time & date
  time: 'Clock',
  timer: 'Timer',
  clock: 'Clock',
  calendar: 'Calendar',
  date: 'Calendar',

  // Media & actions
  camera: 'Camera',
  play: 'Play',
  pause: 'Pause',
  stop: 'Square',
  share: 'Share2',
  download: 'Download',
  upload: 'Upload',
  edit: 'Pencil',
  trash: 'Trash2',

  // Navigation
  'arrow-right': 'ArrowRight',
  'arrow-left': 'ArrowLeft',
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',

  // Ideas/insights
  idea: 'Lightbulb',
  lightbulb: 'Lightbulb',

  // Location
  location: 'MapPin',
  pin: 'MapPin',
  map: 'Map',
} as const;

/** Known-friendly icons (shortcut map) */
const ICONS = {
  place: Lucide.Home,
  books: Lucide.BookOpen,
  star: Lucide.Star,
  care: Lucide.Heart,
  crown: Lucide.Crown,
  sparkles: Lucide.Sparkles,
  search: Lucide.Search,
  filters: Lucide.SlidersHorizontal,
  filter: Lucide.SlidersHorizontal,
  idea: Lucide.Lightbulb,
  time: Lucide.Clock,
} as const;

export type AppIconName =
  | keyof typeof ICONS
  | keyof typeof ALIASES
  | keyof typeof Lucide
  | Lowercase<keyof typeof Lucide>
  | string;

/** Narrow lucide namespace to only component-like exports */
const LucideMap = Lucide as unknown as Record<string, IconComponent>;

function resolveIconComponent(name: string): IconComponent {
  // 1) direct match in our ICONS map (already typed)
  if (name in ICONS) return (ICONS as Record<string, IconComponent>)[name];

  // 2) alias to a Lucide export (PascalCase key)
  const alias = ALIASES[name as keyof typeof ALIASES];
  if (alias && LucideMap[String(alias)]) return LucideMap[String(alias)];

  // 3) direct Lucide export (PascalCase)
  if (LucideMap[name]) return LucideMap[name];

  // 4) try normalized PascalCase from kebab/lowercase
  const pascal = toPascalCase(name);
  if (LucideMap[pascal]) return LucideMap[pascal];

  // 5) fallback
  return Lucide.HelpCircle as IconComponent;
}

export default function AppIcon({
  name,
  size = 20,
  variant = 'neutral',
  strokeWidth = 1.75,
  className,
  ...rest
}: {
  name: AppIconName;
  size?: number;
  variant?: Variant;
  strokeWidth?: number;
} & Omit<LucideProps, 'width' | 'height' | 'stroke' | 'strokeWidth'>) {
  const Icon = resolveIconComponent(String(name));
  const color = variant === 'brand' ? '#ff005e' : '#2f3a56';
  return (
    <Icon
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      aria-hidden
      className={className}
      {...rest}
    />
  );
}
