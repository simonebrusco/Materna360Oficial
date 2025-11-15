'use client';

import * as React from 'react';

export default function WhyThisDrawer({
  open,
  onClose,
  text,
}: {
  open: boolean;
  onClose: () => void;
  text: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-[0_8px_28px_rgba(47,58,86,0.12)] p-4 md:p-5"
        role="dialog"
        aria-modal="true"
        aria-label="Por que estou vendo isso?"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="m360-card-title">Por que estou vendo isso?</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 bg-black/8 text-support-1 font-medium text-sm hover:bg-black/12 transition-colors"
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>
        <p className="m360-body mb-3">{text}</p>
        <p className="m360-micro">
          Dica: você pode ajustar suas preferências registrando seu humor e energia no Meu Dia.
        </p>
      </div>
    </div>
  );
}
