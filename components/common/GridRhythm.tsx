'use client';

import type React from 'react';
import clsx from 'clsx';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** Grid/layout wrapper for standardized gaps and card paddings.
   *  IMPORTANT: intentionally NOT polymorphic to avoid SVGProps inference.
   */
};

export default function GridRhythm({ className, children, ...rest }: Props) {
  const mergedClassName = clsx(
    // Keep/merge any classes passed by callers.
    // (Project’s gap tokens/utilities are applied by callers or via className.)
    'grid',
    className
  );

  return (
    <div className={mergedClassName} {...rest}>
      {children}
    </div>
  );
}
