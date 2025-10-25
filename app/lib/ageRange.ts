import { monthsFromBirthdate } from './age'

export type AgeRange = '0-1' | '2-3' | '4-5' | '6-7' | '8+'

export type Child = {
  id: string
  name?: string
  gender?: 'm' | 'f'
  ageRange?: AgeRange | null
  birthdateISO?: string | null
}

export type Profile = {
  motherName?: string
  children?: Child[]
}

const AGE_RANGE_VALUES: readonly AgeRange[] = ['0-1', '2-3', '4-5', '6-7', '8+']
const AGE_RANGE_SET = new Set<string>(AGE_RANGE_VALUES)

const mapMonthsToAgeRange = (months: number): AgeRange | null => {
  if (!Number.isFinite(months) || months < 0) {
    return null
  }

  const wholeYears = Math.floor(months / 12)

  if (wholeYears <= 1) {
    return '0-1'
  }

  if (wholeYears >= 2 && wholeYears <= 3) {
    return '2-3'
  }

  if (wholeYears >= 4 && wholeYears <= 5) {
    return '4-5'
  }

  if (wholeYears >= 6 && wholeYears <= 7) {
    return '6-7'
  }

  if (wholeYears >= 8) {
    return '8+'
  }

  return null
}

const normalizeBirthdate = (raw?: string | null): string | null => {
  if (typeof raw !== 'string') {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return trimmed
}

export const isValidAgeRange = (value: unknown): value is AgeRange =>
  typeof value === 'string' && AGE_RANGE_SET.has(value)

export function resolveAgeRange(child: Child | null | undefined): AgeRange | null {
  if (!child) {
    return null
  }

  const preferred = child.ageRange
  if (isValidAgeRange(preferred)) {
    return preferred
  }

  const birthdate = normalizeBirthdate(child.birthdateISO)
  if (!birthdate) {
    return null
  }

  const months = monthsFromBirthdate(birthdate)
  if (months === null) {
    return null
  }

  return mapMonthsToAgeRange(months)
}
