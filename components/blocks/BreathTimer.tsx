'use client'

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'

function BreathTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [phase, setPhase] = useState<'breathe-in' | 'hold' | 'breathe-out'>('breathe-in')

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s < 4) return s + 1

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
    hold: 'Segure...',
    'breathe-out': 'Expire...',
  }

  const circleSize = {
    'breathe-in': 'w-32 h-32 md:w-40 md:h-40',
    hold: 'w-32 h-32 md:w-40 md:h-40',
    'breathe-out': 'w-24 h-24 md:w-32 md:h-32',
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 px-6 py-10 text-center shadow-[0_26px_54px_-28px_rgba(47,58,86,0.32)] backdrop-blur md:px-10 md:py-12">
      <header className="space-y-2 md:space-y-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-primary">Pausa consciente</span>
        <h2 className="text-[20px] font-bold leading-[1.28] text-support-1 md:text-[22px]">Respiração Guiada</h2>
        <p className="mx-auto max-w-2xl text-sm leading-[1.45] text-support-2/85 md:text-base">
          Sincronize sua respiração com um ritmo suave e acolhedor.
        </p>
      </header>

      <div className="m360-heart mx-auto mt-4 flex items-center justify-center md:mt-5">
        <Image
          src="https://cdn.builder.io/api/v1/image/assets%2F7d9c3331dcd74ab1a9d29c625c41f24c%2F5b7e725c13924063a116efc21a335af1"
          alt="Flor de cerejeira Materna360"
          width={235}
          height={140}
          className="h-auto max-w-full"
        />
      </div>

      <div className="mt-8 flex min-h-[280px] flex-col items-center justify-center">
        {isRunning ? (
          <>
            <div
              className={`${circleSize[phase]} rounded-full border-4 border-primary/60 bg-gradient-to-br from-primary/20 via-white/40 to-white/60 shadow-glow transition-all duration-1000`}
            >
              <div className="text-center">
                <p className="mb-1 text-3xl font-bold text-primary md:text-4xl">{4 - seconds}</p>
                <p className="text-sm text-support-1/90">{phaseText[phase]}</p>
              </div>
            </div>
            <p className="mt-8 text-sm text-support-2/80">Relaxe, inspire e permita que o corpo desacelere.</p>
          </>
        ) : (
          <>
            <p className="mt-6 max-w-sm text-sm text-support-2/80">
              Use a respiração para acalmar sua mente e seu corpo. Quando estiver pronta, pressione começar.
            </p>
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

export default BreathTimer
export { BreathTimer }
