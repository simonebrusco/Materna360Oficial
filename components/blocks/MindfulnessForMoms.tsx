'use client'

'use client'

import { MindfulnessCollections } from './MindfulnessCollections'

export default function MindfulnessForMoms() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <span aria-hidden="true">🎧</span>
          <span>Mindfulness para M��es</span>
        </h2>
        <p className="section-subtitle max-w-2xl text-support-2">
          Pausas guiadas, curtas e acolhedoras, para respirar com intenção e cuidar do coração enquanto a rotina acontece.
        </p>
      </div>

      <MindfulnessCollections />
    </section>
  )
}
