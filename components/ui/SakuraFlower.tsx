import type { CSSProperties } from 'react'

interface SakuraFlowerProps {
  className?: string
  style?: CSSProperties
  decorative?: boolean
}

export function SakuraFlower({ className, style, decorative = true }: SakuraFlowerProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      role={decorative ? 'img' : 'presentation'}
      aria-hidden={decorative}
      focusable="false"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id="sakuraCenter" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFD5E5" />
          <stop offset="65%" stopColor="#FF99C2" />
          <stop offset="100%" stopColor="#FF5E9B" />
        </radialGradient>
        <linearGradient id="sakuraPetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE6F1" />
          <stop offset="45%" stopColor="#FFADCE" />
          <stop offset="100%" stopColor="#FF6FAE" />
        </linearGradient>
        <path
          id="petal"
          d="M60 12C53.5 19.5 50 31.5 55 42C60 52.5 60 68 60 68C60 68 60 52.5 65 42C70 31.5 66.5 19.5 60 12Z"
        />
      </defs>
      <g fill="url(#sakuraPetal)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinejoin="round">
        <use href="#petal" />
        <use href="#petal" transform="rotate(72 60 60)" />
        <use href="#petal" transform="rotate(144 60 60)" />
        <use href="#petal" transform="rotate(216 60 60)" />
        <use href="#petal" transform="rotate(288 60 60)" />
      </g>
      <circle cx="60" cy="60" r="14" fill="url(#sakuraCenter)" opacity="0.95" />
      <circle cx="60" cy="60" r="8" fill="#FFE8F3" opacity="0.9" />
      <circle cx="60" cy="60" r="4" fill="#FF5E9B" opacity="0.6" />
    </svg>
  )
}
