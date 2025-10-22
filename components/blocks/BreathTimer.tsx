'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function BreathTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [phase, setPhase] = useState<'breathe-in' | 'hold' | 'breathe-out'>('breathe-in')

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds(s => {
        if (s < 4) return s + 1
        
        // Cycle through phases: 4s in, 4s hold, 4s out
        if (phase === 'breathe-in') {
          setPhase('hold')
        } else if (phase === 'hold') {
          setPhase('breathe-out')
        } else {
          setPhase('breathe-in')
        }
        return 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, phase])

  const phaseText = {
    'breathe-in': 'Inspire...',
    'hold': 'Segure...',
    'breathe-out': 'Expire...',
  }

  const circleSize = {
    'breathe-in': 'w-32 h-32 md:w-40 md:h-40',
    'hold': 'w-32 h-32 md:w-40 md:h-40',
    'breathe-out': 'w-24 h-24 md:w-32 md:h-32',
  }

  const Artwork = () => (
    <div className="flex w-full items-center justify-center py-6">
      <Image
        src="/images/play-main.png"
        alt="Iniciar respiração guiada"
        width={160}
        height={160}
        className="h-auto w-[140px] sm:w-[160px]"
        priority={false}
      />
    </div>
  )

  return (
    <Card className="p-8 text-center">
      <Artwork />
      <h2 className="text-lg font-semibold text-support-1 md:text-xl">💨 Respiração Guiada</h2>
      <p className="mt-2 text-sm text-support-2">Sincronize sua respiração com um ritmo suave e acolhedor.</p>

      <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center">
        {isRunning ? (
          <>
            <Artwork />
            <div
              className={`${circleSize[phase]} mx-auto flex items-center justify-center rounded-full border-4 border-primary/60 bg-gradient-to-br from-primary/20 via-white/40 to-white/60 shadow-glow transition-all duration-1000`}
            >
              <div className="text-center">
                <p className="mb-1 text-3xl font-bold text-primary md:text-4xl">{4 - seconds}</p>
                <p className="text-sm text-support-1/90">{phaseText[phase]}</p>
              </div>
            </div>
            <p className="mt-8 text-sm text-support-2">Relaxe, inspire e permita que o corpo desacelere.</p>
          </>
        ) : (
          <p className="mt-4 max-w-sm text-sm text-support-2">
            Use a respiração para acalmar sua mente e seu corpo. Quando estiver pronta, pressione começar.
          </p>
        )}
      </div>

      <Button
        variant={isRunning ? 'outline' : 'primary'}
        size="sm"
        onClick={() => {
          setIsRunning(!isRunning)
          if (!isRunning) setPhase('breathe-in')
        }}
        className="w-full"
      >
        {isRunning ? 'Parar' : 'Começar'}
      </Button>
    </Card>
  )
}
