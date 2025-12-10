// app/api/maternabox/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server'

const RD_OLD_CONVERSIONS_URL =
  'https://www.rdstation.com.br/api/1.3/conversions'

export async function POST(request: NextRequest) {
  try {
    const publicToken = process.env.RD_CONVERSIONS_API_KEY

    if (!publicToken) {
      console.error('RD_CONVERSIONS_API_KEY não configurada na Vercel')
      return NextResponse.json(
        { error: 'Configuração de integração ausente.' },
        { status: 500 },
      )
    }

    const body = await request.json().catch(() => ({} as any))

    const name = (body.name as string | undefined)?.trim()
    const email = (body.email as string | undefined)?.trim()
    const whatsapp = (body.whatsapp as string | undefined)?.trim()
    const source =
      ((body.source as string | undefined)?.trim() ||
        'materna-box-page')

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório.' },
        { status: 400 },
      )
    }

    // Payload no formato exigido pela API antiga da RD Station
    const formData = new URLSearchParams({
      token_rdstation: publicToken,
      identificador: 'lista-espera-maternabox',
      email,
    })

    if (name) {
      formData.append('nome', name)
    }

    // Campos extras (custom fields) — precisam existir configurados na RD
    if (whatsapp) {
      formData.append('whatsapp', whatsapp)
    }

    formData.append('cf_lista_maternabox', 'Interessada')
    formData.append('cf_origem_lead', source)

    const rdResponse = await fetch(RD_OLD_CONVERSIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const text = await rdResponse.text().catch(() => '')

    if (!rdResponse.ok) {
      console.error(
        'Erro RD Station (status):',
        rdResponse.status,
        'resposta:',
        text,
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível registrar sua inscrição agora. Tente novamente em alguns minutos.',
        },
        { status: 502 },
      )
    }

    console.log('RD Station retorno OK:', text)

    return NextResponse.json(
      {
        success: true,
        message:
          'Você foi adicionada à lista de espera da MaternaBox com sucesso.',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Erro interno na waitlist MaternaBox:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}
