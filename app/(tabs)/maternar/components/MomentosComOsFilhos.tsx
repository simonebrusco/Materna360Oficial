'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import SoftCard from '@/components/ui/SoftCard'
import { save, load } from '@/app/lib/persist'
import { toast } from '@/app/lib/toast'

export interface Moment {
  id: string
  date: string
  childName?: string
  description: string
  emotion?: 'happy' | 'loving' | 'proud' | 'grateful'
  createdAt: string
}

interface MomentosComOsFilhosProps {
  storageKey?: string
}

export function MomentosComOsFilhos({
  storageKey = 'maternar:moments_entries',
}: MomentosComOsFilhosProps) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [showModal, setShowModal] = useState(false)
  const [momentText, setMomentText] = useState('')
  const [childName, setChildName] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<Moment['emotion']>('happy')

  useEffect(() => {
    const saved = load<Moment[]>(storageKey)
    if (Array.isArray(saved)) {
      setMoments(saved)
    }
  }, [storageKey])

  const handleAddMoment = () => {
    if (!momentText.trim()) {
      toast.error('Por favor, descreva o momento antes de salvar.')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const newMoment: Moment = {
      id: Date.now().toString(),
      date: today,
      childName: childName || undefined,
      description: momentText,
      emotion: selectedEmotion,
      createdAt: new Date().toISOString(),
    }

    const updated = [newMoment, ...moments]
    setMoments(updated)
    save(storageKey, updated)

    setMomentText('')
    setChildName('')
    setSelectedEmotion('happy')
    setShowModal(false)
    toast.success('Momento registrado com carinho!')
  }

  const getEmotionIcon = (emotion?: Moment['emotion']) => {
    switch (emotion) {
      case 'loving':
        return 'heart'
      case 'proud':
        return 'star'
      case 'grateful':
        return 'sparkles'
      case 'happy':
      default:
        return 'smile'
    }
  }

  const getEmotionLabel = (emotion?: Moment['emotion']) => {
    switch (emotion) {
      case 'loving':
        return 'Amoroso'
      case 'proud':
        return 'Orgulho'
      case 'grateful':
        return 'Gratidão'
      case 'happy':
      default:
        return 'Alegria'
    }
  }

  const getEmotionColor = (emotion?: Moment['emotion']) => {
    switch (emotion) {
      case 'loving':
        return 'bg-red-50'
      case 'proud':
        return 'bg-yellow-50'
      case 'grateful':
        return 'bg-purple-50'
      case 'happy':
      default:
        return 'bg-blue-50'
    }
  }

  return (
    <>
      <div>
        {moments.length > 0 ? (
          <div className="space-y-3">
            {moments.slice(0, 5).map((moment) => (
              <div
                key={moment.id}
                className={`rounded-2xl border border-white/40 p-4 shadow-soft hover:shadow-elevated transition-shadow ${getEmotionColor(moment.emotion)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                      <AppIcon
                        name={getEmotionIcon(moment.emotion)}
                        size={16}
                        className="text-primary"
                        decorative
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {moment.childName && (
                      <h4 className="font-semibold text-sm text-support-1 mb-1">
                        {moment.childName}
                      </h4>
                    )}
                    <p className="text-sm text-support-2 line-clamp-2">
                      {moment.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-support-3 bg-support-3/10 rounded-full px-2 py-0.5">
                        {getEmotionLabel(moment.emotion)}
                      </span>
                      <span className="text-xs text-support-3">
                        {new Date(moment.date).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {moments.length > 5 && (
              <p className="text-xs text-support-3 text-center pt-2">
                +{moments.length - 5} momentos anteriores
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-support-3/40 bg-white/40 px-6 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/30">
                <AppIcon name="heart" size={24} className="text-primary" decorative />
              </div>
              <div>
                <p className="font-semibold text-support-1">Nenhum momento registrado ainda.</p>
                <p className="mt-1 text-xs text-support-2">
                  Registre momentos especiais, risos e conexões com seus filhos.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="w-full mt-4 flex items-center justify-center gap-2"
        >
          <AppIcon name="plus" size={16} decorative />
          Registrar Momento
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <SoftCard className="w-full">
              <h3 className="m360-card-title mb-2">Novo Momento</h3>
              <p className="mb-4 text-sm text-support-2">
                Registre um momento especial com seus filhos.
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Nome do filho (opcional)"
                  className="w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <div className="flex gap-2 flex-wrap">
                  {(['happy', 'loving', 'proud', 'grateful'] as const).map((emotion) => (
                    <button
                      key={emotion}
                      type="button"
                      onClick={() => setSelectedEmotion(emotion)}
                      className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all flex items-center gap-1 ${
                        selectedEmotion === emotion
                          ? 'bg-primary text-white'
                          : 'bg-support-3/10 text-support-2 hover:bg-support-3/20'
                      }`}
                    >
                      <AppIcon
                        name={getEmotionIcon(emotion)}
                        size={12}
                        decorative
                      />
                      {getEmotionLabel(emotion)}
                    </button>
                  ))}
                </div>

                <textarea
                  value={momentText}
                  onChange={(e) => setMomentText(e.target.value)}
                  placeholder="O que aconteceu? Qual foi o momento especial?"
                  className="min-h-[140px] w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={5}
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddMoment}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm font-medium text-primary underline hover:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </SoftCard>
          </div>
        </div>
      )}
    </>
  )
}
