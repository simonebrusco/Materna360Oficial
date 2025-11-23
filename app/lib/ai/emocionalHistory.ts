// app/lib/ai/emocionalHistory.ts

import { load } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'

/**
 * Lê do persist todos os registros emocionais dos últimos N dias.
 * Por enquanto, só humor e energia.
 */
export function getLastNDaysMoodEntries(days: number = 7) {
  const entries = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = getBrazilDateKey(d)

    const moodKey = `como-estou-hoje:${key}:humor`
    const energyKey = `como-estou-hoje:${key}:energy`

    const mood = load(moodKey)
    const energy = load(energyKey)

    if (typeof mood === 'string' || typeof energy === 'string') {
      entries.push({
        date: d.toISOString().slice(0, 10),
        mood: typeof mood === 'string' ? mood : 'Neutro',
        energy:
          typeof energy === 'string'
            ? energy === 'Alta'
              ? 'alta'
              : energy === 'Média'
              ? 'media'
              : energy === 'Baixa'
              ? 'baixa'
              : 'media'
            : 'media',
      })
    }
  }

  return entries.reverse() // mais antigo → mais recente
}
