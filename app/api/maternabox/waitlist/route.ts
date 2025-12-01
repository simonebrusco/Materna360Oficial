// app/api/maternabox/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server'

const RD_CONVERSIONS_API_URL =
  'https://api.rd.services/platform/conversions'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RD_CONVERSIONS_API_KEY

    if (!apiKey) {
      console.error('RD_CONVERSIONS_API_KEY não configurada na Vercel')
      return NextResponse.json(
        { error: 'Configuração de integração ausente.' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = (body.name as string | undefined)?.trim()
    const email = (body.email as string | undefined)?.trim()

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório.' },
        { status: 400 }
      )
    }

    // Monta o payload de conversão para a RD Station
    const payload = {
      event_type: 'CONVERSION',
      event_family: 'CDP',
      payload: {
        conversion_identifier: 'Lista de espera MaternaBox',
        email,
        name,
        // Campo personalizado / tag para identificar a lista
        // ajuste o nome conforme você configurar na RD
        cf_lista_maternabox: 'Interessada',
      },
    }

    const rdResponse = await fetch(
      `${RD_CONVERSIONS_API_URL}?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!rdResponse.ok) {
      const text = await rdResponse.text().catch(() => '')
      console.error('Erro RD Station:', rdResponse.status, text)

      return NextResponse.json(
        { error: 'Não foi possível registrar sua inscrição agora.' },
        { status: 502 }
      )
    }

    // Se quiser, dá pra ler o retorno aqui:
    // const data = await rdResponse.json()

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro interno na waitlist MaternaBox:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
