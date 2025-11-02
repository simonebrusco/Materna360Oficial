'use client';

import * as React from 'react';
import clsx from 'clsx';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Conteúdo textual do toast (aceita ReactNode) */
  message: React.ReactNode;
  /** Tipo visual e de acessibilidade */
  type?: ToastKind;
  /** Duração em ms. 0 => não fecha automaticamente */
  duration?: number;
  /** Callback ao fechar (auto ou manual) */
  onClose?: () => void;
  /** Posição fixa na viewport */
  position?: ToastPosition;
  /** Mostra botão de fechar (esc acessível) */
  dismissible?: boolean;
}

const TYPE_STYLES: Record<ToastKind, string> = {
  success: 'bg-green-100 text-green-800 border-green-300',
  error: 'bg-red-100 text-red-800 border-red-300',
  info: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const POSITION_STYLES: Record<ToastPosition, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

/**
 * Toast — aviso leve com A11y e controles de tempo.
 * - Repassa props de <div> (aria-*, data-*, suppressHydrationWarning, etc.)
 * - duration=0 mantém aberto até fechar manualmente
 * - Pausa o fechamento automático ao foco/hover
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    message,
    type = 'info',
    duration = 3000,
    onClose,
    position = 'bottom-right',
    dismissible = true,
    className,
    onMouseEnter,
    onMouseLeave,
    onKeyDown,
    ...rest
  },
  ref
) {
  const [open, setOpen] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  // Fechamento automático (respeita hover/focus e duration=0)
  React.useEffect(() => {
    if (!open || duration === 0) return;
    const id = window.setTimeout(() => {
      if (!hovered) {
        setOpen(false);
        onClose?.();
      }
    }, duration);
    return () => window.clearTimeout(id);
  }, [open, hovered, duration, onClose]);

  // A11y: role/aria-live conforme tipo
  const ariaRole = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  const base = clsx(
    'fixed z-50 rounded-lg border px-6 py-3 shadow-lg',
    'transition-all duration-300 ease-gentle',
    // transições de entrada/saída
    open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
    TYPE_STYLES[type],
    POSITION_STYLES[position],
    className
  );

  const handleClose = () => {
    if (!open) return;
    setOpen(false);
    onClose?.();
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setHovered(true);
    onMouseEnter?.(e);
  };
  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setHovered(false);
    onMouseLeave?.(e);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // ESC fecha quando focado
    if (e.key === 'Escape') {
      handleClose();
    }
    onKeyDown?.(e);
  };

  if (!open) return null;

  return (
    <div
      ref={ref}
      role={ariaRole}
      aria-live={ariaLive}
      className={base}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0">{message}</div>

        {dismissible && (
          <button
            ref={closeRef}
            type="button"
            aria-label="Fechar aviso"
            onClick={handleClose}
            className="ml-2 inline-flex shrink-0 items-center justify-center rounded-md border border-transparent/40 px-2 py-1 text-sm/none hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

export default Toast;
