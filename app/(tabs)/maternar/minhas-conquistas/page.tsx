'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { SoftCard } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';

// ===== TYPES =====
interface DailyMission {
  id: string;
  label: string;
  completed: boolean;
}

interface Seal {
  id: string;
  name: string;
  icon: string;
  state: 'unlocked' | 'in-progress' | 'locked';
}

interface ProgressMetric {
  label: string;
  value: number | string;
  icon: string;
}

// ===== CONSTANTS =====
const DAILY_MISSIONS: DailyMission[] = [
  { id: '1', label: 'Registrar como estou hoje', completed: false },
  { id: '2', label: 'Completar meu planner', completed: false },
  { id: '3', label: 'Fazer 5 minutos de pausa sem culpa', completed: false },
  { id: '4', label: 'Registrar uma conquista', completed: false },
  { id: '5', label: 'Verificar memórias da semana', completed: false },
];

const SEALS: Seal[] = [
  { id: '1', name: 'Estrela Brilhante', icon: 'star', state: 'unlocked' },
  { id: '2', name: 'Coração Generoso', icon: 'heart', state: 'unlocked' },
  { id: '3', name: 'Coroa de Força', icon: 'crown', state: 'in-progress' },
  { id: '4', name: 'Mágica Cotidiana', icon: 'sparkles', state: 'in-progress' },
  { id: '5', name: 'Crescimento Natural', icon: 'leaf', state: 'locked' },
  { id: '6', name: 'Luz e Esperança', icon: 'sun', state: 'locked' },
];

const WEEKLY_PROGRESS_METRICS: ProgressMetric[] = [
  { label: 'Missões concluídas', value: 12, icon: 'check-circle' },
  { label: 'Dias ativos', value: 5, icon: 'calendar' },
  { label: 'Conquistas registradas', value: 8, icon: 'star' },
];

const QUICK_SUMMARY_ITEMS: ProgressMetric[] = [
  { label: 'Dias de sequência', value: 7, icon: 'flame' },
  { label: 'Hábitos ativos', value: 4, icon: 'target' },
  { label: 'Conquistas desbloqueadas', value: 12, icon: 'crown' },
  { label: 'XP acumulado', value: '450 XP', icon: 'sparkles' },
];

// ===== COMPONENTS =====

function HeaderWithQuickPanel() {
  const xpCurrent = 350;
  const xpNext = 500;
  const xpPercentage = (xpCurrent / xpNext) * 100;

  const getProgressText = () => {
    if (xpPercentage >= 100) return 'Parabéns! Próximo nível desbloqueado!';
    if (xpPercentage >= 75) return 'Quase lá! Continue assim!';
    if (xpPercentage >= 50) return 'Bom progresso, siga em frente!';
    return 'Falta pouco para o próximo nível';
  };

  return (
    <Reveal delay={0}>
      <header className="pt-6 md:pt-8 mb-8 md:mb-10">
        {/* Main Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] leading-tight mb-2">
            Minhas Conquistas
          </h1>
          <p className="text-base md:text-lg text-[#6A6A6A] leading-relaxed">
            Cada pequeno avanço importa. Você está evoluindo.
          </p>
        </div>

        {/* Quick Panel Card */}
        <SoftCard className="p-6 md:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {/* Daily Score */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs md:text-sm text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold">
                Pontuação do dia
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">125</p>
              <p className="text-xs text-[#6A6A6A]/60 mt-1">pts</p>
            </div>

            {/* Streak */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs md:text-sm text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold">
                Dias de sequência
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">7</p>
              <p className="text-xs text-[#6A6A6A]/60 mt-1">dias</p>
            </div>

            {/* Level */}
            <div className="flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <p className="text-xs md:text-sm text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold">
                Nível atual
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[#9B4D96]">3</p>
              <p className="text-xs text-[#6A6A6A]/60 mt-1">Cuidando de Mim</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#3A3A3A]">Experiência</span>
              <span className="text-xs text-[#6A6A6A]">
                {xpCurrent} / {xpNext} XP
              </span>
            </div>
            <div className="w-full h-2 bg-[#FFE8F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-500 ease-out"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <p className="text-xs text-[#6A6A6A] text-center mt-2">
              {getProgressText()}
            </p>
          </div>
        </SoftCard>
      </header>
    </Reveal>
  );
}

function DailyMissionsBlock() {
  const [missions, setMissions] = useState<DailyMission[]>(DAILY_MISSIONS);

  const toggleMission = (id: string) => {
    setMissions(m => m.map(mission =>
      mission.id === id ? { ...mission, completed: !mission.completed } : mission
    ));
  };

  const completedCount = missions.filter(m => m.completed).length;
  const completionPercentage = (completedCount / missions.length) * 100;

  const getProgressMessage = () => {
    if (completionPercentage === 100) return 'Missões de hoje completas!';
    if (completionPercentage >= 60) return 'Quase lá, mãe!';
    return 'Você já começou, continue!';
  };

  return (
    <Reveal delay={100}>
      <SoftCard className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
            Missões de hoje
          </h2>
          <p className="text-sm md:text-base text-[#6A6A6A]">
            Pequenas ações que valem pontos.
          </p>
        </div>

        {/* Missions List */}
        <div className="space-y-3 mb-6">
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              className={`flex items-center gap-3 p-3 md:p-4 rounded-2xl transition-all duration-200 ${
                mission.completed
                  ? 'bg-[#FFE8F2] border border-[#FF1475]/30'
                  : 'bg-white border border-[#FFE8F2] hover:bg-[#FFFBFD]'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleMission(mission.id)}
                className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#FF1475]/40 bg-white flex items-center justify-center transition-all duration-150 hover:border-[#FF1475] hover:bg-[#FF1475]/5"
                aria-label={`Toggle: ${mission.label}`}
              >
                {mission.completed && (
                  <AppIcon
                    name="check"
                    className="w-4 h-4 text-[#FF1475]"
                    decorative
                  />
                )}
              </button>

              {/* Mission Label */}
              <span
                className={`flex-1 text-sm md:text-base font-medium transition-all ${
                  mission.completed
                    ? 'text-[#FF1475] line-through'
                    : 'text-[#3A3A3A]'
                }`}
              >
                {mission.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#3A3A3A]">Progresso</span>
            <span className="text-xs text-[#6A6A6A]">
              {completedCount} de {missions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-[#FFE8F2] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Progress Message */}
        <p className="text-xs md:text-sm text-[#6A6A6A] text-center font-medium">
          {getProgressMessage()}
        </p>
      </SoftCard>
    </Reveal>
  );
}

function SealsAndMedalsBlock() {
  return (
    <Reveal delay={200}>
      <SoftCard className="p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
            Selos desbloqueados
          </h2>
          <p className="text-sm md:text-base text-[#6A6A6A]">
            Coleção de conquistas especiais
          </p>
        </div>

        {/* Seals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {SEALS.map(seal => (
            <div
              key={seal.id}
              className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-200 ${
                seal.state === 'unlocked'
                  ? 'bg-[#FFE8F2] border border-[#FF1475]/20 hover:shadow-[0_4px_12px_rgba(255,20,117,0.15)]'
                  : seal.state === 'in-progress'
                    ? 'bg-white border-2 border-dashed border-[#9B4D96]/40 hover:border-[#9B4D96]/60'
                    : 'bg-white border border-[#E9E9E9] hover:border-[#D0D0D0]'
              }`}
            >
              {/* Icon */}
              <div className="mb-3">
                <AppIcon
                  name={seal.icon as any}
                  className={`w-6 h-6 md:w-8 md:h-8 transition-all ${
                    seal.state === 'unlocked'
                      ? 'text-[#FF1475]'
                      : seal.state === 'in-progress'
                        ? 'text-[#9B4D96]'
                        : 'text-[#BDBDBD]'
                  }`}
                  decorative
                />
              </div>

              {/* Name */}
              <p className="text-xs md:text-sm font-semibold text-center text-[#3A3A3A]">
                {seal.name}
              </p>

              {/* State Badge */}
              {seal.state === 'in-progress' && (
                <p className="text-[10px] md:text-xs text-[#9B4D96] mt-2 font-medium">
                  Em progresso
                </p>
              )}
              {seal.state === 'locked' && (
                <AppIcon
                  name="lock"
                  className="w-3 h-3 text-[#BDBDBD] mt-2"
                  decorative
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-[#FFE8F2]">
          <p className="text-xs md:text-sm text-[#6A6A6A]">
            Você já desbloqueou <span className="font-semibold text-[#FF1475]">2 de 6</span> selos.
          </p>
          <Link
            href="#"
            onClick={e => e.preventDefault()}
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#FF1475] hover:text-[#E6005F] transition-colors"
          >
            Ver todos os selos
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </SoftCard>
    </Reveal>
  );
}

function ProgressAndSummaryBlock() {
  return (
    <Reveal delay={300}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Weekly Progress Card */}
        <SoftCard className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-6">
            Progresso da semana
          </h3>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full h-3 bg-[#FFE8F2] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] w-3/4 transition-all duration-500"
              />
            </div>
            <p className="text-xs text-[#6A6A6A] text-center">75% da meta semanal</p>
          </div>

          {/* Mini Metrics */}
          <div className="space-y-4">
            {WEEKLY_PROGRESS_METRICS.map((metric, idx) => (
              <div key={idx} className="flex items-center gap-3 pb-4 border-b border-[#FFE8F2]/50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFE8F2] flex items-center justify-center flex-shrink-0">
                  <AppIcon
                    name={metric.icon as any}
                    className="w-5 h-5 text-[#FF1475]"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6A6A6A]">{metric.label}</p>
                  <p className="text-base md:text-lg font-bold text-[#3A3A3A]">
                    {metric.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        {/* Quick Summary Card */}
        <SoftCard className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-6">
            Resumo de progresso
          </h3>

          {/* Summary Items */}
          <div className="space-y-0">
            {QUICK_SUMMARY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 py-4 border-b border-[#FFE8F2] last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFE8F2]/60 flex items-center justify-center flex-shrink-0">
                  <AppIcon
                    name={item.icon as any}
                    className="w-4 h-4 text-[#9B4D96]"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6A6A6A]">{item.label}</p>
                </div>
                <p className="text-base md:text-lg font-bold text-[#FF1475] min-w-fit">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SoftCard>
      </div>
    </Reveal>
  );
}

// ===== MAIN PAGE =====
export default function MinhasConquistasPage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <ClientOnly>
      <main
        data-layout="page-template-v1"
        className="bg-white min-h-[100dvh] pb-24"
      >
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <HeaderWithQuickPanel />
          <div className="space-y-8 md:space-y-10">
            <DailyMissionsBlock />
            <SealsAndMedalsBlock />
            <ProgressAndSummaryBlock />

            {/* Closing Statement */}
            <div className="text-center py-8 md:py-12">
              <p className="text-xs md:text-sm text-[#6A6A6A]/75 leading-relaxed max-w-md mx-auto">
                Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
              </p>
            </div>
          </div>
        </div>
      </main>
    </ClientOnly>
  );
}
