'use client';

export type ToastKind = 'default' | 'success' | 'warning' | 'danger';

export function useToast() {
  function toast(opts: { title?: string; description?: string; kind?: ToastKind } = {}) {
    try {
      if (typeof window !== 'undefined') {
        // Dispara um evento global que seu componente <Toast /> pode escutar
        window.dispatchEvent(new CustomEvent('m360:toast', { detail: opts }));
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[toast]', opts);
        }
      }
    } catch {
      /* no-op */
    }
  }
  return { toast };
}
