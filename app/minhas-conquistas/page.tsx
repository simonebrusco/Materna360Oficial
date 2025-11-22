'use client'

import { useState, useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { Button } from '@/components/ui/Button'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

type ConquestIcon = 'leaf' | 'heart' | 'star' | 'target' | 'smile' | 'footprints' | 'sun' | 'smile-plus'

interface Conquest {
  id: string
  icon: ConquestIcon
  description: string
  timestamp: string
}

const AVAILABLE_ICONS: ConquestIcon[] = ['leaf', 'heart', 'star', 'target', 'smile', 'footprints', 'sun', 'smile-plus']

const ICON_LABELS: Record<ConquestIcon, string> = {
  leaf: 'Crescimento',
  heart: 'Bem-estar',
  star: 'Destaque',
  target: 'Meta',
  smile: 'Alegria',
  footprints: 'Passos',
  sun: 'Luz',
  'smile-plus': 'Conexão',
}

export default function MinhasConquistasPage() {
  const [conquests, setConquests] = useState<Conquest[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<ConquestIcon>('star')
  const [showCheckmark, setShowCheckmark] = useState<string | null>(null)
  const { addItem } = usePlannerSavedContents()

  useEffect(() => {
    const stored = localStorage.getItem('conquests:v1')
    if (stored) {
      try {
        setConquests(JSON.parse(stored))
      } catch {
        setConquests([])
      }
    }
  }, [])

  const saveConquest = () => {
    if (!inputValue.trim()) return

    const newConquest: Conquest = {
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      icon: selectedIcon,
      description: inputValue.trim(),
      timestamp: new Date().toISOString(),
    }

    const updated = [newConquest, ...conquests]
    setConquests(updated)
    localStorage.setItem('conquests:v1', JSON.stringify(updated))

    addItem({
      origin: 'minhas-conquistas',
      type: 'goal',
      title: inputValue.trim(),
      payload: {
        icon: selectedIcon,
        description: inputValue.trim(),
      },
    })

    setShowCheckmark(newConquest.id)
    setTimeout(() => setShowCheckmark(null), 1500)

    setInputValue('')
    setSelectedIcon('star')
    setDrawerOpen(false)
  }

  const recentConquests = conquests.slice(0, 3)

  return (
    <PageTemplate
      label="CONQUISTAS"
      title="Minhas Conquistas"
      subtitle="Celebre seu progresso — um passo de cada vez."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* MOTIVATIONAL LINE */}
          <Reveal delay={0}>
            <div className="text-center">
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                Cada pequeno avanço importa. Você está evoluindo.
              </p>
            </div>
          </Reveal>

          {/* MINHAS CONQUISTAS RECENTES SECTION */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 border-b-2 border-[#9B4D96] pb-4 mb-6">
                <h2 className="text-[1.1rem] font-semibold text-[#3A3A3A]">
                  Minhas Conquistas Recentes
                </h2>
                <p className="text-[0.9rem] text-[#6A6A6A]">
                  Registre e celebre cada vitória no seu caminho.
                </p>
              </div>

              <div className="space-y-6">
                {/* ICON BADGES GRID */}
                {recentConquests.length > 0 ? (
                  <div className="flex justify-center md:justify-center">
                    <div className="flex gap-3 flex-wrap justify-center">
                      {recentConquests.map((conquest) => (
                        <div
                          key={conquest.id}
                          className="relative"
                        >
                          <button
                            className="group flex items-center justify-center w-10 h-10 rounded-full bg-[#ffd8e6] border border-[#ffd8e6] shadow-[0_2px_8px_rgba(255,0,94,0.08)] transition-all duration-200 hover:scale-105 active:scale-97"
                            aria-label={`${ICON_LABELS[conquest.icon]}: ${conquest.description}`}
                            title={conquest.description}
                          >
                            <AppIcon
                              name={conquest.icon}
                              size={18}
                              className="text-[#FF1475]"
                              decorative
                            />
                          </button>

                          {/* CHECKMARK ANIMATION */}
                          {showCheckmark === conquest.id && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#ffd8e6] border border-[#ffd8e6] animate-[scale-in]">
                              <AppIcon
                                name="check"
                                size={18}
                                className="text-[#FF1475]"
                                decorative
                              />
                            </div>
                          )}

                          {/* TOOLTIP ON HOVER */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#3A3A3A] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {ICON_LABELS[conquest.icon]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[0.9rem] text-[#6A6A6A]">
                      Nenhuma conquista registrada ainda. Comece hoje!
                    </p>
                  </div>
                )}

                {/* REGISTRAR CONQUISTA BUTTON */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="w-full md:w-auto md:min-w-[240px] h-11 px-6 rounded-xl bg-[#FF1475] text-white font-semibold shadow-[0_4px_24px_rgba(255,0,94,0.16)] transition-all duration-150 hover:shadow-[0_8px_32px_rgba(255,0,94,0.24)] active:scale-98 flex items-center justify-center gap-2 group"
                  >
                    <AppIcon
                      name="plus"
                      size={18}
                      className="text-white"
                      decorative
                    />
                    <span>Registrar conquista</span>
                  </button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* CONQUISTA DA SEMANA */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <h3 className="text-[1.1rem] font-semibold text-[#3A3A3A] mb-2">
                Conquista da Semana
              </h3>
              <p className="text-sm text-[#6A6A6A] mb-4">
                Você manteve 4 dias de humor registrado — isso mostra cuidado real.
              </p>
              <div className="flex justify-end">
                <span className="text-sm font-medium text-[#FF1475] inline-flex items-center gap-1">
                  Ver detalhes <AppIcon name="chevron" size={16} decorative />
                </span>
              </div>
            </SoftCard>
          </Reveal>

          {/* SEU PROGRESSO DA SEMANA */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <h3 className="text-[1.1rem] font-semibold text-[#3A3A3A] mb-6">
                Seu Progresso da Semana
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-[#FF1475]">5/7</span>
                  <span className="text-xs text-[#6A6A6A] font-medium">
                    Humor registrado
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-[#FF1475]">8/12</span>
                  <span className="text-xs text-[#6A6A6A] font-medium">
                    Tarefas concluídas
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-[#FF1475]">3</span>
                  <span className="text-xs text-[#6A6A6A] font-medium">
                    Momentos de conexão
                  </span>
                </div>
              </div>
              <div className="h-3 bg-[#FF1475]/10 rounded-full mt-6" />
            </SoftCard>
          </Reveal>

          {/* SELOS & MEDALHAS */}
          <Reveal delay={200}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <h3 className="text-[1.1rem] font-semibold text-[#3A3A3A] mb-6">
                Selos & Medalhas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {['Primeiro Passo', 'Mãe Presente', 'Criatividade em Ação', 'Semana Leve'].map((badgeTitle) => (
                  <SoftCard
                    key={badgeTitle}
                    className="rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#ffd8e6]/40 to-white border border-[#ffd8e6] h-28 shadow-[0_2px_8px_rgba(255,0,94,0.05)]"
                  >
                    <AppIcon name="star" size={24} className="text-[#FF1475] mb-2" decorative />
                    <p className="text-xs font-medium text-[#FF1475]">{badgeTitle}</p>
                  </SoftCard>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* NIVEL ATUAL */}
          <Reveal delay={250}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <h3 className="text-[1.1rem] font-semibold text-[#3A3A3A] mb-2">
                Seu Nível
              </h3>
              <p className="text-sm text-[#6A6A6A] mb-2">
                Nível 5 — Cuidando de Mim
              </p>
              <p className="text-sm text-[#6A6A6A] mb-4">
                450 / 600 XP
              </p>
              <div className="h-3 bg-[#FF1475]/10 rounded-full mb-3" />
              <p className="text-xs text-[#6A6A6A] font-medium text-center">
                Continue caminhando no seu ritmo.
              </p>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>

      {/* DRAWER - REGISTRAR CONQUISTA */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* DRAWER PANEL */}
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label="Registrar Conquista"
          >
            <div className="p-6 md:p-8 space-y-6">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[1.1rem] font-semibold text-[#3A3A3A]">
                    Registrar Conquista
                  </h2>
                  <p className="text-[0.9rem] text-[#6A6A6A] mt-1">
                    Descreva sua vitória e escolha um ícone.
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex-shrink-0 rounded-lg p-2 text-[#6A6A6A] hover:bg-[#ffd8e6]/30 transition-colors"
                  aria-label="Fechar"
                >
                  <AppIcon name="x" size={20} decorative />
                </button>
              </div>

              {/* INPUT FIELD */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
                  Descreva sua conquista
                </label>
                <input
                  type="text"
                  placeholder="Ex: Passei 30 min com meu filho sem o celular"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') saveConquest()
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-[#ffd8e6] bg-white text-[#3A3A3A] placeholder-[#6A6A6A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1475]/30 focus:border-[#FF1475] transition-all duration-150"
                  autoFocus
                />
              </div>

              {/* ICON SELECTOR */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
                  Escolha um ícone
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                        selectedIcon === icon
                          ? 'border-[#FF1475] bg-[#ffd8e6] shadow-[0_4px_12px_rgba(255,0,94,0.16)]'
                          : 'border-[#ffd8e6] bg-white hover:border-[#FF1475]/50'
                      }`}
                      aria-label={ICON_LABELS[icon]}
                      title={ICON_LABELS[icon]}
                    >
                      <AppIcon
                        name={icon}
                        size={18}
                        className={selectedIcon === icon ? 'text-[#FF1475]' : 'text-[#6A6A6A]'}
                        decorative
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* SAVE BUTTON */}
              <Button
                variant="primary"
                onClick={saveConquest}
                disabled={!inputValue.trim()}
                className="w-full h-11 rounded-xl"
              >
                <AppIcon name="check" size={16} decorative className="mr-2" />
                Salvar no planner
              </Button>

              {/* HELPER TEXT */}
              <p className="text-xs text-center text-[#6A6A6A]">
                Sua conquista será salva no seu planner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION KEYFRAMES */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </PageTemplate>
  )
}
