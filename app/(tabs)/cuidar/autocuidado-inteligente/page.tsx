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

type SelfCareAISuggestion = {
  headline: string
  description: string
  tips: string[]
  reminder: string
}

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
  const [aiSuggestion, setAiSuggestion] =
    useState<SelfCareAISuggestion | null>(null)
  const [isLoadingSugestao, setIsLoadingSugestao] = useState(false)

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

    try {
      void updateXP(15)
    } catch (e) {
      console.error('[Autocuidado] Erro ao atualizar XP (saúde):', e)
    }

    toast.success('Seus cuidados de saúde de hoje foram salvos.')
  }

  // CARD 4: Para Você Hoje — IA + fallback
  const buildFallbackSuggestion = () => {
    const indexAleatorio = Math.floor(Math.random() * SUGESTOES_FIXAS.length)
    const texto = SUGESTOES_FIXAS[indexAleatorio]
    setAiSuggestion(null)
    setSugestaoAtual(texto)
    return texto
  }

  const handleGerarSugestao = async () => {
    setIsLoadingSugestao(true)

    try {
      // Chama IA no backend com contexto do dia
      const res = await fetch('/api/ai/autocuidado-inteligente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateKey: currentDateKey,
          ritmo: selectedRitmo,
          nota: ritmoNota || null,
          hidratacao,
          sono,
          alimentacao,
        }),
      })

      if (!res.ok) {
        console.error('[Autocuidado] IA retornou status', res.status)
        const texto = buildFallbackSuggestion()
        toast.info(
          'Não consegui falar com a IA agora, então te trouxe um carinho simples para hoje.',
        )
        try {
          track('autocuidado_sugestao_gerada', {
            dateKey: currentDateKey,
            via: 'fallback',
          })
        } catch {
          // ignora
        }
        return
      }

      const data = await res.json()
      const suggestion: SelfCareAISuggestion | undefined = data?.suggestion

      if (!suggestion || !suggestion.headline) {
        console.warn('[Autocuidado] Sugestão de IA vazia, usando fallback.')
        const texto = buildFallbackSuggestion()
        try {
          track('autocuidado_sugestao_gerada', {
            dateKey: currentDateKey,
            via: 'fallback',
          })
        } catch {
          // ignora
        }
        return
      }

      setAiSuggestion(suggestion)

      // texto-resumo para salvar no storage simples
      const resumo =
        suggestion.reminder ||
        suggestion.tips?.[0] ||
        suggestion.description ||
        suggestion.headline

      setSugestaoAtual(resumo)

      try {
        track('autocuidado_sugestao_gerada', {
          dateKey: currentDateKey,
          via: 'ia',
        })
      } catch (e) {
        console.error('[Autocuidado] Erro ao rastrear sugestão IA:', e)
      }

      try {
        void updateXP(12)
      } catch (e) {
        console.error('[Autocuidado] Erro ao atualizar XP (IA sugestão):', e)
      }
    } catch (e) {
      console.error('[Autocuidado] Erro geral ao gerar sugestão:', e)
      const texto = buildFallbackSuggestion()
      toast.info(
        'A conexão com a IA falhou agora, mas preparei um carinho simples para você.',
      )
      try {
        track('autocuidado_sugestao_gerada', {
          dateKey: currentDateKey,
          via: 'error-fallback',
        })
      } catch {
        // ignora
      }
    } finally {
      setIsLoadingSugestao(false)
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
        via: aiSuggestion ? 'ia' : 'fixa',
      })
    } catch (e) {
      console.error('[Autocuidado] Erro ao rastrear salvamento da sugestão:', e)
    }

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
        {/* MESMO PADRÃO DE LAYOUT DO "COMO ESTOU HOJE" */}
        <div className="pt-6 pb-12 space-y-10 max-w-5xl mx-auto">
          {/* BLOCO 1 — Hoje / Cuidados que combinam com o seu ritmo */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white/95 border border-[#ffd8e6] shadow-[0_14px_40px_rgba(0,0,0,0.16)]">
              <div className="space-y-6">
                {/* Header do bloco */}
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Hoje
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Cuidados que combinam com o seu ritmo de agora.
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Escolha como você está e organize pequenos gestos de cuidado
                    que caibam no seu momento — um passo de cada vez, sem
                    perfeição e sem culpa.
                  </p>
                </header>

                {/* Grid com dois cards: Meu Ritmo Hoje + Mini Rotina de Cuidado */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* CARD 1 — Meu Ritmo Hoje */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 border-b border-[#ffd8e6] pb-4">
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
                          <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-3">
                            Como você está?
                          </p>
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
                          <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2.5">
                            Deixe uma nota (opcional)
                          </p>
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
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 border-b border-[#ffd8e6] pb-4">
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
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white/95 border border-[#ffd8e6] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div className="space-y-6">
                {/* Header do bloco */}
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Corpo & bem-estar
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Cuide do seu corpo e receba um carinho só para você.
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Registre como você está hoje e deixe o Materna360 sugerir um
                    cuidado especial para o seu momento.
                  </p>
                </header>

                {/* Grid com dois cards: Saúde & Bem-Estar + Para Você Hoje */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* CARD 3 — Saúde & Bem-Estar */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 border-b border-[#ffd8e6] pb-4">
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
                          <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                            💧 Hidratação
                          </p>
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
                          <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                            😴 Sono
                          </p>
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
                          <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                            🍽️ Alimentação
                          </p>
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
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 border-b border-[#ffd8e6] pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="lightbulb"
                            size={18}
                            className="text-[#ff005e]"
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
                          <div className="p-4 rounded-2xl bg-[#fff7fb]/80 border border-[#ffd8e6]/70 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                            {aiSuggestion ? (
                              <>
                                <p className="text-sm md:text-base leading-relaxed text-[#2f3a56] font-semibold">
                                  {aiSuggestion.headline}
                                </p>
                                <p className="text-sm text-[#545454]">
                                  {aiSuggestion.description}
                                </p>
                                {aiSuggestion.tips?.length > 0 && (
                                  <ul className="mt-2 space-y-1.5 text-sm text-[#2f3a56] list-disc list-inside">
                                    {aiSuggestion.tips.map(tip => (
                                      <li key={tip}>{tip}</li>
                                    ))}
                                  </ul>
                                )}
                                {aiSuggestion.reminder && (
                                  <p className="mt-2 text-xs text-[#545454]">
                                    {aiSuggestion.reminder}
                                  </p>
                                )}
                                <button
                                  onClick={handleGerarSugestao}
                                  disabled={isLoadingSugestao}
                                  className="mt-3 text-sm font-semibold text-[#ff005e] hover:text-[#cf285f] transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                                >
                                  {isLoadingSugestao
                                    ? 'Gerando outro carinho...'
                                    : 'Ver outra sugestão'}
                                  {!isLoadingSugestao && (
                                    <AppIcon
                                      name="refresh-cw"
                                      size={14}
                                      decorative
                                    />
                                  )}
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-sm md:text-base leading-relaxed text-[#2f3a56] font-medium">
                                  {sugestaoAtual}
                                </p>
                                <button
                                  onClick={handleGerarSugestao}
                                  disabled={isLoadingSugestao}
                                  className="mt-3 text-sm font-semibold text-[#ff005e] hover:text-[#cf285f] transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                                >
                                  {isLoadingSugestao
                                    ? 'Gerando outro carinho...'
                                    : 'Ver outra sugestão'}
                                  {!isLoadingSugestao && (
                                    <AppIcon
                                      name="refresh-cw"
                                      size={14}
                                      decorative
                                    />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-[#fff7fb]/60 border border-[#ffd8e6]/70 text-center">
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
                            disabled={isLoadingSugestao}
                            className="w-full disabled:opacity-60"
                          >
                            {isLoadingSugestao
                              ? 'Gerando um carinho para você...'
                              : 'Gerar um carinho para hoje'}
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

          {/* BLOCO 3 — FAIXA EXPLICATIVA */}
          <SoftCard className="rounded-3xl p-5 md:p-6 bg-white/90 border border-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Por que esse cuidado importa
                </p>
                <p className="text-sm text-[#545454] max-w-xl">
                  Quando você registra seu ritmo, pequenos gestos e como o
                  corpo está, o Materna360 te ajuda a enxergar padrões de
                  cansaço, energia e pausas possíveis. Isso vira base para um
                  dia mais leve, sem precisar se encaixar em uma rotina
                  perfeita.
                </p>
              </div>
              <div className="mt-1 flex items-start gap-2 text-xs text-[#545454]/90 max-w-xs">
                <div className="mt-0.5">
                  <AppIcon name="sparkles" className="h-4 w-4 text-[#ff005e]" />
                </div>
                <p>
                  Cuidar de você também é maternar. Cada gesto aqui conta como
                  presença com você mesma — e isso reflete em todo o resto.
                </p>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="cuidar-autocuidado-inteligente" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
