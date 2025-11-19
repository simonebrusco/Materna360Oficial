'use client'

import React, { useState, useCallback } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import Top3Section from './Top3Section'
import CareSection from './CareSection'
import AgendaSection from './AgendaSection'
import NotesSection from './NotesSection'
import SavedContentsSection from './SavedContentsSection'
import { Reveal } from '@/components/ui/Reveal'

type Appointment = {
  id: string
  time: string
  title: string
  tag?: string
}

type Top3Item = {
  id: string
  title: string
  done: boolean
}

type CareItem = {
  id: string
  title: string
  done: boolean
  source?: 'manual' | 'from_hub'
  origin?: string
}

type SavedContent = {
  id: string
  title: string
  type: 'artigo' | 'receita' | 'ideia' | 'frase'
  origin: string
  href?: string
}

type PlannerData = {
  appointments: Appointment[]
  top3: Top3Item[]
  careItems: CareItem[]
  familyItems: CareItem[]
  notes: string
  savedContents: SavedContent[]
}

export default function WeeklyPlannerShell() {
  // Initialize planner state with mock data
  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [
      { id: '1', time: '09:00', title: 'Consulta pediatra', tag: 'Filho' },
      { id: '2', time: '14:30', title: 'Reunião trabalho', tag: 'Trabalho' },
    ],
    top3: [
      { id: '1', title: 'Finalizar projeto', done: false },
      { id: '2', title: 'Fazer compras', done: true },
    ],
    careItems: [
      { id: '1', title: 'Meditação de 10 minutos', done: false },
      { id: '2', title: 'Tomar café com calma', done: true },
    ],
    familyItems: [
      { id: '1', title: 'Brincadeira com o filho', done: false },
      { id: '2', title: 'Ler história antes de dormir', done: false },
    ],
    notes: '',
    savedContents: [
      {
        id: 'c1',
        title: 'Receita: Bolo de cenoura saudável',
        type: 'receita',
        origin: 'Biblioteca',
        href: '/biblioteca-materna',
      },
      {
        id: 'c2',
        title: 'Ideias para brincadeiras divertidas',
        type: 'ideia',
        origin: 'Descobrir',
        href: '/descobrir',
      },
    ],
  })

  // Handlers for each section
  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      setPlannerData(prev => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))
    },
    []
  )

  const handleToggleTop3 = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      top3: prev.top3.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }))
  }, [])

  const handleAddTop3 = useCallback((title: string) => {
    setPlannerData(prev => {
      if (prev.top3.length < 3) {
        const newItem: Top3Item = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
        }
        return { ...prev, top3: [...prev.top3, newItem] }
      }
      return prev
    })
  }, [])

  const handleToggleCareItem = useCallback((id: string, type: 'care' | 'family') => {
    setPlannerData(prev => {
      const field = type === 'care' ? 'careItems' : 'familyItems'
      return {
        ...prev,
        [field]: prev[field].map(item =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      }
    })
  }, [])

  const handleAddCareItem = useCallback((title: string, type: 'care' | 'family') => {
    setPlannerData(prev => {
      const field = type === 'care' ? 'careItems' : 'familyItems'
      const newItem: CareItem = {
        id: Math.random().toString(36).slice(2, 9),
        title,
        done: false,
        source: 'manual',
      }
      return {
        ...prev,
        [field]: [...prev[field], newItem],
      }
    })
  }, [])

  const handleNotesChange = useCallback((content: string) => {
    setPlannerData(prev => ({ ...prev, notes: content }))
  }, [])

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* Two-column grid on desktop, single column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6 md:space-y-8">
            {/* 1. Prioridades do dia */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#ffe3f0] text-[#ff005e]">
                  Você
                </span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                  Prioridades do dia
                </h2>
                <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                  Escolha até 3 coisas que realmente importam hoje.
                </p>
              </div>
              <Top3Section
                items={plannerData.top3}
                onToggle={handleToggleTop3}
                onAdd={handleAddTop3}
              />
            </div>

            {/* 2. Cuidar de mim */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#ffe3f0] text-[#ff005e]">
                  Você
                </span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                  Cuidar de mim
                </h2>
                <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                  Momentos para recarregar a sua energia.
                </p>
              </div>
              <CareSection
                title="Cuidar de mim"
                subtitle="Atividades de autocuidado."
                icon="heart"
                items={plannerData.careItems}
                onToggle={id => handleToggleCareItem(id, 'care')}
                onAdd={title => handleAddCareItem(title, 'care')}
                placeholder="Nova ação de autocuidado..."
              />
            </div>

            {/* 3. Cuidar do meu filho */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#e3f0ff] text-[#0066ff]">
                  Seu filho
                </span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                  Cuidar do meu filho
                </h2>
                <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                  Gestos simples para fortalecer o vínculo.
                </p>
              </div>
              <CareSection
                title="Cuidar da família"
                subtitle="Tarefas com os filhos."
                icon="smile"
                items={plannerData.familyItems}
                onToggle={id => handleToggleCareItem(id, 'family')}
                onAdd={title => handleAddCareItem(title, 'family')}
                placeholder="Nova ação com a família..."
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 md:space-y-8">
            {/* 4. Casa & rotina */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#f0e3ff] text-[#6600ff]">
                  Rotina
                </span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                  Casa &amp; rotina
                </h2>
                <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                  Tarefas da casa e organização do dia.
                </p>
              </div>
              <AgendaSection
                items={plannerData.appointments}
                onAddAppointment={handleAddAppointment}
              />
            </div>

            {/* 5. Lembretes rápidos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#fff0e3] text-[#ff9900]">
                  Lembretes
                </span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                  Lembretes rápidos
                </h2>
                <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                  Anotações soltas para não esquecer.
                </p>
              </div>
              <NotesSection
                content={plannerData.notes}
                onChange={handleNotesChange}
              />
            </div>

            {/* 6. Inspirações & conteúdos salvos */}
            {plannerData.savedContents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#f0fff0] text-[#00cc44]">
                    Inspirações
                  </span>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                    Inspirações &amp; conteúdos salvos
                  </h2>
                  <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                    Receitas, ideias e conteúdos para seu dia a dia.
                  </p>
                </div>
                <SavedContentsSection contents={plannerData.savedContents} />
              </div>
            )}
          </div>
        </div>

        {/* Inspirações - show on mobile if empty (visual placeholder) */}
        {plannerData.savedContents.length === 0 && (
          <div className="lg:hidden space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[#f0fff0] text-[#00cc44]">
                Inspirações
              </span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">
                Inspirações &amp; conteúdos salvos
              </h2>
              <p className="text-xs md:text-sm text-[#545454]/70 mt-1">
                Receitas, ideias e conteúdos para seu dia a dia.
              </p>
            </div>
            <div className="rounded-[22px] border border-black/5 bg-gradient-to-br from-white to-[#f9f9f9] shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6 text-center py-8">
              <AppIcon name="bookmark" className="w-8 h-8 text-[#ddd] mx-auto mb-3" />
              <p className="text-sm text-[#545454]/70">
                Quando você salvar receitas, ideias e conteúdos de outras seções, eles aparecerão aqui.
              </p>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
