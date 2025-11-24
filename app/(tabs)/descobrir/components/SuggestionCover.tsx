'use client'

import * as React from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

type Props = {
  src?: string | null
  alt?: string
  className?: string
}

export function SuggestionCover({ src, alt = 'Imagem da sugestão', className }: Props) {
  const [error, setError] = React.useState(false)
  const valid = Boolean(src && !error)

  return (
    <div
      className={['relative w-full overflow-hidden rounded-xl border border-white/60 bg-white/70', className].join(
        ' '
      )}
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* Skeleton base to prevent CLS */}
      <div className="absolute inset-0 animate-pulse bg-[#f6f7f9]" aria-hidden />

      {valid ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: 'cover' }}
          onError={() => setError(true)}
          priority={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ImageIcon className="h-6 w-6 text-primary" aria-hidden />
          </div>
        </div>
      )}
    </div>
  )
}
