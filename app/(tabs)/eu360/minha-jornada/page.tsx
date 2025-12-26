'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { Button } from '@/components/ui/Button'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

type ConquestIcon = 'star' | 'heart' | 'target' | 'smile' | 'leaf' | 'sun' | 'sparkles' | 'crown'
type MemoryIcon = 'star' | 'heart' | 'sparkles' | 'bookmark' | 'star' | 'crown' | 'sun' | 'smile'

interface Conquest {
  id: string
  icon: ConquestIcon
  description: string
  timestamp: string
}

interface Memory {
  id: string
  icon: MemoryIcon
  description: string
  day?: string
  timestamp: string
}

const AVAILABLE_ICONS: ConquestIcon[] = ['star', 'heart', 'target', 'smile', 'leaf', 'sun', 'sparkles', 'crown']
const AVAILABLE_MEMORY_ICONS: MemoryIcon[] = ['star', 'heart', 'sparkles', 'bookmark', 'crown', 'sun', 'smile']

const ICON_LABELS: Record<ConquestIcon, string> = {
  star: 'Destaque',
  heart: 'Bem-estar',
  target: 'Meta',
  smile: 'Alegria',
  leaf: 'Crescimento',
  sun: 'Luz',
  sparkles: 'Magia',
  crown: 'Força',
}

const MEMORY_ICON_LABELS: Record<MemoryIcon, string> = {
  star: 'Especial',
  heart: 'Amor',
  sparkles: 'Mágico',
  bookmark: 'Lembrar',
  crown: 'Destaque',
  sun: 'Luz',
  smile: 'Feliz',
}

export default function MinhaJornadaPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [timelineNotes, setTimelineNotes] = useState<Record<string, { humor?: string; energia?: string; nota?: string }>>({})
  const [conquests, setConquests] = useState<Conquest[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<ConquestIcon>('star')
  const [memoryInput, setMemoryInput] = useState('')
  const [selectedMemoryIcon, setSelectedMemoryIcon] = useState<MemoryIcon>('heart')
  const [selectedMemoryDay, setSelectedMemoryDay] = useState('')
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [showMemorySaved, setShowMemorySaved] = useState(false)
  const { addItem } = usePlannerSavedContents()

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const timelineKey = 'minha-jornada:timeline'
    const saved = load(timelineKey)
    if (typeof saved === 'object' && saved !== null) {
      setTimelineNotes(saved as Record<string, { humor?: string; energia?: string; nota?: string }>)
    }

    // Load conquests from localStorage
    const storedConquests = localStorage.getItem('minha-jornada:conquests:v1')
    if (storedConquests) {
      try {
        setConquests(JSON.parse(storedConquests))
      } catch {
        setConquests([])
      }
    }

    // Load memories from localStorage
    const storedMemories = localStorage.getItem('minha-jornada:memories:v1')
    if (storedMemories) {
      try {
        setMemories(JSON.parse(storedMemories))
      } catch {
        setMemories([])
      }
    }
  }, [isHydrated])

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
    localStorage.setItem('minha-jornada:conquests:v1', JSON.stringify(updated))

    addItem({
      origin: 'minhas-conquistas',
      type: 'goal',
      title: inputValue.trim(),
      payload: {
        icon: selectedIcon,
        description: inputValue.trim(),
      },
    })

    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)

    setInputValue('')
    setSelectedIcon('star')
    setDrawerOpen(false)
  }

  const recentConquests = conquests.slice(0, 4)

  const saveMemory = () => {
    if (!memoryInput.trim()) return

    if (editingMemoryId) {
      const updated = memories.map((memory) =>
        memory.id === editingMemoryId
          ? {
              ...memory,
              description: memoryInput.trim(),
              icon: selectedMemoryIcon,
              day: selectedMemoryDay,
              timestamp: new Date().toISOString(),
            }
          : memory
      )
      setMemories(updated)
      localStorage.setItem('minha-jornada:memories:v1', JSON.stringify(updated))
    } else {
      const newMemory: Memory = {
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        icon: selectedMemoryIcon,
        description: memoryInput.trim(),
        day: selectedMemoryDay,
        timestamp: new Date().toISOString(),
      }

      const updated = [newMemory, ...memories]
      setMemories(updated)
      localStorage.setItem('minha-jornada:memories:v1', JSON.stringify(updated))
    }

    setShowMemorySaved(true)
    setTimeout(() => setShowMemorySaved(false), 2000)

    setMemoryInput('')
    setSelectedMemoryIcon('heart')
    setSelectedMemoryDay('')
    setEditingMemoryId(null)
    setMemoryModalOpen(false)
  }

  const deleteMemory = (id: string) => {
    const updated = memories.filter((memory) => memory.id !== id)
    setMemories(updated)
    localStorage.setItem('minha-jornada:memories:v1', JSON.stringify(updated))
    setMemoryModalOpen(false)
    setEditingMemoryId(null)
  }

  const openEditMemory = (memory: Memory) => {
    setMemoryInput(memory.description)
    setSelectedMemoryIcon(memory.icon)
    setSelectedMemoryDay(memory.day || '')
    setEditingMemoryId(memory.id)
    setMemoryModalOpen(true)
  }

  const generateTimeline = () => {
    const days = []
    for (let i = 9; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days.push(dateStr)
    }
    return days
  }

  const timelineDays = generateTimeline()
  const humorEmojis: Record<string, string> = {
    'Muito bem': '😄',
    'Bem': '🙂',
    'Neutro': '😐',
    'Cansada': '����',
    'Exausta': '😴',
  }

  return (
    <PageTemplate
      label="EU360"
      title="Minha Jornada"
      subtitle="Acompanhe sua evolução e os momentos especiais da sua maternidade."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Linha do Tempo da Mãe */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                  Sua Linha do Tempo
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Veja como você evoluiu ao longo dos dias.
                </p>
              </div>

              {/* Horizontal Timeline */}
              <div className="mb-6 overflow-x-auto pb-3">
                <div className="flex gap-3 min-w-max md:flex-wrap md:gap-4">
                  {timelineDays.map((dateStr) => {
                    const dateObj = new Date(dateStr + 'T00:00:00')
                    const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][dateObj.getDay()]
                    const dayOfMonth = dateObj.getDate()
                    const entry = timelineNotes[dateStr] || {}

                    return (
                      <div
                        key={dateStr}
                        className="flex-shrink-0 w-20 rounded-2xl bg-white/60 border border-white/40 p-3 text-center hover:bg-white/80 transition-all duration-200 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-[var(--color-text-main)] mb-2">
                          {dayOfWeek} {dayOfMonth}
                        </p>
                        {entry.humor && (
                          <p className="text-lg mb-1">
                            {humorEmojis[entry.humor] || '😊'}
                          </p>
                        )}
                        {entry.energia && (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {entry.energia === 'Alta' && '⚡'}
                            {entry.energia === 'Média' && '🔋'}
                            {entry.energia === 'Baixa' && '😴'}
                          </p>
                        )}
                        {entry.nota && (
                          <p className="text-xs text-primary font-medium mt-1 truncate">
                            {entry.nota}
                          </p>
                        )}
                        {!entry.humor && !entry.energia && !entry.nota && (
                          <p className="text-xs text-[var(--color-text-muted)]">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Helper Text */}
              <div className="rounded-2xl bg-[var(--color-soft-strong)]/40 p-3 text-sm text-[var(--color-text-muted)]">
                Tudo o que você registra ajuda você a ver sua própria evolução.
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Linha do Tempo da Criança */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                  A Jornada do Seu Filho
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Acompanhe os marcos e momentos especiais.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Marcos do Desenvolvimento',
                    description: 'Crescimento, descobertas e avanços.',
                  },
                  {
                    title: 'Momentos Importantes',
                    description: 'Registre algo especial que aconteceu.',
                  },
                  {
                    title: 'Notas do Dia da Criança',
                    description: 'O que chamou atenção hoje?',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary ml-3">→</span>
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Insights da Semana (IA Placeholder) */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                  Insights da Semana
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Padrões e descobertas que ajudam no seu dia a dia.
                </p>
              </div>

              {/* Insight Placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-[var(--color-soft-strong)]/40 p-4">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium mb-2">
                    Seu padrão da semana
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    — (placeholder)
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-soft-strong)]/40 p-4">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium mb-2">
                    Quando você esteve melhor
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    — (placeholder)
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-soft-strong)]/40 p-4">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium mb-2">
                    Principais desafios
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    — (placeholder)
                  </p>
                </div>
              </div>

              {/* Emotional Trend Placeholder */}
              <div className="mb-6 p-6 rounded-2xl bg-[var(--color-soft-strong)]/40 flex items-center justify-center h-40">
                <div className="text-center">
                  <AppIcon
                    name="chart"
                    size={32}
                    className="text-[var(--color-brand)]/40 mx-auto mb-2"
                    decorative
                  />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Gráfico de tendências da semana
                  </p>
                </div>
              </div>

              {/* IA Note */}
              <div className="rounded-2xl border border-[var(--color-brand)]/20 bg-gradient-to-br from-[var(--color-soft-strong)]/40 to-white p-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-2 flex items-center gap-2">
                  <AppIcon name="idea" size={16} className="text-[var(--color-brand)]" decorative />
                  Em breve
                </h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Em breve, você verá análises inteligentes sobre sua evolução.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Conquistas & Memórias */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                  Conquistas e Memórias
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Celebre as pequenas vitórias e momentos afetivos.
                </p>
              </div>

              <div className="space-y-4">
                {/* Minhas Conquistas Recentes - REFINED */}
                <SoftCard className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="space-y-3 border-b-2 border-[#9B4D96] pb-4 mb-4">
                    <h4 className="text-[0.95rem] md:text-[1rem] font-semibold text-[#3A3A3A]">
                      Minhas Conquistas Recentes
                    </h4>
                    <p className="text-[0.8rem] md:text-[0.85rem] text-[#6A6A6A]">
                      Celebre cada pequeno avanço na sua jornada.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Icon Badges Grid */}
                    {recentConquests.length > 0 ? (
                      <div className="flex justify-center md:justify-center">
                        <div className="flex gap-2 flex-wrap justify-center">
                          {recentConquests.map((conquest) => (
                            <button
                              key={conquest.id}
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
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[0.85rem] text-[#6A6A6A]">
                          Nenhuma conquista registrada ainda.
                        </p>
                      </div>
                    )}

                    {/* Registrar Conquista Button */}
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="w-full h-11 rounded-xl bg-[#FF1475] text-white font-semibold shadow-[0_4px_24px_rgba(255,0,94,0.16)] transition-all duration-150 hover:shadow-[0_8px_32px_rgba(255,0,94,0.24)] active:scale-98 flex items-center justify-center gap-2 group"
                    >
                      <AppIcon
                        name="plus"
                        size={16}
                        className="text-white"
                        decorative
                      />
                      <span className="text-[0.9rem]">Registrar conquista</span>
                    </button>

                    {/* Saved Feedback */}
                    {showSaved && (
                      <div className="text-center text-xs text-[#FF1475] font-medium animate-fade-in">
                        Tudo salvo
                      </div>
                    )}
                  </div>
                </SoftCard>

                {/* Memórias da Semana - REFINED */}
                <SoftCard className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="space-y-3 border-b-2 border-[#9B4D96] pb-4 mb-5">
                    <h4 className="text-[0.95rem] md:text-[1rem] font-semibold text-[#3A3A3A]">
                      Memórias da Semana
                    </h4>
                    <p className="text-[0.8rem] md:text-[0.85rem] text-[#6A6A6A]">
                      Registre os momentos afetivos que marcaram a sua semana.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Memories List */}
                    {memories.length > 0 ? (
                      <div className="space-y-2">
                        {memories.map((memory) => (
                          <button
                            key={memory.id}
                            onClick={() => openEditMemory(memory)}
                            className="w-full flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-[#ffd8e6]/30 transition-colors duration-150 active:bg-[#ffd8e6]/50"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffd8e6] flex items-center justify-center">
                                <AppIcon
                                  name={memory.icon}
                                  size={16}
                                  className="text-[#FF1475]"
                                  decorative
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#3A3A3A] line-clamp-1">
                                  {memory.description}
                                </p>
                                {memory.day && (
                                  <p className="text-xs text-[#6A6A6A]">
                                    {memory.day}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-[#FF1475] font-medium flex-shrink-0 whitespace-nowrap">
                              Ver / editar
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[0.85rem] text-[#6A6A6A]">
                          Você ainda não registrou nenhuma memória esta semana. Que tal começar com um pequeno momento?
                        </p>
                      </div>
                    )}

                    {/* Registrar Memória Button */}
                    <Button
                      variant="primary"
                      onClick={() => {
                        setMemoryInput('')
                        setSelectedMemoryIcon('heart')
                        setSelectedMemoryDay('')
                        setEditingMemoryId(null)
                        setMemoryModalOpen(true)
                      }}
                      className="w-full h-11 rounded-xl mt-4"
                    >
                      <AppIcon
                        name="plus"
                        size={16}
                        decorative
                        className="mr-2"
                      />
                      Registrar memória
                    </Button>

                    {/* Saved Feedback */}
                    {showMemorySaved && (
                      <div className="text-center text-xs text-[#FF1475] font-medium">
                        Memória salva com sucesso
                      </div>
                    )}
                  </div>
                </SoftCard>

                {/* O que quero lembrar */}
                <div className="rounded-2xl border border-white/40 bg-white/60 p-4">
                  <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-3">
                    O que quero lembrar
                  </h4>
                  <textarea
                    placeholder="Escreva algo que você não quer esquecer…"
                    className="w-full min-h-[80px] rounded-xl border border-white/40 bg-white/70 p-3 text-sm text-[var(--color-text-main)] placeholder-[#9A9A9A] shadow-soft focus:border-[var(--color-brand)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                  />
                </div>
              </div>
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
            <div className="p-6 md:p-8 space-y-5">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[1rem] md:text-[1.1rem] font-semibold text-[#3A3A3A]">
                    Registrar Conquista
                  </h2>
                  <p className="text-[0.85rem] text-[#6A6A6A] mt-1">
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
                  placeholder="Ex: Passei 30 min sem celular com meu filho"
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
                Sua conquista será salva na sua jornada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER - REGISTRAR MEMÓRIA */}
      {memoryModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setMemoryModalOpen(false)}
            aria-hidden="true"
          />

          {/* DRAWER PANEL */}
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label={editingMemoryId ? 'Editar Memória' : 'Registrar Memória'}
          >
            <div className="p-6 md:p-8 space-y-5">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[1rem] md:text-[1.1rem] font-semibold text-[#3A3A3A]">
                    {editingMemoryId ? 'Editar Memória' : 'Registrar Memória'}
                  </h2>
                  <p className="text-[0.85rem] text-[#6A6A6A] mt-1">
                    Descreva um momento que você quer guardar dessa semana.
                  </p>
                </div>
                <button
                  onClick={() => setMemoryModalOpen(false)}
                  className="flex-shrink-0 rounded-lg p-2 text-[#6A6A6A] hover:bg-[#ffd8e6]/30 transition-colors"
                  aria-label="Fechar"
                >
                  <AppIcon name="x" size={20} decorative />
                </button>
              </div>

              {/* TEXTAREA FIELD */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
                  Sua memória
                </label>
                <textarea
                  placeholder="Ex: Hoje meu filho riu alto quando contei uma história antes de dormir…"
                  value={memoryInput}
                  onChange={(e) => setMemoryInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#ffd8e6] bg-white text-[#3A3A3A] placeholder-[#6A6A6A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1475]/30 focus:border-[#FF1475] transition-all duration-150 resize-none min-h-[100px]"
                  autoFocus
                />
              </div>

              {/* ICON SELECTOR */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
                  Escolha um ícone
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVAILABLE_MEMORY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedMemoryIcon(icon)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                        selectedMemoryIcon === icon
                          ? 'border-[#FF1475] bg-[#ffd8e6] shadow-[0_4px_12px_rgba(255,0,94,0.16)]'
                          : 'border-[#ffd8e6] bg-white hover:border-[#FF1475]/50'
                      }`}
                      aria-label={MEMORY_ICON_LABELS[icon]}
                      title={MEMORY_ICON_LABELS[icon]}
                    >
                      <AppIcon
                        name={icon}
                        size={18}
                        className={selectedMemoryIcon === icon ? 'text-[#FF1475]' : 'text-[#6A6A6A]'}
                        decorative
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* DAY SELECTOR (OPTIONAL) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
                  Dia da semana (opcional)
                </label>
                <select
                  value={selectedMemoryDay}
                  onChange={(e) => setSelectedMemoryDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#ffd8e6] bg-white text-[#3A3A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1475]/30 focus:border-[#FF1475] transition-all duration-150"
                >
                  <option value="">Selecione um dia</option>
                  <option value="Segunda">Segunda</option>
                  <option value="Terça">Terça</option>
                  <option value="Quarta">Quarta</option>
                  <option value="Quinta">Quinta</option>
                  <option value="Sexta">Sexta</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              {/* BUTTONS */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="primary"
                  onClick={saveMemory}
                  disabled={!memoryInput.trim()}
                  className="w-full h-11 rounded-xl"
                >
                  <AppIcon name="check" size={16} decorative className="mr-2" />
                  {editingMemoryId ? 'Salvar alterações' : 'Salvar memória'}
                </Button>

                {editingMemoryId && (
                  <button
                    onClick={() => deleteMemory(editingMemoryId)}
                    className="w-full h-11 rounded-xl border border-red-300 text-red-600 font-semibold transition-all duration-150 hover:bg-red-50 active:bg-red-100 text-sm"
                  >
                    Excluir memória
                  </button>
                )}
              </div>

              {/* HELPER TEXT */}
              <p className="text-xs text-center text-[#6A6A6A]">
                Suas memórias são guardadas com carinho.
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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </PageTemplate>
  )
}
