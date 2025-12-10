import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Não quebra o build, mas loga erro no servidor
  console.error(
    '[MaternaBox Waitlist] Variáveis de ambiente do Supabase ausentes. ' +
      'Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
  )
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const childAgeRange = String(body.childAgeRange ?? '').trim()
    const city = String(body.city ?? '').trim()
    const discoverySource = String(body.discoverySource ?? '').trim()
    const notes = String(body.notes ?? '').trim()

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'Nome e e-mail são obrigatórios.' },
        { status: 400 },
      )
    }

    // Se não tiver Supabase configurado, só loga e responde OK (modo “degradação suave”)
    if (!supabase) {
      console.warn(
        '[MaternaBox Waitlist] Supabase não configurado. Dados recebidos:',
        {
          name,
          email,
          childAgeRange,
          city,
          discoverySource,
          notes,
        },
      )

      return NextResponse.json(
        {
          ok: true,
          message:
            'Cadastro recebido em modo de testes. Em breve, a lista de espera estará 100% ativa.',
        },
        { status: 200 },
      )
    }

    const { error } = await supabase.from('materna_box_waitlist').insert({
      name,
      email,
      child_age_range: childAgeRange || null,
      city: city || null,
      discovery_source: discoverySource || null,
      notes: notes || null,
    })

    if (error) {
      console.error('[MaternaBox Waitlist] Erro ao salvar no Supabase:', error)
      return NextResponse.json(
        {
          ok: false,
          error:
            'Não conseguimos salvar seu cadastro agora. Tente novamente em alguns instantes.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          'Pronto! Você entrou para a lista de espera da MaternaBox. Vamos te avisar assim que as primeiras caixas forem liberadas.',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[MaternaBox Waitlist] Erro inesperado:', error)
    return NextResponse.json(
      {
        ok: false,
        error:
          'Tivemos um problema ao receber seus dados. Tente novamente em alguns instantes.',
      },
      { status: 500 },
    )
  }
}
