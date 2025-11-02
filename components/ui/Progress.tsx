'use client';

import * as React from 'react';
import clsx from 'clsx';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor atual do progresso */
  value: number;
  /** Valor máximo (padrão: 100) */
  max?: number;
  /** Exibe o rótulo numérico abaixo (ex.: "30 / 100") */
  showLabel?: boolean;
  /** Rótulo acessível; se não passar, usa aria-labelledby quando aplicável */
  ariaLabel?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      className = '',
      showLabel = false,
      ariaLabel,
      id,
      ...rest
    },
    ref
  ) => {
    // Proteções numéricas
    const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
    const clamped = Math.min(safeMax, Math.max(0, value));
    const percentage = (clamped / safeMax) * 100;

    const rootClass = clsx(className);

    return (
      <div
        id={id}
        ref={ref}
        className={rootClass}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-label={ariaLabel}
        {...rest}
      >
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/60">
          <div className="absolute inset-0 bg-white/40 blur-md" aria-hidden />
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] shadow-[0_8px_30px_rgba(255,0,94,0.28)] transition-all duration-500 ease-gentle"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {showLabel && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">
            {clamped} / {safeMax}
          </p>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;
