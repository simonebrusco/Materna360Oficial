'use client';

export type ToastKind = 'default' | 'success' | 'warning' | 'danger';

type ToastOptions = { title?: string; description?: string; kind?: ToastKind };

type ToastFn = ((opts?: ToastOptions) => void) & {
  success: (message: string) => void;
  warning: (message: string) => void;
  danger: (message: string) => void;
  default: (message: string) => void;
};

export function useToast() {
  const base: (opts?: ToastOptions) => void = (opts = {}) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('m360:toast', { detail: opts }));
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[toast]', opts);
        }
      }
    } catch {
      /* no-op */
    }
  };

  const toast = base as ToastFn;
  toast.success = (message) => base({ description: message, kind: 'success' });
  toast.warning = (message) => base({ description: message, kind: 'warning' });
  toast.danger  = (message) => base({ description: message, kind: 'danger' });
  toast.default = (message) => base({ description: message, kind: 'default' });

  return { toast };
}
