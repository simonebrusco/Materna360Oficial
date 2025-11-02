'use client';

import React, { type HTMLAttributes, type ReactNode } from 'react';

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
 * Usa React.createElement para compatibilidade total com App Router.
 */
export default function SectionWrapper({
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

  // A11y: liga o container ao título, se existir
  const autoId = React.useId();
  const headingId = title ? `section-heading-${autoId}` : undefined;

  // A11y extra: quando a tag não é <section>, podemos marcar como "region"
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

  const content =
    contentClassName.trim() ? <div className={contentClassName}>{children}</div> : children;

  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {};

  return React.createElement(
    ElementTag,
    { className: mergedClassName, role, ...ariaProps, ...rest },
    renderedHeader,
    content
  );
}
