'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
    <Card className="overflow-hidden">
      <div className="flex gap-4 mb-4">
        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-secondary rounded-lg flex items-center justify-center text-3xl">
          {image}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-support-1 mb-1 text-sm md:text-base">{title}</h3>
          <p className="text-xs md:text-sm text-support-2 mb-2">{instructor}</p>
          <p className="text-xs text-primary font-semibold">⏱️ {duration}</p>
        </div>
      </div>

      <p className="text-xs md:text-sm text-support-2 mb-4">{description}</p>

      <div className="flex gap-2">
        <Button
          variant={isPlaying ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-1"
        >
          {isPlaying ? 'Pausar' : '▶️ Ouvir'}
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          Salvar
        </Button>
      </div>
    </Card>
  )
}
