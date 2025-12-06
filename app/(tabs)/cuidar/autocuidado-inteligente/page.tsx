'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { updateXP } from '@/app/lib/xp'

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
    sono?: string | null
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
  const [selectedRotinItems, setSelectedRotinaItems] = useState<Set<string>>(
    new Set(),
  )

  // Saúde state
  const [hidratacao, setHidratacao] = useState<number | null>(null)
  const [sono, setSono] = useState<string | null>(null)
  const [alimentacao, setAlimentacao] = useState<
    'leve' | 'ok' | 'pesada' | null
  >(null)

  // Sugestão state
  const [sugestaoAtual, setSugestaoAtual] = useState<string | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Carrega dados salvos do dia
  useEffect(() => {
    if (!isHydrated) return

    const storage = load<AutocuidadoStorage>(AUTOCUIDADO_KEY, {}) ?? {}
    const diaData = storage[currentDateKey] || {}

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
      setHidratacao(diaData.saude.hidratacao ?? null)
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

  // CARD 1: Meu Ritmo Hoje
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

    // XP por registrar o ritmo do dia
    try {
      void updateXP(10)
    } catch (e) {
      console.error('[Autocuidado] Erro ao atualizar XP (ritmo):', e)
    }

    toast.success('Seu ritmo de hoje foi salvo com carinho.')
  }

  // CARD 2: Mini Rotina de Cuidado
  const handleToggleRotinaItem = (item: string) => {
    setSelectedRotinaItems(prev => {
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
      toast.danger('Selecione pelo menos um gesto de cuidado.')
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

    // XP por montar a mini rotina
    try {
      void updateXP(15)
    } catch (e) {
      console.error('[Autocuidado] Erro ao atualizar XP (rotina):', e)
    }

    toast.success(
      'Sua mini rotina de cuidado foi salva. Um passo de cada vez já é muito.',
    )
  }

  // CARD 3: Saúde & Bem-Estar
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

    // XP por registrar cuidado com o corpo
    try {
      void updateXP(15)
    } catch (e) {
      console.error('[Autocuidado] Erro ao atualizar XP (saúde):', e)
    }

    toast.success('Seus cuidados de saúde de hoje foram salvos.')
  }

  // CARD 4: Para Você Hoje
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

    // XP por salvar um carinho para si mesma
    try {
      void updateXP(10)
    } catch (e) {
      console.error('[Autocuidado] Erro ao atualizar XP (sugestão):', e)
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
        <div className="max-w-6xl mx-auto px-4 pb-12 md:pb-16 space-y-6 md:space-y-8">
          {/* BLOCO 1 — Hoje / Cuidados Que Cabem No Seu Agora */}
          <Reveal delay={0}>
            <SoftCard className="rounded-[32px] md:rounded-[36px] p-5 md:p-7 lg:p-8 bg-white/5 border border-white/40 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="space-y-6 md:space-y-7">
                {/* Header do bloco */}
                <div className="space-y-2 md:space-y-3">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.16em] uppercase text-white/80">
                    Hoje
                  </p>
                  <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug">
                    Cuidados que combinam com o seu ritmo de agora.
                  </h2>
                  <p className="text-xs md:text-sm text-white/80 max-w-2xl">
                    Escolha como você está e organize pequenos gestos de cuidado
                    que caibam no seu momento — um passo de cada vez, sem
                    perfeição e sem culpa.
                  </p>
                </div>

                {/* Grid com dois cards: Meu Ritmo Hoje + Mini Rotina de Cuidado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-7">
                  {/* CARD 1 — Meu Ritmo Hoje */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      {/* Card Header */}
                      <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="sparkles"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Meu Ritmo Hoje
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Conte para o Materna360 que tipo de dia você está
                          vivendo — leve, corrido, cansado ou cheio de energia.
                        </p>
                      </div>

                      <div className="space-y-5 flex-1">
                        {/* Ritmo buttons */}
                        <div>
                          <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3 block">
                            Como você está?
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {RITMO_OPTIONS.map(ritmo => (
                              <button
                                key={ritmo}
                                onClick={() =>
                                  setSelectedRitmo(
                                    selectedRitmo === ritmo ? null : ritmo,
                                  )
                                }
                                className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
                                  selectedRitmo === ritmo
                                    ? 'bg-[#ff005e] text-white shadow-md border border-[#ff005e]'
                                    : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15'
                                }`}
                              >
                                {ritmo.charAt(0).toUpperCase() + ritmo.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Nota textarea */}
                        <div>
                          <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2.5 block">
                            Deixe uma nota (opcional)
                          </label>
                          <textarea
                            value={ritmoNota}
                            onChange={e => setRitmoNota(e.target.value)}
                            placeholder="Se quiser, escreva um pouco sobre como o dia está aí…"
                            className="w-full p-3 rounded-2xl border border-[#ffd8e6] bg-white text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:border-[#ff005e] focus:ring-2 focus:ring-[#ff005e]/20 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSalvarRitmo}
                          className="w-full"
                        >
                          Salvar meu ritmo de hoje
                        </Button>
                        <p className="mt-3 text-[11px] md:text-xs text-[#545454] text-center">
                          Cada registro é um jeito de se escutar com mais
                          carinho.
                        </p>
                      </div>
                    </div>
                  </SoftCard>

                  {/* CARD 2 — Mini Rotina de Cuidado */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      {/* Card Header */}
                      <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="heart"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Mini Rotina de Cuidado
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Escolha pequenos gestos que caibam na sua realidade de
                          hoje — sem listas impossíveis.
                        </p>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {MINI_ROTINA_ITEMS.map(item => (
                          <label
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#ffd8e6]/10 cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#ff005e]/20"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRotinItems.has(item)}
                              onChange={() => handleToggleRotinaItem(item)}
                              className="w-5 h-5 rounded border-[#ffd8e6] text-[#ff005e] cursor-pointer accent-[#ff005e]"
                            />
                            <span className="text-sm text-[#2f3a56] flex-1 font-medium">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>

                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSalvarRotina}
                          className="w-full"
                        >
                          Guardar minha mini rotina
                        </Button>
                        <p className="mt-3 text-[11px] md:text-xs text-[#545454] text-center">
                          Você não precisa fazer tudo: alguns poucos gestos já
                          contam como cuidado.
                        </p>
                      </div>
                    </div>
                  </SoftCard>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCO 2 — Corpo & Bem-Estar */}
          <Reveal delay={80}>
            <SoftCard className="rounded-[32px] md:rounded-[36px] p-5 md:pb-7 md:px-7 lg:p-8 bg-white/5 border border-white/40 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="space-y-6 md:space-y-7">
                {/* Header do bloco */}
                <div className="space-y-2 md:space-y-3">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.16em] uppercase text-white/80">
                    Corpo & bem-estar
                  </p>
                  <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug">
                    Cuide do seu corpo e receba um carinho só para você.
                  </h2>
                  <p className="text-xs md:text-sm text-white/80 max-w-2xl">
                    Registre como você está hoje e deixe o Materna360 sugerir um
                    cuidado especial para o seu momento.
                  </p>
                </div>

                {/* Grid com dois cards: Saúde & Bem-Estar + Para Você Hoje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-7">
                  {/* CARD 3 — Saúde & Bem-Estar */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      {/* Card Header */}
                      <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="zap"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Saúde & Bem-Estar
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Registre como seu corpo está hoje, sem julgamentos.
                        </p>
                      </div>

                      <div className="space-y-5 flex-1">
                        {/* Hidratação */}
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block">
                            💧 Hidratação
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { idx: 0, label: 'Preciso beber mais' },
                              { idx: 1, label: 'Estou me cuidando bem' },
                            ].map(({ idx, label }) => (
                              <button
                                key={label}
                                onClick={() =>
                                  setHidratacao(
                                    hidratacao === idx ? null : idx,
                                  )
                                }
                                className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
                                  hidratacao === idx
                                    ? 'bg-[#ff005e] text-white shadow-md border border-[#ff005e]'
                                    : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sono */}
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block">
                            😴 Sono
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              'Pouco (≤6h)',
                              'Adequado (7-8h)',
                              'Restaurador (9+h)',
                            ].map(label => (
                              <button
                                key={label}
                                onClick={() =>
                                  setSono(sono === label ? null : label)
                                }
                                className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
                                  sono === label
                                    ? 'bg-[#ff005e] text-white shadow-md border border-[#ff005e]'
                                    : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Alimentação */}
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide block">
                            🍽️ Alimentação
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
                                  setAlimentacao(
                                    alimentacao ===
                                      (key as typeof alimentacao)
                                      ? null
                                      : (key as typeof alimentacao),
                                  )
                                }
                                className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
                                  alimentacao === key
                                    ? 'bg-[#ff005e] text-white shadow-md border border-[#ff005e]'
                                    : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSalvarSaude}
                          className="w-full"
                        >
                          Salvar cuidados de hoje
                        </Button>
                        <p className="mt-3 text-[11px] md:text-xs text-[#545454] text-center">
                          Seu corpo também merece esse olhar gentil.
                        </p>
                      </div>
                    </div>
                  </SoftCard>

                  {/* CARD 4 — Para Você Hoje */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      {/* Card Header */}
                      <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="lightbulb"
                            size={18}
                            className="text-[#6A2C70]"
                            decorative
                          />
                          Para Você Hoje
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Sugestões carinhosas só para você — sem cobrança, só
                          acolhimento.
                        </p>
                      </div>

                      <div className="flex-1 space-y-4">
                        {sugestaoAtual ? (
                          <div className="p-4 rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/50 space-y-3">
                            <p className="text-sm md:text-base leading-relaxed text-[#2f3a56] font-medium">
                              {sugestaoAtual}
                            </p>
                            <button
                              onClick={handleGerarSugestao}
                              className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1"
                            >
                              Ver outra sugestão
                              <AppIcon
                                name="refresh-cw"
                                size={14}
                                decorative
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-[#ffd8e6]/10 border border-[#ffd8e6]/30 text-center">
                            <p className="text-sm text-[#545454]">
                              Clique abaixo para descobrir um cuidado especial
                              feito só para você hoje.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {!sugestaoAtual ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleGerarSugestao}
                            className="w-full"
                          >
                            Gerar um carinho para hoje
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSalvarSugestao}
                            className="w-full"
                          >
                            Guardar esse carinho para você
                          </Button>
                        )}
                        <p className="text-[11px] md:text-xs text-[#545454] text-center">
                          Você pode voltar aqui a qualquer momento para lembrar
                          desse cuidado.
                        </p>
                      </div>
                    </div>
                  </SoftCard>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="cuidar-autocuidado-inteligente" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
