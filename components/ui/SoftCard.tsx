'use client';

import React from 'react';
import clsx from 'clsx';

export function SoftCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5',
        className
      )}
      style={{ pointerEvents: 'auto', ...((rest as any).style || {}) }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default SoftCard;
