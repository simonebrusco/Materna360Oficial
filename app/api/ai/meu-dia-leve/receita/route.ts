import { NextResponse } from 'next/server'
import { track } from '@/app/lib/telemetry'

export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'

type Body = {
  slot?: Slot
  mood?: Mood
  pantry?: string
  childAgeMonths?: number | null
}

function clampSlot(v: unknown): Slot {
  const s = String(v ?? '').trim()
  return s === '3' || s === '5' || s === '10' ? s : '5'
}

function clampMood(v: unknown): Mood {
  const m = String(v ?? '').trim()
  return m === 'no-limite' || m === 'corrida' || m === 'ok' || m === 'leve' ? (m as Mood) : 'corrida'
}

function clampAgeMonths(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number.parseInt(String(v).trim(), 10)
  if (!Number.isFinite(n) || Number.isNaN(n)) return null
  if (n < 0) return 0
  if (n > 240) return 240
  return n
}

function sanitizePantry(pantryRaw: string): string {
  const raw = String(pantryRaw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!raw) return ''

  // limita tamanho para evitar payload enorme e manter UX
  return raw.slice(0, 180)
}

function tokenizePantry(pantry: string): string[] {
  return pantry
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10)
}

function hasAny(tokens: string[], keywords: string[]) {
  return tokens.some((t) => keywords.some((k) => t.includes(k)))
}

function firstMatch(tokens: string[], keywords: string[]) {
  return tokens.find((t) => keywords.some((k) => t.includes(k))) ?? null
}

/**
 * Regras de segurança (≥ 12 meses):
 * - sem mel (risco botulismo até 12m)
 * - sem oleaginosas/pasta de amendoim por padrão (alergênico; só com orientação/contexto)
 * - sem açúcar adicionado por padrão
 * - sem “sugestões perigosas” quando a mãe não pediu
 */
function buildHealthyKidRecipe(params: { tokens: string[]; ageMonths: number; slot: Slot; mood: Mood }) {
  const { tokens, ageMonths, slot, mood } = params

  // Ingredientes comuns detectáveis
  const hasBanana = hasAny(tokens, ['banana'])
  const hasEgg = hasAny(tokens, ['ovo'])
  const hasYogurt = hasAny(tokens, ['iogurte'])
  const hasOats = hasAny(tokens, ['aveia'])
  const hasRice = hasAny(tokens, ['arroz'])
  const hasBread = hasAny(tokens, ['pão', 'pao'])
  const hasCheese = hasAny(tokens, ['queijo'])
  const hasTomato = hasAny(tokens, ['tomate'])
  const hasCarrot = hasAny(tokens, ['cenoura'])
  const hasPumpkin = hasAny(tokens, ['abóbora', 'abobora'])
  const hasChicken = hasAny(tokens, ['frango'])
  const hasBeans = hasAny(tokens, ['feijão', 'feijao'])
  const hasPotato = hasAny(tokens, ['batata'])
  const hasApple = hasAny(tokens, ['maçã', 'maca'])
  const hasPear = hasAny(tokens, ['pera'])

  const time = slot === '3' ? '6 min' : slot === '5' ? '10 min' : '15 min'
  const yieldTxt = '1 porção (criança)'

  // Ajuste de tom (sem improviso; objetivo e cuidadoso)
  const toneLine =
    mood === 'no-limite'
      ? 'Vamos manter simples e seguro, sem complicar.'
      : mood === 'corrida'
        ? 'Uma opção rápida, com comida de verdade.'
        : mood === 'ok'
          ? 'Uma opção leve e nutritiva para o dia a dia.'
          : 'Uma opção tranquila, boa para manter a rotina leve.'

  // 1) Banana
  if (hasBanana) {
    // Preferir aveia se existir; senão, iogurte; senão, “banana + fruta” (sem açúcar)
    if (hasOats) {
      return [
        `Banana com aveia (a partir de ${ageMonths >= 12 ? '12' : '12'} meses)`,
        toneLine,
        ``,
        `Tempo: ${time} • Rende: ${yieldTxt}`,
        ``,
        `Ingredientes:`,
        `- 1 banana madura`,
        `- 1 a 2 colheres de sopa de aveia fina`,
        `- Água ou leite (opcional, só para ajustar a textura)`,
        ``,
        `Modo de preparo:`,
        `1) Amasse bem a banana com um garfo.`,
        `2) Misture a aveia até ficar homogêneo.`,
        `3) Se precisar, pingue um pouco de água/leite para ajustar a consistência.`,
        `4) Sirva em seguida.`,
        ``,
        `Observação: sem açúcar e sem mel. Se a criança tiver restrições, ajuste com orientação do pediatra.`,
      ].join('\n')
    }

    if (hasYogurt) {
      return [
        `Iogurte com banana amassada (a partir de 12 meses)`,
        toneLine,
        ``,
        `Tempo: ${time} • Rende: ${yieldTxt}`,
        ``,
        `Ingredientes:`,
        `- 1 banana madura`,
        `- 3 a 4 colheres de sopa de iogurte natural`,
        `- Canela (opcional, uma pitadinha)`,
        ``,
        `Modo de preparo:`,
        `1) Amasse a banana até virar um creme.`,
        `2) Misture com o iogurte até ficar uniforme.`,
        `3) Se quiser, finalize com uma pitadinha de canela.`,
        `4) Sirva imediatamente.`,
        ``,
        `Observação: prefira iogurte natural, sem açúcar.`,
      ].join('\n')
    }

    // fallback banana “pura” bem apresentada
    return [
      `Banana amassada bem cremosa (a partir de 12 meses)`,
      toneLine,
      ``,
      `Tempo: ${time} • Rende: ${yieldTxt}`,
      ``,
      `Ingredientes:`,
      `- 1 banana madura`,
      `- Água (opcional, só para ajustar textura)`,
      ``,
      `Modo de preparo:`,
      `1) Amasse bem a banana com um garfo.`,
      `2) Se precisar, pingue um pouco de água para deixar mais cremosa.`,
      `3) Sirva.`,
      ``,
      `Observação: simples e segura. Se quiser uma receita mais completa, escreva 2–3 itens (ex.: “banana, iogurte, aveia”).`,
    ].join('\n')
  }

  // 2) Ovo
  if (hasEgg) {
    // Se tiver arroz: arroz + ovo mexido (bem estruturado)
    if (hasRice) {
      return [
        `Arroz com ovo mexido e toque de legumes (a partir de 12 meses)`,
        toneLine,
        ``,
        `Tempo: ${time} • Rende: ${yieldTxt}`,
        ``,
        `Ingredientes:`,
        `- 3 a 5 colheres de sopa de arroz pronto`,
        `- 1 ovo`,
        `- 1 fio de azeite (opcional)`,
        `- Legumes picadinhos (opcional: cenoura cozida, abóbora cozida, tomate bem picado)`,
        ``,
        `Modo de preparo:`,
        `1) Em uma frigideira, bata o ovo com um garfo.`,
        `2) Cozinhe mexendo até firmar (sem deixar ressecar).`,
        `3) Misture o arroz pronto e aqueça por 1–2 minutos.`,
        `4) Se tiver, adicione um pouco de legume já cozido/picadinho e mexa.`,
        `5) Sirva morno.`,
        ``,
        `Observação: evite excesso de sal. Se a criança tiver alergias, confirme orientação médica.`,
      ].join('\n')
    }

    // Se tiver pão e queijo: “omeletinho” / sanduíche quente infantil
    if (hasBread && hasCheese) {
      return [
        `Omeletinho com queijo (a partir de 12 meses)`,
        toneLine,
        ``,
        `Tempo: ${time} • Rende: ${yieldTxt}`,
        ``,
        `Ingredientes:`,
        `- 1 ovo`,
        `- 1 colher de sopa de queijo ralado ou picadinho`,
        `- 1 fio de azeite ou manteiga (opcional)`,
        `- Pão (opcional, para acompanhar)`,
        ``,
        `Modo de preparo:`,
        `1) Bata o ovo com um garfo.`,
        `2) Misture o queijo.`,
        `3) Cozinhe em frigideira antiaderente em fogo baixo, até firmar.`,
        `4) Sirva em pedaços pequenos (morno).`,
        ``,
        `Observação: para ficar mais macio, cozinhe em fogo baixo e não deixe secar.`,
      ].join('\n')
    }

    // fallback ovo bem feito (não genérico demais)
    return [
      `Ovo mexido bem macio (a partir de 12 meses)`,
      toneLine,
      ``,
      `Tempo: ${time} • Rende: ${yieldTxt}`,
      ``,
      `Ingredientes:`,
      `- 1 ovo`,
      `- 1 colher de sopa de água ou leite (opcional, para ficar mais macio)`,
      `- 1 fio de azeite (opcional)`,
      ``,
      `Modo de preparo:`,
      `1) Bata o ovo (e a água/leite, se usar) com um garfo.`,
      `2) Cozinhe mexendo em fogo baixo até ficar cremoso (sem ressecar).`,
      `3) Sirva morno.`,
      ``,
      `Se você quiser que eu combine melhor, escreva 2–3 itens (ex.: “ovo, arroz, tomate”).`,
    ].join('\n')
  }

  // 3) Frango + legumes (se houver)
  if (hasChicken) {
    const veg = hasCarrot || hasPumpkin || hasPotato || hasTomato
    return [
      `Franguinho desfiado com legumes (a partir de 12 meses)`,
      toneLine,
      ``,
      `Tempo: ${time} • Rende: ${yieldTxt}`,
      ``,
      `Ingredientes:`,
      `- Frango cozido e desfiado (porção pequena)`,
      veg ? `- Legumes (cenoura/abóbora/batata/tomate), se tiver` : `- Legumes (opcional), se tiver`,
      `- 1 fio de azeite (opcional)`,
      ``,
      `Modo de preparo:`,
      `1) Aqueça o frango já cozido/desfiado.`,
      `2) Se tiver legumes já cozidos, amasse ou pique bem e misture.`,
      `3) Ajuste a textura com um pouquinho de água do cozimento, se necessário.`,
      `4) Sirva morno.`,
      ``,
      `Observação: evite temperos fortes e excesso de sal.`,
    ].join('\n')
  }

  // 4) Arroz + feijão (se houver)
  if (hasRice && hasBeans) {
    return [
      `Arroz com feijão bem amassadinho (a partir de 12 meses)`,
      toneLine,
      ``,
      `Tempo: ${time} • Rende: ${yieldTxt}`,
      ``,
      `Ingredientes:`,
      `- 3 a 5 colheres de sopa de arroz pronto`,
      `- 2 a 3 colheres de sopa de feijão (com caldo)`,
      `- Legume cozido (opcional: abóbora/cenoura)`,
      ``,
      `Modo de preparo:`,
      `1) Aqueça o feijão com um pouco do caldo.`,
      `2) Amasse levemente para ficar mais fácil para a criança.`,
      `3) Misture com o arroz pronto e aqueça mais 1 minuto.`,
      `4) Se tiver legume cozido, misture e sirva.`,
      ``,
      `Observação: textura e tempero sempre suaves.`,
    ].join('\n')
  }

  // 5) Fruta (maçã/pera) + iogurte
  if (hasYogurt && (hasApple || hasPear)) {
    const fruit = hasApple ? 'maçã' : 'pera'
    return [
      `Iogurte com ${fruit} picadinha (a partir de 12 meses)`,
      toneLine,
      ``,
      `Tempo: ${time} • Rende: ${yieldTxt}`,
      ``,
      `Ingredientes:`,
      `- Iogurte natural (3–4 colheres de sopa)`,
      `- ${fruit} bem picadinha ou ralada`,
      ``,
      `Modo de preparo:`,
      `1) Misture a fruta no iogurte.`,
      `2) Sirva na hora.`,
      ``,
      `Observação: prefira iogurte sem açúcar.`,
    ].join('\n')
  }

  // fallback final: ainda estruturado, mas pedindo mais itens
  const example = tokens.length ? tokens.slice(0, 3).join(', ') : 'ex.: “ovo, arroz, tomate”'
  return [
    `Receita simples para criança (a partir de 12 meses)`,
    toneLine,
    ``,
    `Tempo: ${time} • Rende: ${yieldTxt}`,
    ``,
    `O que você escreveu: ${example}`,
    ``,
    `Para eu acertar melhor com segurança, escreva 2–3 itens (ex.: “ovo, arroz, tomate” ou “banana, iogurte, aveia”).`,
  ].join('\n')
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantry = sanitizePantry(body?.pantry ?? '')
    const childAgeMonths = clampAgeMonths(body?.childAgeMonths)

    // Telemetria mínima (sem conteúdo sensível)
    try {
      track('ai.request', {
        feature: 'meu-dia-leve-receita',
        origin: 'maternar/meu-dia-leve',
        slot,
        mood,
        ageKnown: childAgeMonths !== null,
      })
    } catch {}

    // Gates rígidos por segurança
    if (childAgeMonths === null) {
      return NextResponse.json({
        ok: false,
        error: 'age_required',
      })
    }

    if (childAgeMonths < 6) {
      return NextResponse.json({
        ok: false,
        error: 'child_under_6_months',
      })
    }

    if (childAgeMonths >= 6 && childAgeMonths < 12) {
      return NextResponse.json({
        ok: false,
        error: 'intro_feeding_phase_6_12',
      })
    }

    // >= 12 meses
    if (!pantry) {
      return NextResponse.json({
        ok: false,
        error: 'pantry_required',
      })
    }

    const tokens = tokenizePantry(pantry)
    const text = buildHealthyKidRecipe({ tokens, ageMonths: childAgeMonths, slot, mood })

    const latencyMs = Date.now() - t0
    try {
      track('ai.response', {
        feature: 'meu-dia-leve-receita',
        origin: 'maternar/meu-dia-leve',
        latencyMs,
        ok: true,
      })
    } catch {}

    return NextResponse.json({ ok: true, text })
  } catch (e) {
    const latencyMs = Date.now() - t0
    try {
      track('ai.response', { feature: 'meu-dia-leve-receita', latencyMs, ok: false })
    } catch {}

    // fallback de emergência: nunca quebrar UI
    return NextResponse.json({ ok: false, error: 'unexpected' }, { status: 200 })
  }
}
