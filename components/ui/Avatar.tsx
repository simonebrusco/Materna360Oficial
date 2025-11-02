'use client';

import * as React from 'react';
import clsx from 'clsx';
import Image from 'next/image';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt: string; // usado também como fallback (iniciais)
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', className = '', ...rest }, ref) => {
    const [errored, setErrored] = React.useState(false);
    const showImage = Boolean(src) && !errored;

    // Fallback com iniciais (primeira letra não-vazia)
    const initial = (alt || '').trim().charAt(0).toUpperCase() || '•';

    const containerCls = clsx(
      'relative flex items-center justify-center overflow-hidden rounded-full bg-secondary',
      SIZE_CLASS[size],
      className
    );

    // Quando não houver imagem, tornamos o container um "img" semântico
    const fallbackA11y =
      showImage ? {} : { role: 'img' as const, 'aria-label': alt };

    return (
      <div ref={ref} className={containerCls} {...fallbackA11y} {...rest}>
        {showImage ? (
          <Image
            src={src as string}
            alt={alt}
            fill
            sizes={`${SIZE_PX[size]}px`}
            className="object-cover"
            onError={() => setErrored(true)}
            // priority opcional em listas críticas; não ligar por padrão
          />
        ) : (
          <span aria-hidden className="text-support-1 font-semibold select-none">
            {initial}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
