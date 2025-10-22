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
    <Card className="p-0">
      <section
        role="region"
        aria-labelledby="breath-title"
        className="px-4 pb-5 pt-3 sm:px-5"
      >
        <div className="mx-auto flex max-w-md flex-col items-center text-center gap-2 sm:max-w-lg sm:gap-3">
          <h3
            id="breath-title"
            className="mb-1 text-base font-semibold tracking-tight text-support-1 sm:mb-1.5 sm:text-lg"
          >
            Respiração Guiada
          </h3>
          <PlayArt className="mx-auto h-14 w-14 sm:h-16 sm:w-16" />
          <div className="mx-auto flex max-w-[46ch] flex-col items-center text-center gap-1">
            <p className="text-sm leading-tight text-support-2">
              Sincronize sua respiração com um ritmo suave e acolhedor.
            </p>
            <p className="text-xs leading-tight text-support-2/90 sm:text-sm">
              Use a respiração para acalmar sua mente e seu corpo. Quando estiver pronta, pressione começar.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <div className="flex min-h-[280px] flex-col items-center justify-center">
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
      </section>
    </Card>
  )
}
