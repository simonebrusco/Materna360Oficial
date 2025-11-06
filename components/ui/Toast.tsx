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

  const toast = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
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

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {createPortal(<ToastViewport items={items} setItems={setItems} />, document.body)}
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
            'pointer-events-auto w-full max-w-sm rounded-xl shadow-lg border bg-white px-4 py-3',
            t.kind === 'success' && 'border-green-200',
            t.kind === 'warning' && 'border-yellow-200',
            t.kind === 'danger' && 'border-red-200'
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
