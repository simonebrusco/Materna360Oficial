'use client'

import { useState, useEffect } from 'react'
import { PlayArt } from '@/components/blocks/PlayArt'
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

  return (
    <Card className="px-6 pb-12 pt-12 sm:px-8 sm:pb-14 sm:pt-14">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center gap-3 sm:gap-4">
        <h3 className="text-2xl font-semibold tracking-tight text-support-1 sm:text-3xl">Respiração Guiada</h3>
        <PlayArt className="mx-auto h-28 w-28 sm:h-[120px] sm:w-[120px]" />
        <p className="text-sm leading-relaxed text-support-2 sm:text-base">
          Sincronize sua respiração com um ritmo suave e acolhedor.
        </p>
        <p className="text-sm leading-relaxed text-support-2/90 sm:text-base">
          Use a respiração para acalmar sua mente e seu corpo. Quando estiver pronta, pressione começar.
        </p>
      </div>

      <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center">
        {isRunning ? (
          <>
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
        ) : null}
      </div>

      <div className="mt-8 sm:mt-10">
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
      </div>
    </Card>
  )
}
