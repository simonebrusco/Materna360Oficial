'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { UpsellSheet } from '@/components/ui/UpsellSheet'

const MENTORS = [
  {
    emoji: '👨‍⚕️',
    name: 'Pediatra',
    desc: 'Consultoria sobre saúde infantil e desenvolvimento',
    color: 'from-blue-50 to-blue-100/50',
  },
  {
    emoji: '🧠',
    name: 'Psicólogo',
    desc: 'Apoio emocional e comportamental familiar',
    color: 'from-purple-50 to-purple-100/50',
  },
  {
    emoji: '👨‍🏫',
    name: 'Educador',
    desc: 'Estratégias de aprendizagem e desenvolvimento',
    color: 'from-green-50 to-green-100/50',
  },
  {
    emoji: '🧘‍♀️',
    name: 'Wellness Coach',
    desc: 'Autocuidado e equilíbrio emocional',
    color: 'from-pink-50 to-pink-100/50',
  },
]

export function MentorshipBlock() {
  const [showUpsell, setShowUpsell] = useState(false)

  const handleContact = (mentorName: string) => {
    const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_MENTORSHIP_URL || '#'
    const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_MENTORSHIP_URL || '#'

    if (whatsappUrl !== '#') {
      window.open(whatsappUrl, '_blank')
    } else if (calendlyUrl !== '#') {
      window.open(calendlyUrl, '_blank')
    } else {
      setShowUpsell(true)
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {MENTORS.map((mentor, index) => (
          <Reveal key={mentor.name} delay={index * 70} className="h-full">
            <Card className={`bg-gradient-to-br ${mentor.color} border-white/60 p-6 h-full flex flex-col justify-between`}>
              <div>
                <p className="text-3xl">{mentor.emoji}</p>
                <h3 className="mt-3 text-lg font-semibold text-support-1">{mentor.name}</h3>
                <p className="mt-2 text-sm text-support-2">{mentor.desc}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                onClick={() => handleContact(mentor.name)}
              >
                📞 Agendar
              </Button>
            </Card>
          </Reveal>
        ))}
      </div>

      {showUpsell && (
        <UpsellSheet
          title="Mentorias com Especialistas"
          description="Conecte-se com profissionais qualificados para guiar sua jornada de maternidade e bem-estar familiar."
          planName="Premium"
          features={[
            '1 mentoria mensal com especialista escolhido',
            'Consultoria familiar personalizada',
            'Agendamento fácil via WhatsApp ou Calendly',
            'Suporte ilimitado entre sessões',
          ]}
          onClose={() => setShowUpsell(false)}
          onUpgrade={() => {
            window.location.href = '/planos'
          }}
        />
      )}
    </>
  )
}
