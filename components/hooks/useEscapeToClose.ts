'use client';
import { useEffect, useRef } from 'react';

export function useEscapeToClose(enabled: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
