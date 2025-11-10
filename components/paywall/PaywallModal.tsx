'use client';

import * as React from 'react';

export default function PaywallModal({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative bg-white rounded-2xl max-w-[420px] w-[calc(100%-2rem)] shadow-[0_8px_28px_rgba(47,58,86,0.15)] p-6 animate-fadeIn"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-support-3/10 rounded-lg transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5 text-support-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 id="paywall-title" className="text-lg font-bold text-ink-1 mb-2">
            Recurso Premium
          </h2>
        </div>

        {/* Message */}
        <p className="text-sm text-support-1 text-center mb-6 leading-relaxed">
          O download do relatório em PDF é exclusivo para assinantes.{' '}
          <span className="font-semibold">Experimente o plano Premium</span> para desbloquear agora.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onUpgrade}
            className="rounded-xl px-4 py-3 bg-primary text-white font-semibold hover:opacity-95 active:scale-[0.99] transition-all shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Ver planos Premium
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-3 border border-white/60 bg-white/90 font-semibold text-support-1 hover:bg-white/95 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Continuar explorando
          </button>
        </div>

        {/* Transparency note */}
        <p className="text-xs text-support-2 text-center mt-4">
          Transparência: este bloqueio é apenas para exportação. Você pode visualizar tudo normalmente.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        [role='dialog'].animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
