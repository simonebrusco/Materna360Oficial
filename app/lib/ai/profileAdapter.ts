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

function getBaseUrlFromRequest(req: Request): string {
  const h = req.headers

  const xfProto = h.get('x-forwarded-proto')
  const xfHost = h.get('x-forwarded-host')
  const host = xfHost ?? h.get('host')

  // Preferir headers de proxy (Vercel/Codespaces)
  if (host) {
    const proto = xfProto ?? (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  // Fallback: tentar derivar do req.url
  try {
    const u = new URL(req.url)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'http://localhost:3001'
  }
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
    const baseUrl = getBaseUrlFromRequest(req)
    const url = new URL('/api/eu360/profile', baseUrl)

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
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
