import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, ageRange } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'E-mail é obrigatório.' },
        { status: 400 }
      );
    }

    // TODO: integrar com banco de dados / ferramenta de e-mail
    // Exemplo (Prisma):
    //
    // await prisma.maternaBoxWaitlist.create({
    //   data: {
    //     name,
    //     email,
    //     ageRange,
    //   },
    // });

    console.log('Nova inscrição na lista de espera MaternaBox:', {
      name,
      email,
      ageRange,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao registrar lista de espera MaternaBox:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar sua inscrição. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
