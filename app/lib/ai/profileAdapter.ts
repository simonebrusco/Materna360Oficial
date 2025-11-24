// app/lib/ai/profileAdapter.ts

import {
  type MaternaProfile,
  type MaternaChildProfile,
} from '@/app/lib/ai/maternaCore'
import { adaptEu360ProfileToMaterna } from '@/app/lib/ai/eu360ProfileAdapter'

export type MaternaContext = {
  profile: MaternaProfile | null
  child: MaternaChildProfile | null
}

/**
 * Carrega o perfil da mãe + criança principal a partir do Eu360,
 * usando a mesma API interna já existente.
 *
 * Esse adapter existe para evitar duplicar essa lógica em cada endpoint de IA.
 */
export async function loadMaternaContextFromRequest(
  req: Request,
): Promise<MaternaContext> {
  try {
    const url = new URL('/api/eu360/profile', req.url)

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        // repassa cookies para manter o contexto da usuária
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return { profile: null, child: null }
    }

    const data = await res.json().catch(() => null)

    return adaptEu360ProfileToMaterna(data)
  } catch (error) {
    console.debug(
      '[profileAdapter] Falha ao carregar Eu360, usando contexto neutro:',
      error,
    )

    return { profile: null, child: null }
  }
}
