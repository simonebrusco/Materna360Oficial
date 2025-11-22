'use client';

import { useState } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { SoftCard } from '@/components/ui/card';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';

// ===== TYPES =====
interface Mission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

interface Seal {
  id: string;
  name: string;
  icon: string;
}

// ===== MOCKDATA =====
const MOCK_MISSIONS: Mission[] = [
  { id: '1', title: 'Registrar como estou hoje', xp: 10, completed: false },
  { id: '2', title: 'Preencher meu planner', xp: 20, completed: false },
  { id: '3', title: 'Fazer uma pausa de 5 minutos sem culpa', xp: 15, completed: false },
  { id: '4', title: 'Registrar uma conquista', xp: 25, completed: false },
];

const MOCK_SEALS: Seal[] = [
  { id: '1', name: 'Primeiro passo', icon: 'star' },
  { id: '2', name: 'Semana leve', icon: 'sun' },
  { id: '3', name: 'Cuidando de mim', icon: 'heart' },
  { id: '4', name: 'Conectando com meu filho', icon: 'sparkles' },
  { id: '5', name: 'Força e serenidade', icon: 'crown' },
  { id: '6', name: 'Jornada consciente', icon: 'bookmark' },
];

// ===== BLOCO 1: SEU PAINEL DE PROGRESSO =====
function PainalProgresso() {
  const xpAtual = 180;
  const xpProximo = 500;
  const percentual = (xpAtual / xpProximo) * 100;

  return (
    <Reveal delay={0}>
      <SoftCard className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A3A3A] mb-2">
            Seu painel de progresso
          </h2>
          <p className="text-sm md:text-base text-[#6A6A6A]">
            Cada pequeno avanço importa.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Stat 1: Pontuação de hoje */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD] border border-[#FFE8F2]">
            <p className="text-xs md:text-sm text-[#6A6A6A] font-semibold uppercase tracking-wide mb-2">
              Pontuação hoje
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#FF1475]">320</p>
          </div>

          {/* Stat 2: Pontuação total */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD] border border-[#FFE8F2]">
            <p className="text-xs md:text-sm text-[#6A6A6A] font-semibold uppercase tracking-wide mb-2">
              Pontuação total
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#FF1475]">4.250</p>
          </div>

          {/* Stat 3: Dias de sequência */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD] border border-[#FFE8F2]">
            <p className="text-xs md:text-sm text-[#6A6A6A] font-semibold uppercase tracking-wide mb-2">
              Sequência
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#FF1475]">3</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#3A3A3A]">Próximo nível</span>
            <span className="text-xs text-[#6A6A6A]">{xpAtual} / {xpProximo} XP</span>
          </div>

          {/* Background bar */}
          <div className="w-full h-3 bg-[#FFE8F2] rounded-full overflow-hidden">
            {/* Filled bar with gradient */}
            <div
              className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-700 ease-out"
              style={{ width: `${percentual}%` }}
            />
          </div>

          {/* Text below bar */}
          <p className="text-xs text-[#6A6A6A] text-center">
            Faltam {xpProximo - xpAtual} XP para o próximo nível
          </p>
        </div>
      </SoftCard>
    </Reveal>
  );
}

// ===== BLOCO 2: MISSÕES DE HOJE =====
function MissõesDeHoje() {
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);

  const toggleMission = (id: string) => {
    setMissions(prev =>
      prev.map(mission =>
        mission.id === id ? { ...mission, completed: !mission.completed } : mission
      )
    );
  };

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <Reveal delay={100}>
      <SoftCard className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A3A3A] mb-2">
            Missões de hoje
          </h2>
          <p className="text-sm md:text-base text-[#6A6A6A]">
            Pequenas ações que valem pontos.
          </p>
        </div>

        {/* Missions List */}
        <div className="space-y-3 mb-6">
          {missions.map(mission => (
            <div
              key={mission.id}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 border ${
                mission.completed
                  ? 'bg-[#FFE8F2] border-[#FF1475]/30'
                  : 'bg-white border-[#FFE8F2] hover:bg-[#FFFBFD]'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleMission(mission.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  mission.completed
                    ? 'bg-[#FF1475] border-[#FF1475]'
                    : 'bg-white border-[#FF1475]/40 hover:border-[#FF1475]/70'
                }`}
                aria-label={`Marcar: ${mission.title}`}
              >
                {mission.completed && (
                  <AppIcon name="check" size={14} className="text-white" decorative />
                )}
              </button>

              {/* Mission Title */}
              <span
                className={`flex-1 text-sm md:text-base font-medium transition-all ${
                  mission.completed ? 'text-[#FF1475] line-through' : 'text-[#3A3A3A]'
                }`}
              >
                {mission.title}
              </span>

              {/* XP Badge */}
              <div className="flex-shrink-0 px-3 py-1 rounded-full bg-[#9B4D96]/10 text-xs font-semibold text-[#9B4D96]">
                +{mission.xp} XP
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="pt-4 border-t border-[#FFE8F2]">
          <p className="text-xs md:text-sm text-[#6A6A6A]">
            Você completou <span className="font-semibold text-[#FF1475]">{completedCount}</span> de{' '}
            <span className="font-semibold text-[#FF1475]">{missions.length}</span> missões.
          </p>
        </div>
      </SoftCard>
    </Reveal>
  );
}

// ===== BLOCO 3: SELOS DESBLOQUEADOS =====
function SelosDesbloqueados() {
  return (
    <Reveal delay={200}>
      <SoftCard className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A3A3A] mb-2">
            Selos desbloqueados
          </h2>
          <p className="text-sm md:text-base text-[#6A6A6A]">
            Uma coleção das suas pequenas grandes vitórias.
          </p>
        </div>

        {/* Seals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {MOCK_SEALS.map(seal => (
            <div
              key={seal.id}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-[#FFE8F2] hover:shadow-[0_4px_12px_rgba(255,20,117,0.08)] transition-all duration-200"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-[#FFE8F2] flex items-center justify-center mb-3">
                <AppIcon
                  name={seal.icon as any}
                  size={24}
                  className="text-[#FF1475]"
                  decorative
                />
              </div>

              {/* Name */}
              <p className="text-sm font-semibold text-[#3A3A3A] text-center mb-2 line-clamp-2">
                {seal.name}
              </p>

              {/* Badge */}
              <div className="px-2 py-1 rounded-full bg-[#FFE8F2] text-xs font-medium text-[#FF1475]">
                Conquistado
              </div>
            </div>
          ))}
        </div>
      </SoftCard>
    </Reveal>
  );
}

// ===== MAIN PAGE =====
export default function MinhasConquistasPage() {
  return (
    <ClientOnly>
      <main data-layout="page-template-v1" className="bg-white min-h-[100dvh] pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Page Header */}
          <Reveal delay={0}>
            <header className="pt-6 md:pt-8 mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-[#3A3A3A] mb-2">
                Minhas Conquistas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Versão gamificada v0.1 – teste de layout
              </p>
              <p className="text-base md:text-lg text-[#6A6A6A]">
                Você está evoluindo. Pequenos passos levam longe.
              </p>
            </header>
          </Reveal>

          {/* Main Content Blocks */}
          <div className="space-y-8 md:space-y-10">
            <PainalProgresso />
            <MissõesDeHoje />
            <SelosDesbloqueados />

            {/* Closing Message */}
            <Reveal delay={300}>
              <div className="text-center py-12">
                <p className="text-xs md:text-sm text-[#6A6A6A]/75 leading-relaxed max-w-lg mx-auto">
                  Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o
                  Materna360 caminha com você.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
    </ClientOnly>
  );
}
