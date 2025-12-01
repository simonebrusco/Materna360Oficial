// app/api/maternabox/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RD_OLD_CONVERSIONS_URL =
  'https://www.rdstation.com.br/api/1.3/conversions';

export async function POST(request: NextRequest) {
  try {
    const publicToken = process.env.RD_CONVERSIONS_API_KEY;

    if (!publicToken) {
      console.error('RD_CONVERSIONS_API_KEY não configurada na Vercel');
      return NextResponse.json(
        { error: 'Configuração de integração ausente.' },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body.name as string | undefined)?.trim();
    const email = (body.email as string | undefined)?.trim();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório.' },
        { status: 400 },
      );
    }

    // Payload no formato exigido pela API antiga da RD Station
    const formData = new URLSearchParams({
      token_rdstation: publicToken,
      identificador: 'lista-espera-maternabox',
      email,
    });

    if (name) {
      formData.append('nome', name);
    }

    // Campo personalizado para marcar que é lista da MaternaBox
    formData.append('cf_lista_maternabox', 'Interessada');

    const rdResponse = await fetch(RD_OLD_CONVERSIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await rdResponse.text().catch(() => '');

    if (!rdResponse.ok) {
      console.error(
        'Erro RD Station (status):',
        rdResponse.status,
        'resposta:',
        text,
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível registrar sua inscrição agora. Tente novamente em alguns minutos.',
        },
        { status: 502 },
      );
    }

    console.log('RD Station retorno OK:', text);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro interno na waitlist MaternaBox:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
