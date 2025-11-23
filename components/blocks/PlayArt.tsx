'use client'

import Image from 'next/image'
import { useState } from 'react'

interface PlayArtProps {
  className?: string
}

export function PlayArt({ className }: PlayArtProps) {
  const [src, setSrc] = useState('/images/play-main.png')

  return (
    <Image
      src={src}
      alt="Iniciar respiração guiada"
      width={160}
      height={160}
      className={className ?? 'h-auto w-[140px] sm:w-[160px]'}
      onError={() => setSrc('/images/play-main.svg')}
      priority={false}
    />
  )
}
