'use client';
import AppIcon from './AppIcon';
import { EMOJI_TO_ICON } from './emojiMap';
import { isEnabled } from '@/app/lib/flags';

export default function Emoji({ char, size = 16 }: { char: string; size?: number }) {
  const mapped = EMOJI_TO_ICON[char];
  if (mapped && isEnabled('FF_LAYOUT_V1')) {
    return <AppIcon name={mapped} size={size} aria-hidden />;
  }
  // Fallback: keep the literal emoji (e.g., when FF off)
  return <span aria-hidden>{char}</span>;
}
