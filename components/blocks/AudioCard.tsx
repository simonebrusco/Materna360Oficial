'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'

interface AudioCardProps {
  title: string
  duration: string
  instructor: string
  image: string
  description: string
}

export function AudioCard({ title, duration, instructor, image, description }: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card className="overflow-hidden p-6">
      <div className="mb-5 flex gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-secondary/80 text-3xl shadow-soft md:h-24 md:w-24">
          {image}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-support-1 md:text-lg">{title}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-support-2/70">{instructor}</p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
            ⏱️ {duration}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-support-2">{description}</p>

      <div className="flex gap-2">
        <Button
          variant={isPlaying ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-1"
        >
          {isPlaying ? '⏸️ Pausar' : '▶️ Ouvir'}
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          Salvar
        </Button>
      </div>
    </Card>
  )
}
