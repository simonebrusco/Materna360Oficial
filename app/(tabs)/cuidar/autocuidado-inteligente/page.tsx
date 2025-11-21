'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

const AUTOCUIDADO_KEY = 'eu360/autocuidado-inteligente'

type AutocuidadoDia = {
  ritmo?: {
    estiloDia: string | null
    tags?: string[]
    nota?: string | null
  }
  rotina?: {
    itensSelecionados: string[]
  }
  saude?: {
    hidratacao?: number | null
    sono?: number | null
    alimentacao?: 'leve' | 'ok' | 'pesada' | null
    humorEmoji?: string | null
  }
  sugestao?: {
    escolhida?: string | null
  }
}

type AutocuidadoStorage = {
  [dateKey: string]: AutocuidadoDia
}

const RITMO_OPTIONS = ['leve', 'cansada', 'animada', 'exausta', 'focada']
const MINI_ROTINA_ITEMS = [
  'Respirar por 1 minuto',
  'Tomar um copo de água',
  'Fazer um alongamento rápido',
  'Mover o corpo por 3 minutos',
  'Pausa sem culpa por 5 minutos',
]

const SUGESTOES_FIXAS = [
  'Beba um copo de água com calma, sem pressa.',
  'Respire fundo por 1 minuto antes de pegar o celular.',
  'Envie uma mensagem carinhosa para alguém que te apoia.',
  'Dê uma pausa de 3 minutos só para você.',
  'Alongue o corpo enquanto bebe algo quente.',
  'Anote uma coisa que você fez bem hoje.',
]

export default function AutocuidadoInteligentePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Ritmo state
  const [selectedRitmo, setSelectedRitmo] = useState<string | null>(null)
  const [ritmoNota, setRitmoNota] = useState<string>('')

  // Mini rotina state
  const [selectedRotinItems, setSelectedRotinaItems] = useState<Set<string>>(new Set())

  // Saúde state
  const [hidratacao, setHidratacao] = useState<number | null>(null)
  const [sono, setSono] = useState<string | null>(null)
  const [alimentacao, setAlimentacao] = useState<'leve' | 'ok' | 'pesada' | null>(null)

  // Sugestão state
  const [sugestaoAtual, setSugestaoAtual] = useState<string | null>(null)

  // Load persisted data on hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {})
    const diaData = storage[currentDateKey] || {}

    console.log('[Autocuidado] Dados carregados para:', currentDateKey, diaData)

    if (diaData.ritmo?.estiloDia) {
      setSelectedRitmo(diaData.ritmo.estiloDia)
    }
    if (diaData.ritmo?.nota) {
      setRitmoNota(diaData.ritmo.nota)
    }
    if (diaData.rotina?.itensSelecionados) {
      setSelectedRotinaItems(new Set(diaData.rotina.itensSelecionados))
    }
    if (diaData.saude?.hidratacao !== undefined) {
      setHidratacao(diaData.saude.hidratacao)
    }
    if (diaData.saude?.sono) {
      setSono(diaData.saude.sono)
    }
    if (diaData.saude?.alimentacao) {
      setAlimentacao(diaData.saude.alimentacao)
    }
    if (diaData.sugestao?.escolhida) {
      setSugestaoAtual(diaData.sugestao.escolhida)
    }
  }, [isHydrated, currentDateKey])

  // CARD 1: Meu ritmo hoje
  const handleSalvarRitmo = () => {
    if (!selectedRitmo) {
      toast.danger('Selecione um ritmo para continuar.')
      return
    }

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {}) ?? {}
    storage[currentDateKey] = storage[currentDateKey] || {}
    storage[currentDateKey].ritmo = {
      estiloDia: selectedRitmo,
      nota: ritmoNota || null,
    }

    save(AUTOCUIDADO_KEY, storage)

    try {
      track('autocuidado_ritmo_salvo', {
        dateKey: currentDateKey,
        estiloDia: selectedRitmo,
        temNota: !!ritmoNota,
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear ritmo:', e)
    }

    toast.success('Seu ritmo de hoje foi salvo com carinho.')
  }

  // CARD 2: Mini rotina de cuidado
  const handleToggleRotinaItem = (item: string) => {
    setSelectedRotinaItems((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }

  const handleSalvarRotina = () => {
    if (selectedRotinItems.size === 0) {
      toast.danger('Selecione pelo menos um item para continuar.')
      return
    }

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {}) ?? {}
    storage[currentDateKey] = storage[currentDateKey] || {}
    storage[currentDateKey].rotina = {
      itensSelecionados: Array.from(selectedRotinItems),
    }

    save(AUTOCUIDADO_KEY, storage)

    try {
      track('autocuidado_rotina_salva', {
        dateKey: currentDateKey,
        totalItens: selectedRotinItems.size,
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear rotina:', e)
    }

    toast.success('Sua mini rotina de cuidado foi salva. Você merece esse cuidado.')
  }

  // CARD 3: Saúde & bem-estar
  const handleSalvarSaude = () => {
    if (hidratacao === null && !sono && !alimentacao) {
      toast.danger('Registre pelo menos um dado de saúde para continuar.')
      return
    }

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {}) ?? {}
    storage[currentDateKey] = storage[currentDateKey] || {}
    storage[currentDateKey].saude = {
      hidratacao: hidratacao,
      sono: sono ?? null,
      alimentacao: alimentacao ?? null,
    }

    save(AUTOCUIDADO_KEY, storage)

    try {
      track('autocuidado_saude_salva', {
        dateKey: currentDateKey,
        temHidratacao: hidratacao !== null,
        temSono: sono !== null,
        temAlimentacao: alimentacao !== null,
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear saúde:', e)
    }

    toast.success('Seus cuidados de saúde de hoje foram salvos.')
  }

  // CARD 4: Para você hoje
  const handleGerarSugestao = () => {
    const indexAleatorio = Math.floor(Math.random() * SUGESTOES_FIXAS.length)
    setSugestaoAtual(SUGESTOES_FIXAS[indexAleatorio])

    try {
      track('autocuidado_sugestao_gerada', {
        dateKey: currentDateKey,
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear sugestão:', e)
    }
  }

  const handleSalvarSugestao = () => {
    if (!sugestaoAtual) {
      toast.danger('Gere uma sugestão primeiro.')
      return
    }

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {}) ?? {}
    storage[currentDateKey] = storage[currentDateKey] || {}
    storage[currentDateKey].sugestao = {
      escolhida: sugestaoAtual,
    }

    save(AUTOCUIDADO_KEY, storage)

    try {
      track('autocuidado_sugestao_salva', {
        dateKey: currentDateKey,
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear salvamento da sugestão:', e)
    }

    toast.success('Sugestão salva para você revisitar quando quiser.')
  }

  return (
    <PageTemplate
      label="CUIDAR"
      title="Autocuidado Inteligente"
      subtitle="Cuidados que cabem na rotina, feitos na sua medida."
    >
      <ClientOnly>
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1 — Meu Ritmo Hoje */}
            <Reveal delay={0}>
              <SoftCard className="h-full rounded-2xl p-5 md:p-6 bg-white/90 backdrop-blur-sm border border-[#f3f3f5] shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Meu ritmo hoje
                    </h3>
                    <p className="text-sm text-[#545454] mt-1">
                      Conte pra gente que tipo de dia você está vivendo hoje.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Ritmo buttons */}
                    <div>
                      <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2 block">
                        Como você está?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {RITMO_OPTIONS.map((ritmo) => (
                          <button
                            key={ritmo}
                            onClick={() => setSelectedRitmo(selectedRitmo === ritmo ? null : ritmo)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedRitmo === ritmo
                                ? 'bg-[#ffd8e6] text-[#ff005e] border border-[#ff005e]'
                                : 'bg-white text-[#2f3a56] border border-[#e8e8ec] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                            }`}
                          >
                            {ritmo.charAt(0).toUpperCase() + ritmo.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nota textarea */}
                    <div>
                      <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2 block">
                        Deixe uma nota (opcional)
                      </label>
                      <textarea
                        value={ritmoNota}
                        onChange={(e) => setRitmoNota(e.target.value)}
                        placeholder="Se quiser, escreva um pouco sobre o seu ritmo hoje..."
                        className="w-full p-3 rounded-lg border border-[#e8e8ec] bg-white text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:border-[#ff005e] resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSalvarRitmo}
                    className="w-full mt-4 px-4 py-2.5 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all"
                  >
                    Salvar meu ritmo
                  </button>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 2 — Mini Rotina de Cuidado */}
            <Reveal delay={50}>
              <SoftCard className="h-full rounded-2xl p-5 md:p-6 bg-white/90 backdrop-blur-sm border border-[#f3f3f5] shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Mini rotina de cuidado
                    </h3>
                    <p className="text-sm text-[#545454] mt-1">
                      Escolha pequenos gestos de cuidado que caibam no seu momento.
                    </p>
                  </div>

                  <div className="space-y-2 flex-1">
                    {MINI_ROTINA_ITEMS.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#ffd8e6]/10 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRotinItems.has(item)}
                          onChange={() => handleToggleRotinaItem(item)}
                          className="w-4 h-4 rounded border-[#e8e8ec] text-[#ff005e] cursor-pointer"
                        />
                        <span className="text-sm text-[#2f3a56] flex-1">{item}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSalvarRotina}
                    className="w-full mt-4 px-4 py-2.5 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all"
                  >
                    Salvar rotina de cuidado
                  </button>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 3 — Saúde & Bem-Estar */}
            <Reveal delay={100}>
              <SoftCard className="h-full rounded-2xl p-5 md:p-6 bg-white/90 backdrop-blur-sm border border-[#f3f3f5] shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Saúde & bem-estar
                    </h3>
                    <p className="text-sm text-[#545454] mt-1">
                      Registre como seu corpo está hoje, sem culpa e sem pressão.
                    </p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Hidratação */}
                    <div>
                      <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2 block">
                        Hidratação
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Preciso beber mais', 'Estou me cuidando bem'].map((label, idx) => (
                          <button
                            key={label}
                            onClick={() => setHidratacao(hidratacao === idx ? null : idx)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              hidratacao === idx
                                ? 'bg-[#ffd8e6] text-[#ff005e] border border-[#ff005e]'
                                : 'bg-white text-[#2f3a56] border border-[#e8e8ec] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sono */}
                    <div>
                      <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2 block">
                        Sono
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Pouco (≤6h)', 'Adequado (7-8h)', 'Restaurador (9+h)'].map((label) => (
                          <button
                            key={label}
                            onClick={() => setSono(sono === label ? null : label)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              sono === label
                                ? 'bg-[#ffd8e6] text-[#ff005e] border border-[#ff005e]'
                                : 'bg-white text-[#2f3a56] border border-[#e8e8ec] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alimentação */}
                    <div>
                      <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2 block">
                        Alimentação
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'leve', label: 'Leve' },
                          { key: 'ok', label: 'Equilibrada' },
                          { key: 'pesada', label: 'Pesada' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() =>
                              setAlimentacao(alimentacao === (key as typeof alimentacao) ? null : (key as typeof alimentacao))
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              alimentacao === key
                                ? 'bg-[#ffd8e6] text-[#ff005e] border border-[#ff005e]'
                                : 'bg-white text-[#2f3a56] border border-[#e8e8ec] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSalvarSaude}
                    className="w-full mt-4 px-4 py-2.5 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all"
                  >
                    Salvar saúde & bem-estar
                  </button>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 4 — Para Você Hoje */}
            <Reveal delay={150}>
              <SoftCard className="h-full rounded-2xl p-5 md:p-6 bg-white/90 backdrop-blur-sm border border-[#f3f3f5] shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Para você hoje
                    </h3>
                    <p className="text-sm text-[#545454] mt-1">
                      Sugestões carinhosas para lembrar de você no meio de tudo.
                    </p>
                  </div>

                  <div className="flex-1 space-y-4">
                    {sugestaoAtual ? (
                      <div className="p-4 rounded-lg bg-[#ffd8e6]/10 border border-[#ffd8e6] space-y-3">
                        <p className="text-base text-[#2f3a56] leading-relaxed font-medium">
                          {sugestaoAtual}
                        </p>
                        <button
                          onClick={handleGerarSugestao}
                          className="text-sm text-[#ff005e] font-semibold hover:underline transition-all"
                        >
                          Gerar outra
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#f5f5f7] text-center">
                        <p className="text-sm text-[#545454]">
                          Clique em "Gerar sugestão" para descobrir um cuidado especial para você hoje.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {!sugestaoAtual ? (
                      <button
                        onClick={handleGerarSugestao}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all"
                      >
                        Gerar sugestão
                      </button>
                    ) : (
                      <button
                        onClick={handleSalvarSugestao}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all"
                      >
                        Salvar essa sugestão
                      </button>
                    )}
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
