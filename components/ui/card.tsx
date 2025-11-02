'use client';

import * as React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Card — contêiner com efeito “glass” e hover elevando.
 * - Repassa props padrão de <div> (aria-*, data-*, suppressHydrationWarning, etc.)
 * - Acessível: se tiver onClick e não vier role, aplica role="button" + tabIndex
 * - Suporta foco por teclado (Enter/Espaço acionam onClick)
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className = '', onClick, role, tabIndex, onKeyDown, ...rest },
  ref
) {
  const isClickable = typeof onClick === 'function';

  // A11y: se é clicável e não definiram role/tabIndex, ajusta automaticamente
  const computedRole = role ?? (isClickable ? 'button' : undefined);
  const computedTabIndex = tabIndex ?? (isClickable ? 0 : undefined);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (!isClickable) return;
    // Aciona onClick com Enter ou Espaço
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>);
    }
  };

  const base = clsx(
    'relative group/card glass-panel blurred-border p-6 transition-all duration-500 ease-gentle',
    isClickable && 'cursor-pointer hover:-translate-y-1 hover:shadow-elevated',
    className
  );

  return (
    <div
      ref={ref}
      className={base}
      onClick={onClick}
      role={computedRole}
      tabIndex={computedTabIndex}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {/* Glow e highlight (usam posicionamento absoluto, por isso o container é relative) */}
      <span className="pointer-events-none absolute inset-0 -z-10 bg-materna-card opacity-0 transition-opacity duration-700 group-hover/card:opacity-80" />
      <span className="pointer-events-none absolute inset-x-6 top-2 -z-0 h-1 rounded-full bg-white/70 opacity-0 blur-lg transition-opacity duration-700 group-hover/card:opacity-100" />

      <div className="relative z-10">{children}</div>
    </div>
  );
});

export default Card;
