'use client'

import { useState, useEffect } from 'react'
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
    <Card className="text-center">
      <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-6">💨 Respiração Guiada</h2>

      <div className="flex flex-col items-center justify-center min-h-[300px]">
        {isRunning ? (
          <>
            <div className={`${circleSize[phase]} rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center transition-all duration-1000`}>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{4 - seconds}</p>
                <p className="text-sm text-support-1">{phaseText[phase]}</p>
              </div>
            </div>
            <p className="text-sm text-support-2 mt-8">Relaxe e siga o ritmo</p>
          </>
        ) : (
          <>
            <p className="text-2xl mb-4">🌬️</p>
            <p className="text-support-2 mb-6 text-sm">Use a respiração para acalmar sua mente e corpo</p>
          </>
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
