'use client';

import * as React from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

type BaseAttributes = Omit<HTMLAttributes<HTMLElement>, 'title'>;
type SectionElementTag = 'section' | 'div' | 'article' | 'main' | 'aside';

export interface SectionProps extends BaseAttributes {
  as?: SectionElementTag;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Section — contêiner semântico com cabeçalho opcional.
 * - Tag dinâmica via `as` (section/div/article/main/aside)
 * - A11y: se houver título, usa aria-labelledby
 * - Repassa todos os props de HTMLElement (...rest)
 */
export function Section({
  as = 'section',
  eyebrow,
  title,
  description,
  header,
  className = '',
  headerClassName = '',
  contentClassName,
  children,
  ...rest
}: SectionProps) {
  const ElementTag = as;

  // A11y: associa container ao título, se existir
  const autoId = React.useId();
  const headingId = title ? `section-heading-${autoId}` : undefined;

  const mergedClassName = ['SectionWrapper', className].filter(Boolean).join(' ');

  const renderedHeader =
    header ??
    (eyebrow || title || description ? (
      <div className={['SectionWrapper-header', headerClassName].filter(Boolean).join(' ')}>
        {eyebrow ? <span className="SectionWrapper-eyebrow">{eyebrow}</span> : null}
        {title ? (
          <h2 id={headingId} className="SectionWrapper-title">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="SectionWrapper-description">{description}</p>
        ) : null}
      </div>
    ) : null);

  const content = contentClassName ? <div className={contentClassName}>{children}</div> : children;

  // Usa createElement para evitar erro “Unexpected token ElementTag” no parser
  const ariaProps = headingId ? { 'aria-labelledby': headingId } : {};

  return React.createElement(
    ElementTag,
    { className: mergedClassName, ...ariaProps, ...rest },
    renderedHeader,
    content
  );
}

export default Section;
