'use client'

import React, { useState, useEffect } from 'react'
import { load } from '@/app/lib/persist'

interface Moment {
  id: string
  date: string
  childName?: string
  description: string
  emotion?: 'happy' | 'loving' | 'proud' | 'grateful'
  createdAt: string
}

export function MomentsWithKids() {
  const [moments, setMoments] = useState<Moment[]>([])

  useEffect(() => {
    const saved = load<Moment[]>('maternar:moments_entries')
    if (Array.isArray(saved)) {
      setMoments(saved)
    }
  }, [])

  const emotionEmojis: Record<string, string> = {
    happy: '😊',
    loving: '💕',
    proud: '🌟',
    grateful: '🙏',
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">Momentos com os Filhos</h2>
        <p className="text-sm text-support-2">
          Celebre e registre as memórias especiais que quer guardar
        </p>
      </div>

      {moments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {moments.slice(0, 5).map(moment => (
            <div key={moment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex gap-2 mb-2">
                {moment.emotion && (
                  <span className="text-lg">{emotionEmojis[moment.emotion]}</span>
                )}
                <div className="flex-1">
                  {moment.childName && (
                    <p className="text-xs font-semibold text-primary">{moment.childName}</p>
                  )}
                  <p className="text-xs text-support-2">
                    {new Date(moment.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-support-1 line-clamp-2">{moment.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-support-2 py-8">
          Ainda sem momentos registrados. Comece a celebrar!
        </p>
      )}
    </div>
  )
}
