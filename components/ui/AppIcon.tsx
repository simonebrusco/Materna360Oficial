'use client';

import * as React from 'react';
import * as Lucide from 'lucide-react';

type Variant = 'neutral' | 'brand';

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

/** First-class friendly map (optional shortcut to avoid resolving at runtime) */
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
  | string; // last-resort: we normalize and fallback

function resolveIconComponent(name: string): React.ComponentType<any> {
  // 1) direct match in our ICONS map
  if (name in ICONS) return (ICONS as any)[name];

  // 2) alias to a Lucide export (PascalCase key)
  const alias = ALIASES[name as keyof typeof ALIASES];
  if (alias && Lucide[alias]) return Lucide[alias];

  // 3) direct Lucide export (PascalCase)
  if ((Lucide as any)[name]) return (Lucide as any)[name];

  // 4) try normalized PascalCase from kebab/lowercase
  const pascal = toPascalCase(name);
  if ((Lucide as any)[pascal]) return (Lucide as any)[pascal];

  // 5) fallback
  return Lucide.HelpCircle;
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
} & React.SVGProps<SVGSVGElement>) {
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
