'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'

type Task = {
  id: string
  title: string
  done: boolean
  priority: 'alta' | 'media' | 'baixa'
  origin: 'acao' | 'autocuidado' | 'carinho' | 'brincadeira' | 'biblioteca'
}

export function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Planejar o dia', done: false, priority: 'alta', origin: 'acao' },
    { id: '2', title: 'Meditação matinal', done: false, priority: 'media', origin: 'autocuidado' },
    { id: '3', title: 'Atividade com meu filho', done: false, priority: 'alta', origin: 'brincadeira' },
  ])

  const [contents] = useState([
    { id: 'c1', title: 'Receita: Smoothie saudável', type: 'receita', origin: 'Biblioteca' },
    { id: 'c2', title: 'Ideias de brincadeira', type: 'ideia', origin: 'Aprender' },
  ])

  // Greeting
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)

    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName)
      setGreeting(updatedGreeting)
    }, 60000)

    return () => clearInterval(interval)
  }, [name])

  // Track nav
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
  }, [])

  // Daily reload
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const timeoutId = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [])

  const dailyMessage = DAILY_MESSAGES[getDailyIndex(new Date(), DAILY_MESSAGES.length)]

  // Task management
  const toggleTask = (id: string) => setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)))

  const togglePriority = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const order: Task['priority'][] = ['alta', 'media', 'baixa']
        const currentIndex = order.indexOf(t.priority)
        const nextPriority = order[(currentIndex + 1) % order.length]
        return { ...t, priority: nextPriority }
      }
      return t
    }))
  }

  const addTask = (origin: Task['origin']) => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Math.random().toString(36).slice(2, 9),
        title: newTaskTitle,
        done: false,
        priority: 'media',
        origin,
      }
      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
      setIsAddingTask(false)
    }
  }

  // Group tasks
  const acoesDoDia = tasks.filter(t => t.origin === 'acao')
  const cuidarMim = tasks.filter(t => t.origin === 'autocuidado')
  const cuidarFilho = tasks.filter(t => ['carinho', 'brincadeira'].includes(t.origin))
  const completedCount = tasks.filter(t => t.done).length

  return (
    <PageTemplate label="MEU DIA" title="Seu Dia Organizado" subtitle="Um espaço para planejar com leveza.">
      <ClientOnly>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F6] to-white pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-gradient-to-b from-[#FFE5EF] to-transparent opacity-70 blur-[40px] pointer-events-none" />

          <div className="relative z-10">
            <div className="mx-auto max-w-[1040px] px-4 md:px-6 space-y-6 md:space-y-8">
              {/* HEADER SUPER PREMIUM */}
              <Reveal delay={0}>
                <header className="pt-6 md:pt-8" suppressHydrationWarning>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#2f3a56] leading-tight mb-6">{greeting}</h1>

                  {/* Mood Pills */}
                  <div className="space-y-3 mb-6">
                    <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide">Como você está?</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { id: 'happy', label: '😊 Feliz', color: 'from-yellow-50 to-yellow-100' },
                        { id: 'okay', label: '😐 Normal', color: 'from-blue-50 to-blue-100' },
                        { id: 'stressed', label: '😰 Estressada', color: 'from-red-50 to-red-100' },
                      ].map(mood => (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedMood === mood.id
                              ? `bg-gradient-to-r ${mood.color} border-2 border-[#ff005e] scale-105`
                              : 'bg-white border border-[#ddd] hover:border-[#ff005e]/30'
                          }`}
                        >
                          {mood.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day Tags */}
                  <div className="space-y-3">
                    <p className="text-xs md:text-sm font-semibold text-[#545454]/70 uppercase tracking-wide">Hoje eu quero um dia...</p>
                    <div className="flex gap-2 flex-wrap">
                      {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSelectedDay(selectedDay === tag ? null : tag)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedDay === tag
                              ? 'bg-[#ff005e] text-white shadow-md scale-105'
                              : 'bg-white border border-[#ddd] text-[#545454] hover:border-[#ff005e]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </header>
              </Reveal>

              {/* RESUMO DO DIA */}
              <Reveal delay={100}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="rounded-[22px] border border-black/5 bg-gradient-to-br from-pink-50 to-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6">
                    <div className="space-y-3">
                      <p className="text-xs md:text-sm font-semibold text-[#ff005e] uppercase tracking-wide">Meu Dia em 1 Minuto</p>
                      <div className="flex items-end gap-3">
                        <div>
                          <p className="text-3xl md:text-4xl font-bold text-[#2f3a56]">{completedCount}</p>
                          <p className="text-xs text-[#545454]/60">de {tasks.length} tarefas</p>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-[#ddd] rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#ff005e] to-[#ff4081] h-full transition-all duration-500"
                              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-black/5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6 flex items-center gap-4">
                    <AppIcon name="sparkles" className="w-8 h-8 text-[#ff005e] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#ff005e] uppercase tracking-wide mb-1">Frase do Dia</p>
                      <p className="text-sm md:text-base font-medium text-[#2f3a56] leading-relaxed">"{dailyMessage}"</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* AÇÕES DO DIA */}
              {acoesDoDia.length > 0 && (
                <Reveal delay={200}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AppIcon name="check-circle" className="w-5 h-5 text-[#ff005e]" />
                      <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">Ações do Dia</h2>
                    </div>

                    <div className="rounded-[22px] border border-black/5 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] p-5 md:p-6 space-y-3">
                      {acoesDoDia.map(task => (
                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.done ? 'bg-[#f5f5f5] border-[#ddd]' : 'bg-white border-[#ddd]'}`}>
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${task.done ? 'bg-[#ff005e] border-[#ff005e]' : 'border-[#ddd]'}`}
                          >
                            {task.done && <AppIcon name="check" className="w-4 h-4 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm font-medium ${task.done ? 'text-[#545454]/50 line-through' : 'text-[#2f3a56]'}`}>
                            {task.title}
                          </span>
                          <button
                            onClick={() => togglePriority(task.id)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              task.priority === 'alta' ? 'bg-[#ff005e]/10 text-[#ff005e]' : task.priority === 'media' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {task.priority}
                          </button>
                        </div>
                      ))}

                      <div className="mt-4 pt-4 border-t border-[#ddd]">
                        {!isAddingTask ? (
                          <button
                            onClick={() => setIsAddingTask(true)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80"
                          >
                            <AppIcon name="plus" className="w-4 h-4" />
                            Adicionar ação rápida
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nova ação..."
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') addTask('acao')
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
                              autoFocus
                            />
                            <button onClick={() => addTask('acao')} className="px-3 py-2 bg-[#ff005e] text-white rounded-lg text-sm font-medium hover:bg-[#ff005e]/90">
                              Adicionar
                            </button>
                            <button
                              onClick={() => {
                                setIsAddingTask(false)
                                setNewTaskTitle('')
                              }}
                              className="px-3 py-2 bg-[#f5f5f5] text-[#545454] rounded-lg text-sm font-medium hover:bg-[#e5e5e5]"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* CUIDAR DE MIM */}
              {cuidarMim.length > 0 && (
                <Reveal delay={300}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AppIcon name="heart" className="w-5 h-5 text-[#ff005e]" />
                      <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">Cuidar de Mim</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cuidarMim.map(task => (
                        <div
                          key={task.id}
                          className={`rounded-[16px] border border-black/5 p-4 transition-all ${
                            task.done ? 'bg-[#f5f5f5] shadow-sm' : 'bg-gradient-to-br from-pink-50 to-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                                task.done ? 'bg-[#ff005e] border-[#ff005e]' : 'border-[#ddd]'
                              }`}
                            >
                              {task.done && <AppIcon name="check" className="w-4 h-4 text-white" />}
                            </button>
                            <span className={`text-sm font-medium ${task.done ? 'text-[#545454]/50 line-through' : 'text-[#2f3a56]'}`}>
                              {task.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* CUIDAR DO MEU FILHO */}
              {cuidarFilho.length > 0 && (
                <Reveal delay={400}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AppIcon name="smile" className="w-5 h-5 text-[#ff005e]" />
                      <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">Cuidar do Meu Filho</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {cuidarFilho.map(task => (
                        <div
                          key={task.id}
                          className={`rounded-[14px] border border-black/5 p-3 transition-all ${
                            task.done ? 'bg-[#f5f5f5] shadow-sm' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="w-full flex items-center gap-2 mb-2"
                          >
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                task.done ? 'bg-[#ff005e] border-[#ff005e]' : 'border-[#ddd]'
                              }`}
                            >
                              {task.done && <AppIcon name="check" className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-xs font-medium line-clamp-2 ${task.done ? 'text-[#545454]/40 line-through' : 'text-[#2f3a56]'}`}>
                              {task.title}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* INSPIRAÇÕES & CONTEÚDOS */}
              {contents.length > 0 && (
                <Reveal delay={500}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AppIcon name="sparkles" className="w-5 h-5 text-[#ff005e]" />
                      <h2 className="text-lg md:text-xl font-bold text-[#2f3a56]">Inspirações & Conteúdos</h2>
                    </div>

                    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-2">
                      <div className="flex gap-3 min-w-min">
                        {contents.map(content => (
                          <div
                            key={content.id}
                            className="flex-shrink-0 w-40 md:w-48 rounded-[14px] border border-black/5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer group"
                          >
                            <div className="w-full aspect-video bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <AppIcon name="bookmark" className="w-8 h-8 text-[#ff005e]/40" />
                            </div>
                            <div className="p-3">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#ff005e]/70 bg-[#ffe3f0] px-2 py-0.5 rounded-full">
                                {content.type}
                              </span>
                              <h3 className="text-sm font-semibold text-[#2f3a56] line-clamp-2 mt-2">{content.title}</h3>
                              <p className="text-xs text-[#545454]/60 mt-1">{content.origin}</p>
                            </div>
                          </div>
                        ))}
                        <Link
                          href="/descobrir/salvos"
                          className="flex-shrink-0 w-40 md:w-48 rounded-[14px] border-2 border-dashed border-[#ddd] flex items-center justify-center p-4 hover:border-[#ff005e] transition-colors"
                        >
                          <div className="text-center space-y-2">
                            <AppIcon name="plus" className="w-6 h-6 text-[#545454]/40 mx-auto" />
                            <p className="text-xs font-medium text-[#545454]/60">Ver depósito</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Footer message */}
              <div className="mt-8 md:mt-10 text-center pb-12 md:pb-16">
                <p className="text-xs md:text-sm text-[#545454]/75 leading-relaxed">
                  Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
