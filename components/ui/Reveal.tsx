'use client';

import * as React from 'react';

export type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Atraso da animação em milissegundos (ex.: 80) */
  delay?: number;
  /** Se true, revela uma única vez e não “des-revela” ao sair da viewport */
  once?: boolean;
  /** Fração visível necessária para disparar o reveal (0..1). Padrão: 0.12 */
  threshold?: number;
};

export function Reveal({
  children,
  className = '',
  delay = 0,
  style,
  once = true,
  threshold = 0.12,
  ...rest
}: RevealProps) {
  const elementRef = React.useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Acessibilidade: se o usuário prefere reduzir animações, não anima.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {


            // Se não for "once", pode ocultar novamente ao sair da viewport

            setIsVisible(false);
          }
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ease-gentle will-change-transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest} // aceita e repassa suppressHydrationWarning, aria-*, data-*, etc.
    >
      {children}
    </div>
  );
}

export default Reveal;
