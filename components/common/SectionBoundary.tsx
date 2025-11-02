'use client';

import * as React from 'react';

export interface SectionBoundaryProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Título curto para o fallback padrão */
  title?: React.ReactNode;
  /**
   * Componente de fallback ou função que recebe o erro.
   * Se omitido, usa o fallback padrão (cartão rosé).
   */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  /**
   * Chaves que, ao mudarem, resetam o estado de erro.
   * Ex.: [userId, filters]
   */
  resetKeys?: Array<unknown>;
  /** Callback chamado quando o erro é resetado manualmente ou via resetKeys */
  onReset?: () => void;
}

interface SectionBoundaryState {
  error?: Error;
}

export default class SectionBoundary
  extends React.Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: undefined };

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log educado (não quebra em ambientes sem console)
    try {
      // eslint-disable-next-line no-console
      console.error('[SectionBoundary]', error, info);
    } catch {}
  }

  componentDidUpdate(prevProps: SectionBoundaryProps) {
    const { resetKeys } = this.props;
    if (!this.state.error) return;

    // Reset se as resetKeys mudarem em conteúdo (shallow)
    if (resetKeys && prevProps.resetKeys && resetKeys.length === prevProps.resetKeys.length) {
      for (let i = 0; i < resetKeys.length; i++) {
        if (Object.is(resetKeys[i], prevProps.resetKeys[i])) continue;
        this.resetErrorBoundary();
        return;
      }
    } else if ((resetKeys && !prevProps.resetKeys) || (!resetKeys && prevProps.resetKeys)) {
      this.resetErrorBoundary();
    }
  }

  private resetErrorBoundary = () => {
    this.setState({ error: undefined });
    this.props.onReset?.();
  };

  render() {
    const { children, title, fallback, className, onReset, ...rest } = this.props;
    const { error } = this.state;

    if (!error) {
      // Estado saudável: renderiza filhos direto (sem wrapper extra)
      return <>{children}</>;
    }

    // Fallback custom (componente pronto ou função)
    if (fallback) {
      const node = typeof fallback === 'function' ? fallback(error) : fallback;
      // Aplica className/props somente no container do fallback
      return (
        <div
          role="alert"
          aria-live="polite"
          className={className}
          {...rest}
        >
          {node}
        </div>
      );
    }

    // Fallback padrão (visual consistente com o app)
    return (
      <div
        role="alert"
        aria-live="polite"
        className={
          [
            'rounded-2xl border border-rose-200 bg-rose-50 p-6',
            'shadow-sm',
            className,
          ].filter(Boolean).join(' ')
        }
        {...rest}
      >
        <h3 className="font-semibold text-rose-700">
          Falha ao carregar {title ?? 'esta seção'}.
        </h3>
        <p className="mt-1 text-sm text-rose-800/80">
          Verifique sua conexão ou tente novamente mais tarde.
        </p>

        {onReset && (
          <button
            type="button"
            onClick={this.resetErrorBoundary}
            className="mt-3 inline-flex items-center rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-white"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }
}
