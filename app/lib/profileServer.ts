// app/lib/profileServer.ts
import { cookies } from 'next/headers'

export type ProfileCookie = {
  babyAgeMonths?: number | null
  // adicione outros campos se precisar depois
}

/**
 * Lê o cookie 'profile' no servidor e retorna um objeto com os campos usados nas telas.
 * Se não existir ou estiver inválido, devolve valores seguros.
 */
export function getProfile(): ProfileCookie {
  try {
    const jar = cookies()
    const raw = jar.get('profile')?.value
    if (!raw) {
      return { babyAgeMonths: null }
    }
    const parsed = JSON.parse(raw) as ProfileCookie
    return {
      babyAgeMonths:
        typeof parsed.babyAgeMonths === 'number' ? parsed.babyAgeMonths : null,
    }
  } catch {
    return { babyAgeMonths: null }
  }
}

