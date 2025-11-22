'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { SoftCard } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';
import { MemoryModal, type MemoryData } from '@/components/maternar/MemoryModal';
import { getBrazilDateKey } from '@/app/lib/dateKey';

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
  description: string;
  icon: string;
  howToUnlock: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface GamificationState {
  xpTotal: number;
  xpToday: number;
  level: number;
  streakDays: number;
  activeHabits: number;
  unlockedSeals: number;
  missionsDaily: Mission[];
  missionsWeekly: Mission[];
  weekProgress: Record<string, { completed: boolean }>;
  seals: Seal[];
}

// ===== CONSTANTS =====
const DEFAULT_MISSIONS_DAILY: Mission[] = [
  { id: 'd1', title: 'Registrar como estou hoje', xp: 10, completed: false },
  { id: 'd2', title: 'Completar meu planner', xp: 15, completed: false },
  { id: 'd3', title: 'Fazer pausa de autocuidado', xp: 20, completed: false },
  { id: 'd4', title: 'Registrar uma conquista', xp: 25, completed: false },
];

const DEFAULT_MISSIONS_WEEKLY: Mission[] = [
  { id: 'w1', title: 'Completar 5 missões diárias', xp: 50, completed: false },
  { id: 'w2', title: 'Adicionar 3 memórias', xp: 40, completed: false },
  { id: 'w3', title: 'Manter sequência 3+ dias', xp: 35, completed: false },
];

const DEFAULT_SEALS: Seal[] = [
  {
    id: 's1',
    name: 'Primeira Estrela',
    description: 'Ganhe seu primeiro nível',
    icon: 'star',
    howToUnlock: 'Acumule 500 XP para atingir o nível 2',
    unlocked: false,
  },
  {
    id: 's2',
    name: 'Coração Generoso',
    description: 'Complete uma semana inteira',
    icon: 'heart',
    howToUnlock: 'Complete missões 7 dias seguidos',
    unlocked: false,
  },
  {
    id: 's3',
    name: 'Coroa de Força',
    description: 'Atinja o nível 5',
    icon: 'crown',
    howToUnlock: 'Acumule 2.000 XP ou mais',
    unlocked: false,
  },
  {
    id: 's4',
    name: 'Momento Mágico',
    description: 'Registre 10 memórias',
    icon: 'sparkles',
    howToUnlock: 'Adicione 10 memórias à sua coleção',
    unlocked: false,
  },
  {
    id: 's5',
    name: 'Crescimento Natural',
    description: 'Complete todas as missões da semana',
    icon: 'leaf',
    howToUnlock: 'Finalize todas as 7 missões em uma semana',
    unlocked: false,
  },
  {
    id: 's6',
    name: 'Luz e Esperança',
    description: 'Chegue a 30 dias de sequência',
    icon: 'sun',
    howToUnlock: 'Mantenha uma sequência de 30 dias',
    unlocked: false,
  },
];

const STORAGE_KEY = 'm360:gamification:minhas-conquistas';

// ===== UTILITIES =====
function initializeGamificationState(): GamificationState {
  return {
    xpTotal: 0,
    xpToday: 0,
    level: 1,
    streakDays: 0,
    activeHabits: 0,
    unlockedSeals: 0,
    missionsDaily: DEFAULT_MISSIONS_DAILY,
    missionsWeekly: DEFAULT_MISSIONS_WEEKLY,
    weekProgress: {},
    seals: DEFAULT_SEALS,
  };
}

function loadGamificationState(): GamificationState {
  try {
    if (typeof window === 'undefined') return initializeGamificationState();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load gamification state:', e);
  }
  return initializeGamificationState();
}

function saveGamificationState(state: GamificationState) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save gamification state:', e);
  }
}

function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 500) + 1;
}

function getXPForCurrentLevel(totalXP: number): { current: number; next: number; percentage: number } {
  const level = calculateLevel(totalXP);
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const currentXP = totalXP - xpForCurrentLevel;
  const nextLevelXP = xpForNextLevel - xpForCurrentLevel;
  return {
    current: currentXP,
    next: nextLevelXP,
    percentage: (currentXP / nextLevelXP) * 100,
  };
}

// ===== SEAL MODAL =====
function SealDetailModal({
  seal,
  isOpen,
  onClose,
}: {
  seal: Seal | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !seal) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-[0_20px_48px_rgba(0,0,0,0.15)] max-w-sm w-full p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-[#FFE8F2] flex items-center justify-center">
              <AppIcon name={seal.icon as any} className="w-6 h-6 text-[#FF1475]" decorative />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#6A6A6A] hover:bg-[#FFE8F2]/30 rounded-lg transition-colors"
            >
              <AppIcon name="x" size={20} decorative />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3A3A3A] mb-1">{seal.name}</h3>
            <p className="text-sm text-[#6A6A6A]">{seal.description}</p>
          </div>

          <div className="py-4 border-t border-b border-[#FFE8F2]">
            <p className="text-xs font-semibold text-[#6A6A6A] mb-2 uppercase tracking-wide">
              Como conquistar
            </p>
            <p className="text-sm text-[#3A3A3A]">{seal.howToUnlock}</p>
          </div>

          {seal.unlocked && (
            <div className="flex items-center gap-2 text-sm text-[#FF1475] font-semibold">
              <AppIcon name="check-circle" size={16} decorative />
              Conquistado em {seal.unlockedAt ? new Date(seal.unlockedAt).toLocaleDateString('pt-BR') : ''}
            </div>
          )}

          <Button variant="outline" onClick={onClose} className="w-full h-10 rounded-xl">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function MinhasConquistasPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [gamification, setGamification] = useState<GamificationState>(initializeGamificationState());
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryData | null>(null);
  const [selectedSeal, setSelectedSeal] = useState<Seal | null>(null);
  const [sealModalOpen, setSealModalOpen] = useState(false);

  const currentDateKey = useMemo(() => getBrazilDateKey(), []);

  // Load state on mount
  useEffect(() => {
    const loadedGamification = loadGamificationState();
    setGamification(loadedGamification);

    try {
      const storedMemories = localStorage.getItem('maternar:memories:v1');
      if (storedMemories) {
        setMemories(JSON.parse(storedMemories));
      }
    } catch (e) {
      console.error('Failed to load memories:', e);
    }

    setIsHydrated(true);
  }, []);

  // Save gamification state whenever it changes
  useEffect(() => {
    if (isHydrated) {
      saveGamificationState(gamification);
    }
  }, [gamification, isHydrated]);

  const toggleMission = useCallback(
    (type: 'daily' | 'weekly', id: string) => {
      setGamification(prev => {
        const newState = { ...prev };
        const missions = type === 'daily' ? newState.missionsDaily : newState.missionsWeekly;
        const mission = missions.find(m => m.id === id);

        if (mission) {
          if (!mission.completed) {
            // Mark as complete
            mission.completed = true;
            newState.xpToday += mission.xp;
            newState.xpTotal += mission.xp;
            newState.level = calculateLevel(newState.xpTotal);

            // Mark day as completed
            if (!newState.weekProgress[currentDateKey]) {
              newState.weekProgress[currentDateKey] = { completed: true };
            }
          } else {
            // Undo completion
            mission.completed = false;
            newState.xpToday -= mission.xp;
            newState.xpTotal -= mission.xp;
            newState.level = calculateLevel(newState.xpTotal);
          }
        }

        return newState;
      });
    },
    [currentDateKey],
  );

  const openSealDetail = useCallback((seal: Seal) => {
    setSelectedSeal(seal);
    setSealModalOpen(true);
  }, []);

  const openMemoryModal = useCallback((memory: MemoryData) => {
    setSelectedMemory(memory);
    setMemoryModalOpen(true);
  }, []);

  const openNewMemoryModal = useCallback(() => {
    setSelectedMemory(null);
    setMemoryModalOpen(true);
  }, []);

  const handleSaveMemory = useCallback((memory: MemoryData) => {
    setMemories(prev => {
      const existing = prev.find(m => m.id === memory.id);
      if (existing) {
        return prev.map(m => (m.id === memory.id ? memory : m));
      } else {
        return [...prev, memory];
      }
    });
    setMemoryModalOpen(false);
  }, []);

  const handleDeleteMemory = useCallback((memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
  }, []);

  const xpProgress = getXPForCurrentLevel(gamification.xpTotal);
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  const weeklyCompletedDays = Object.values(gamification.weekProgress).filter(d => d.completed).length;

  if (!isHydrated) {
    return null;
  }

  return (
    <ClientOnly>
      <main data-layout="page-template-v1" className="bg-white min-h-[100dvh] pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HEADER */}
          <Reveal delay={0}>
            <header className="pt-6 md:pt-8 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] mb-2">
                Minhas Conquistas
              </h1>
              <p className="text-base md:text-lg text-[#6A6A6A]">
                Cada pequeno avanço importa. Você está evoluindo.
              </p>
            </header>
          </Reveal>

          <div className="space-y-8 md:space-y-10">
            {/* BLOCK 1: SEU PAINEL DE PROGRESSO */}
            <Reveal delay={50}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Seu painel de progresso
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Cada pequeno avanço importa. Você está evoluindo.
                  </p>
                </div>

                {/* XP Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs md:text-sm text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold">
                      XP de hoje
                    </p>
                    <p className="text-3xl md:text-4xl font-bold text-[#FF1475]">
                      {gamification.xpToday}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs md:text-sm text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold">
                      XP total
                    </p>
                    <p className="text-3xl md:text-4xl font-bold text-[#FF1475]">
                      {gamification.xpTotal}
                    </p>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#3A3A3A]">Próximo nível</span>
                    <span className="text-xs text-[#6A6A6A]">
                      {xpProgress.current} / {xpProgress.next} XP
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#FFE8F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-700"
                      style={{ width: `${xpProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6A6A6A] text-center mt-2">
                    Faltam {Math.max(0, xpProgress.next - xpProgress.current)} XP para o próximo nível
                  </p>
                </div>
              </SoftCard>
            </Reveal>

            {/* BLOCK 2: SEU PROGRESSO DA SEMANA */}
            <Reveal delay={100}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Seu progresso da semana
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Veja quantos dias você conseguiu cuidar de si nesta semana.
                  </p>
                </div>

                {/* Week Pills */}
                <div className="flex justify-between gap-2 mb-6">
                  {weekDays.map((day, idx) => {
                    const dayDate = new Date();
                    dayDate.setDate(dayDate.getDate() - (6 - idx));
                    const dayKey = dayDate.toISOString().split('T')[0];
                    const isCompleted = gamification.weekProgress[dayKey]?.completed || false;

                    return (
                      <div
                        key={day}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full text-xs font-semibold transition-all ${
                          isCompleted
                            ? 'bg-[#FF1475] text-white shadow-[0_4px_12px_rgba(255,20,117,0.2)]'
                            : 'bg-white border border-[#FFE8F2] text-[#6A6A6A]'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#3A3A3A]">Dias completos</span>
                    <span className="text-xs text-[#6A6A6A]">
                      {weeklyCompletedDays} de 7
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FFE8F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-700"
                      style={{ width: `${(weeklyCompletedDays / 7) * 100}%` }}
                    />
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* BLOCK 3: MISSÕES */}
            <Reveal delay={150}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Missões
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Pequenas ações que mantêm sua jornada viva.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Missões Diárias */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#3A3A3A] mb-3 flex items-center gap-2">
                      <AppIcon name="sun" size={16} className="text-[#FF1475]" decorative />
                      Missões diárias
                    </h3>
                    <div className="space-y-2">
                      {gamification.missionsDaily.map(mission => (
                        <button
                          key={mission.id}
                          onClick={() => toggleMission('daily', mission.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                            mission.completed
                              ? 'bg-[#FFE8F2] border border-[#FF1475]/30'
                              : 'bg-white border border-[#FFE8F2] hover:bg-[#FFFBFD]'
                          }`}
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#FF1475]/40 bg-white flex items-center justify-center">
                            {mission.completed && (
                              <AppIcon name="check" className="w-4 h-4 text-[#FF1475]" decorative />
                            )}
                          </div>
                          <span
                            className={`flex-1 text-sm font-medium text-left transition-all ${
                              mission.completed ? 'text-[#FF1475] line-through' : 'text-[#3A3A3A]'
                            }`}
                          >
                            {mission.title}
                          </span>
                          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-[#9B4D96]/10 text-xs font-semibold text-[#9B4D96]">
                            +{mission.xp} XP
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#FFE8F2]" />

                  {/* Missões Semanais */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#3A3A3A] mb-3 flex items-center gap-2">
                      <AppIcon name="calendar" size={16} className="text-[#FF1475]" decorative />
                      Missões semanais
                    </h3>
                    <div className="space-y-2">
                      {gamification.missionsWeekly.map(mission => (
                        <button
                          key={mission.id}
                          onClick={() => toggleMission('weekly', mission.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                            mission.completed
                              ? 'bg-[#FFE8F2] border border-[#FF1475]/30'
                              : 'bg-white border border-[#FFE8F2] hover:bg-[#FFFBFD]'
                          }`}
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#FF1475]/40 bg-white flex items-center justify-center">
                            {mission.completed && (
                              <AppIcon name="check" className="w-4 h-4 text-[#FF1475]" decorative />
                            )}
                          </div>
                          <span
                            className={`flex-1 text-sm font-medium text-left transition-all ${
                              mission.completed ? 'text-[#FF1475] line-through' : 'text-[#3A3A3A]'
                            }`}
                          >
                            {mission.title}
                          </span>
                          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-[#9B4D96]/10 text-xs font-semibold text-[#9B4D96]">
                            +{mission.xp} XP
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* BLOCK 4: SEU NÍVEL */}
            <Reveal delay={200}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Seu nível
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Hoje você está em <span className="font-semibold text-[#FF1475]">Nível {gamification.level}</span> — Cuidadora em Evolução.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="w-full h-4 bg-[#FFE8F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF1475] to-[#9B4D96] transition-all duration-700"
                      style={{ width: `${xpProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6A6A6A] text-center leading-relaxed">
                    Continue caminhando no seu ritmo. Cada gesto de cuidado conta.
                  </p>
                </div>
              </SoftCard>
            </Reveal>

            {/* BLOCK 5: SELOS & MEDALHAS */}
            <Reveal delay={250}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Selos &amp; medalhas
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Conquistas que marcam sua jornada.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {gamification.seals.map(seal => (
                    <button
                      key={seal.id}
                      onClick={() => openSealDetail(seal)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 ${
                        seal.unlocked
                          ? 'bg-white border border-[#FFE8F2] hover:shadow-[0_4px_12px_rgba(255,20,117,0.1)]'
                          : 'bg-[#FFE8F2]/30 border border-[#FFE8F2] hover:bg-[#FFE8F2]/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2">
                        <AppIcon
                          name={seal.icon as any}
                          className={`w-6 h-6 ${seal.unlocked ? 'text-[#FF1475]' : 'text-[#BDBDBD]'}`}
                          decorative
                        />
                      </div>
                      <p className="text-xs font-semibold text-center text-[#3A3A3A] line-clamp-2">
                        {seal.name}
                      </p>
                      {seal.unlocked && (
                        <p className="text-[10px] text-[#FF1475] mt-1 font-medium">Conquistado</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#FFE8F2]">
                  <p className="text-sm text-[#6A6A6A]">
                    Você desbloqueou <span className="font-semibold text-[#FF1475]">
                      {gamification.seals.filter(s => s.unlocked).length} de {gamification.seals.length}
                    </span> selos.
                  </p>
                </div>
              </SoftCard>
            </Reveal>

            {/* BLOCK 6: MEMÓRIAS DA SEMANA */}
            <Reveal delay={300}>
              <SoftCard className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-1">
                    Memórias da semana
                  </h2>
                  <p className="text-sm text-[#6A6A6A]">
                    Momentos especiais que você quer guardar.
                  </p>
                </div>

                {memories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {memories.map(memory => (
                      <button
                        key={memory.id}
                        onClick={() => openMemoryModal(memory)}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-[#FFE8F2] bg-white hover:bg-[#FFFBFD] hover:shadow-[0_4px_12px_rgba(255,20,117,0.1)] transition-all duration-200 active:bg-[#FFE8F2]/30 text-left"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FFE8F2] flex items-center justify-center">
                          <AppIcon name={memory.icon as any} className="w-5 h-5 text-[#FF1475]" decorative />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#3A3A3A] line-clamp-1">
                            {memory.title}
                          </p>
                          <p className="text-xs text-[#6A6A6A] line-clamp-1">
                            {memory.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#FFE8F2] flex items-center justify-center mx-auto mb-3">
                      <AppIcon name="bookmark" className="w-6 h-6 text-[#FF1475]" decorative />
                    </div>
                    <p className="text-sm text-[#6A6A6A]">
                      Nenhuma memória registrada ainda.
                    </p>
                    <p className="text-xs text-[#6A6A6A]/60 mt-1">
                      Comece a guardar seus momentos especiais!
                    </p>
                  </div>
                )}

                <Button variant="primary" onClick={openNewMemoryModal} className="w-full h-11 rounded-xl">
                  <AppIcon name="plus" size={16} decorative className="mr-2" />
                  Adicionar memória
                </Button>
              </SoftCard>
            </Reveal>

            {/* BLOCK 7: RESUMO DE PROGRESSO */}
            <Reveal delay={350}>
              <SoftCard className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mb-6">
                  Resumo de progresso
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold text-center">
                      Dias de sequência
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">
                      {gamification.streakDays}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold text-center">
                      Hábitos ativos
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">
                      {gamification.activeHabits}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold text-center">
                      Selos desbloqueados
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">
                      {gamification.seals.filter(s => s.unlocked).length}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFBFD]">
                    <p className="text-xs text-[#6A6A6A] mb-2 uppercase tracking-wide font-semibold text-center">
                      XP acumulado
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-[#FF1475]">
                      {gamification.xpTotal}
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* Closing Message */}
            <Reveal delay={400}>
              <div className="text-center py-8 md:py-12">
                <p className="text-xs md:text-sm text-[#6A6A6A]/75 leading-relaxed max-w-md mx-auto">
                  Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SealDetailModal seal={selectedSeal} isOpen={sealModalOpen} onClose={() => setSealModalOpen(false)} />
      <MemoryModal
        isOpen={memoryModalOpen}
        memory={selectedMemory}
        onClose={() => {
          setMemoryModalOpen(false);
          setSelectedMemory(null);
        }}
        onSave={handleSaveMemory}
        onDelete={handleDeleteMemory}
      />
    </ClientOnly>
  );
}
