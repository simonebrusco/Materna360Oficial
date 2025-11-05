'use client';

import * as React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** Optional: amount of scroll when clicking arrows (px) */
  step?: number;
  /** Show nav arrows? (mobile hides by default) */
  withNav?: boolean;
};

export default function HScroll({ className, children, step = 280, withNav = false, ...rest }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  };

  return (
    <div className={className}>
      <div className="relative">
        {withNav && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-step)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:grid h-8 w-8 place-items-center rounded-full border bg-white/90 backdrop-blur shadow"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollBy(step)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:grid h-8 w-8 place-items-center rounded-full border bg-white/90 backdrop-blur shadow"
              aria-label="Scroll right"
            >
              ›
            </button>
          </>
        )}
        <div
          ref={ref}
          className="
            flex gap-3 overflow-x-auto scroll-px-3 snap-x snap-mandatory
            [scrollbar-width:none] [-ms-overflow-style:none]
          "
          style={{ WebkitOverflowScrolling: 'touch' }}
          {...rest}
        >
          {/* Hide scrollbar (WebKit) */}
          <style jsx>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  );
}
