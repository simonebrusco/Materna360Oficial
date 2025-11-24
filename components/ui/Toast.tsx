'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

type ToastKind = 'default' | 'success' | 'warning' | 'danger';
type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  kind?: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number; // default 2200
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, 'id'>) => void;
};

const ToastCtx = React.createContext<ToastContextValue | null>(null);

export function useToast(): { toast: ToastContextValue['toast'] } {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) {
    // safe no-op to avoid crashes if provider is missing
    return { toast: () => {} };
  }
  return { toast: ctx.toast };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  const toast = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    // Generate ID in callback (safe - runs after hydration)
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const next: ToastItem = {
      id,
      durationMs: 2200,
      kind: 'default',
      ...t,
    };
    setItems((prev) => [...prev, next]);
    const ms = next.durationMs ?? 2200;
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, ms);
  }, []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(<ToastViewport items={items} setItems={setItems} />, document.body)}
    </ToastCtx.Provider>
  );
}

function ToastViewport({
  items,
  setItems,
}: {
  items: ToastItem[];
  setItems: React.Dispatch<React.SetStateAction<ToastItem[]>>;
}) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto w-full max-w-sm rounded-[var(--radius-card)] shadow-[0_4px_24px_rgba(47,58,86,0.08)] border border-white/60 bg-white px-4 py-3',
            'hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] transition-shadow duration-200',
            t.kind === 'success' && 'border-white/60',
            t.kind === 'warning' && 'border-white/60',
            t.kind === 'danger' && 'border-white/60'
          )}
          role="status"
          aria-live="polite"
        >
          {t.title && <div className="text-sm font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
          {t.onAction && t.actionLabel && (
            <div className="mt-2">
              <button
                className="text-sm font-semibold underline"
                onClick={() => {
                  t.onAction?.();
                  setItems((prev) => prev.filter((x) => x.id !== t.id));
                }}
              >
                {t.actionLabel}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Optional helper component for places that prefer JSX usage.
export function ToastDemoButton() {
  const { toast } = useToast();
  return (
    <button
      className="btn btn-primary"
      onClick={() => toast({ title: 'Ação concluída', kind: 'success' })}
    >
      Show toast
    </button>
  );
}

// --- Compatibility Inline Toast (legacy JSX API) ---------------------------
// Some legacy components import { Toast } from '@/components/ui/Toast'
// and render <Toast message="..." type="success" onClose={() => ...} />
// Provide a minimal inline component so those call sites compile
// without rewriting them right now.

/**
 * @deprecated Use useToast().toast(...) instead. This compat shim is slated for removal.
 *
 * Legacy JSX API for backward compatibility only.
 * All new code should use the useToast() hook:
 *   const { toast } = useToast();
 *   toast({ title: 'Message', kind: 'success' });
 */
export type LegacyToastProps = {
  message?: string;
  type?: 'default' | 'success' | 'warning' | 'danger' | 'error' | 'info';
  onClose?: () => void;
  className?: string;
  duration?: number;
};

/**
 * @deprecated Use useToast().toast(...) instead. This compat shim is slated for removal.
 */
export function Toast({ message, type = 'default', onClose, className, duration }: LegacyToastProps) {
  if (!message) return null;

  // map aliases: "error" -> "danger", "info" -> "default"
  const normalized =
    type === 'error' ? 'danger' : type === 'info' ? 'default' : type;

  return (
    <div
      className={clsx(
        'pointer-events-auto w-full max-w-sm rounded-xl shadow-lg border bg-white px-4 py-3',
        'fixed left-1/2 -translate-x-1/2 bottom-4 z-[61]',
        normalized === 'success' && 'border-green-200',
        normalized === 'warning' && 'border-yellow-200',
        normalized === 'danger' && 'border-red-200',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold">
          {message}
        </div>
        {onClose && (
          <button
            className="text-sm font-semibold underline"
            onClick={onClose}
            aria-label="Fechar"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
