'use client';

import * as React from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>;
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside';

export interface SectionWrapperProps extends BaseAttributes {
  /** Troca a tag semântica do container (padrão: section) */
  as?: SectionElementTag;
  /** Eyebrow opcional acima do título */
  eyebrow?: ReactNode;
  /** Título da seção (gera aria-labelledby) */
  title?: ReactNode;
  /** Descrição curta abaixo do título */
  description?: ReactNode;
  /** Permite injetar um header completo, ignorando eyebrow/title/description */
  header?: ReactNode;
  /** Classes extras no header */
  headerClassName?: string;
  /** Classes extras no conteúdo interno (wrap dos children) */
  contentClassName?: string;
  /** Conteúdo da seção */
  children: ReactNode;
}

/**
 * Wrapper semântico de seção com cabeçalho opcional.

 * Usa React.createElement para evitar erro com tag dinâmica em produção.

 * Usa React.createElement para evitar o erro “Unexpected token ElementTag” em produção
 * quando se usa JSX com tag dinâmica.

 */
export function SectionWrapper({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
  ...rest
}: SectionWrapperProps) {
  const ElementTag = as;

  const autoId = React.useId();
  const headingId = title ? `section-heading-${autoId}` : undefined;


  // A11y: se houver título, tratamos como "region" para navegação por leitores de tela

  const role =
    as === 'div' || as === 'article' || as === 'aside' || as === 'main'
      ? (headingId ? 'region' : undefined)
      : undefined;

  const mergedClassName = ['SectionWrapper', className.trim()].filter(Boolean).join(' ');

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div
        className={['SectionWrapper-header', headerClassName.trim()]
          .filter(Boolean)
          .join(' ')}
      >
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {title ? (
          <h2 id={headingId} className="SectionWrapper-title">
            {title}
          </h2>
        ) : null}
        {description ? <p className="SectionWrapper-description">{description}</p> : null}
      </div>
    ) : null);


  const content = contentClassName.trim()
    ? <div className={contentClassName}>{children}</div>
    : children;

  const content =
    contentClassName.trim()
      ? <div className={contentClassName}>{children}</div>
      : children;


  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {};

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content
  );
}


// ⚠️ Não reexporte nomeado, para evitar Duplicate export.
// Mantenha apenas o default.

// ✅ Mantém compatibilidade: default export + named export (a própria função já é named)

export default SectionWrapper;
