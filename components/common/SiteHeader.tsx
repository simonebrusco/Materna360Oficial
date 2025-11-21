'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/ui/AppLogo';

export default function SiteHeader() {
  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/80 backdrop-blur
        border-b border-white/60
        shadow-[0_6px_24px_rgba(47,58,86,0.06)]
      "
    >
      <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-3">
        {/* Left: brand */}
        <Link href="/" className="flex items-center gap-2">
          <AppLogo width={104} height={24} priority />
        </Link>

        {/* Center: title */}
        <div className="hidden sm:block text-sm text-slate-500">
          Materna360
        </div>

        {/* Right: avatar + CTA */}
        <div className="flex items-center gap-2">
          <div
            className="
              h-7 w-7 rounded-full bg-gradient-to-br from-pink-300 to-pink-500
              shadow-[0_2px_10px_rgba(255,0,94,0.25)]
            "
            aria-hidden
          />
          <Link
            href="/eu360"
            className="
              rounded-full bg-pink-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-pink-600
              hover:bg-pink-100 transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60
            "
          >
            MINHA FIGURINHA
          </Link>
        </div>
      </div>
    </header>
  );
}
