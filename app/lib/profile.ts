'use server'

import { cookies } from 'next/headers'

const PROFILE_COOKIE = 'materna360-profile'

type ProfileChildCookie = {
  idadeMeses?: unknown
}

type ProfileCookie = {
  nomeMae?: unknown
  filhos?: unknown
}

function readProfileCookie(): ProfileCookie | null {
  const cookieStore = cookies()
  const rawValue = cookieStore.get(PROFILE_COOKIE)?.value

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as ProfileCookie
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function extractFirstChildAge(profile: ProfileCookie): number | null {
  const childrenRaw = (profile as { filhos?: unknown }).filhos
  if (!Array.isArray(childrenRaw)) {
    return null
  }

  for (const child of childrenRaw) {
    if (!child || typeof child !== 'object') {
      continue
    }

    const months = Number((child as ProfileChildCookie).idadeMeses)
    if (Number.isFinite(months) && months >= 0) {
      return months
    }
  }

  return null
}

export async function getServerProfile(): Promise<{ name: string }> {
  const profile = readProfileCookie()
  const name = typeof profile?.nomeMae === 'string' ? profile.nomeMae : ''
  return { name }
}

export async function getBabyProfile(): Promise<{ babyAgeMonths: number | null } | null> {
  const profile = readProfileCookie()
  if (!profile) {
    return null
  }

  const babyAgeMonths = extractFirstChildAge(profile)
  return { babyAgeMonths }
}
