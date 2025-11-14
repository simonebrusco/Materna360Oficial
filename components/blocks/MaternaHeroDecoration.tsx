'use client'

export default function MaternaHeroDecoration() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Soft maternal wave pattern */}
      <path
        d="M 180 20 Q 140 40 100 35 Q 60 30 20 50 L 20 180 L 180 180 Z"
        fill="currentColor"
        className="text-primary/60"
      />

      {/* Gentle heart outline */}
      <path
        d="M 90 90 C 90 90 70 75 60 85 C 50 95 50 110 90 145 C 130 110 130 95 120 85 C 110 75 90 90 90 90 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary/40"
      />

      {/* Subtle dots - maternal theme */}
      <circle cx="50" cy="60" r="3" fill="currentColor" className="text-primary/30" />
      <circle cx="140" cy="80" r="2" fill="currentColor" className="text-primary/25" />
      <circle cx="160" cy="120" r="2.5" fill="currentColor" className="text-primary/20" />
    </svg>
  )
}
