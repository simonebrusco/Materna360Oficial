import {
  type MaternaProfile,
  type MaternaChildProfile,
} from '@/app/lib/ai/maternaCore'
import { adaptEu360ProfileToMaterna } from '@/app/lib/ai/eu360ProfileAdapter'

export type MaternaContext = {
  profile: MaternaProfile | null
  child: MaternaChildProfile | null
}

function buildInternalOrigin(req: Request): string {
  const host = req.headers.get('host') ?? 'localhost:3001'

  const isLocal =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('0.0.0.0')

  // Em dev local, o Next está em HTTP (ex.: http://localhost:3001).
  // Em ambientes com proxy, req.url pode vir como https://..., mas o listener local continua HTTP.
  if (isLocal) return `http://${host}`

  // Em prod/proxy, respeita o proto encaminhado.
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
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
    const origin = buildInternalOrigin(req)
    const url = new URL('/api/eu360/profile', origin)

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
