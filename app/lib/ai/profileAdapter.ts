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
    // Em dev (codespaces/port-forward), req.url pode vir como https,
    // mas o next dev dentro do container responde em HTTP.
    // Se construirmos URL absoluta com https e chamarmos o servidor HTTP,
    // estoura ERR_SSL_PACKET_LENGTH_TOO_LONG. Por isso derivamos a origem por headers.
    const host =
      req.headers.get('x-forwarded-host') ??
      req.headers.get('host') ??
      'localhost:3001'

    const forwardedProto = req.headers.get('x-forwarded-proto')
    const isLocalHost =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.includes('0.0.0.0')

    // Força http para hosts locais (dev). Em prod, respeita x-forwarded-proto quando existir.
    const proto = isLocalHost ? 'http' : forwardedProto ?? 'https'
    const origin = `${proto}://${host}`

    const url = new URL('/api/eu360/profile', origin)

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        // repassa cookies para manter o contexto da usuária
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (!res.ok) return { profile: null, child: null }

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
