'use client'

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { getTodayDateKey } from '@/lib/dailyActivity'

const STORAGE_KEY = 'daily_checklist_v1'
const FALLBACK_NAME = 'Mãe'
const MIN_EMPTY_ROWS = 2
const ACTION_BUTTON_BASE =
  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60'

const REFERENCE_TEXTS = [
  'Beber água (garrafinha por perto)',
  '5 min de respiração/pausa pra mim',
  'Brincadeira curta com meu filho (10–15 min)',
]

type ChecklistOrigin = 'yesterday' | 'today'

type ChecklistItem = {
  id: string
  text: string
  checked: boolean
  isReference: boolean
  origin?: ChecklistOrigin
}

type ChecklistMap = Record<string, ChecklistItem[]>

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const createEmptyItem = (): ChecklistItem => ({
  id: createId(),
  text: '',
  checked: false,
  isReference: false,
})

const sanitizeItem = (value: unknown): ChecklistItem | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Partial<ChecklistItem> & { origin?: string }
  const text = typeof item.text === 'string' ? item.text : ''
  const checked = Boolean(item.checked)
  const isReference = Boolean(item.isReference)
  const id = typeof item.id === 'string' && item.id.trim() ? item.id : createId()
  const origin = item.origin === 'yesterday' || item.origin === 'today' ? item.origin : undefined

  return {
    id,
    text,
    checked,
    isReference,
    origin,
  }
}

const readChecklistMap = (): ChecklistMap => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as ChecklistMap
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('Falha ao carregar checklist do armazenamento:', error)
  }

  return {}
}

const persistChecklistMap = (data: ChecklistMap) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Falha ao salvar checklist no armazenamento:', error)
  }
}

const ensureEmptyRowLimit = (items: ChecklistItem[]): ChecklistItem[] => {
  const nonEmpty: ChecklistItem[] = []
  const empty: ChecklistItem[] = []

  for (const item of items) {
    if (item.text.trim().length > 0) {
      nonEmpty.push(item)
    } else {
      empty.push({ ...item, text: '', checked: false, origin: undefined })
    }
  }

  const trimmedEmpty = empty.slice(-MIN_EMPTY_ROWS)
  const combined = [...nonEmpty, ...trimmedEmpty]

  if (combined.length === 0) {
    return Array.from({ length: MIN_EMPTY_ROWS }, () => createEmptyItem())
  }

  return combined
}

const seedChecklist = (): ChecklistItem[] => {
  const referenceItems = REFERENCE_TEXTS.map((text) => ({
    id: createId(),
    text,
    checked: false,
    isReference: true,
  }))

  return ensureEmptyRowLimit([...referenceItems, createEmptyItem(), createEmptyItem()])
}

const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getYesterdayDateKey = (): string => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getLocalDateKey(yesterday)
}

const getTomorrowDateKey = (): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getLocalDateKey(tomorrow)
}

const cloneItemWithOrigin = (text: string, origin: ChecklistOrigin): ChecklistItem => ({
  id: createId(),
  text,
  checked: false,
  isReference: false,
  origin,
})

const fetchMotherName = async (): Promise<string> => {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Perfil não disponível (${response.status})`)
    }

    const data = await response.json()
    const rawName = typeof data?.nomeMae === 'string' ? data.nomeMae.trim() : ''
    return rawName || FALLBACK_NAME
  } catch (error) {
    console.error('Não foi possível carregar o nome para o checklist:', error)
    return FALLBACK_NAME
  }
}

export function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [profileName, setProfileName] = useState(FALLBACK_NAME)
  const [dateKey, setDateKey] = useState(() => getLocalDateKey())

  const title = useMemo(() => `Checklist da ${profileName}`, [profileName])

  useEffect(() => {
    const todayKey = getLocalDateKey()
    setDateKey(todayKey)

    const map = readChecklistMap()
    const storedList = Array.isArray(map[todayKey]) ? map[todayKey] : null

    if (storedList && storedList.length > 0) {
      const sanitized = storedList
        .map(sanitizeItem)
        .filter((item): item is ChecklistItem => Boolean(item))

      setItems(ensureEmptyRowLimit(sanitized))
    } else {
      const seeded = seedChecklist()
      setItems(seeded)
      persistChecklistMap({ ...map, [todayKey]: seeded })
    }
  }, [])

  useEffect(() => {
    void fetchMotherName().then((name) => {
      setProfileName(name)
    })
  }, [])

  const setItemsForDate = useCallback(
    (next: ChecklistItem[] | ((previous: ChecklistItem[]) => ChecklistItem[])) => {
      setItems((previous) => {
        const rawNext = typeof next === 'function' ? next(previous) : next
        const ensured = ensureEmptyRowLimit(rawNext)
        const map = readChecklistMap()
        map[dateKey] = ensured
        persistChecklistMap(map)
        return ensured
      })
    },
    [dateKey]
  )

  const handleToggle = useCallback(
    (id: string) => {
      setItemsForDate((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                checked: !item.checked,
              }
            : item
        )
      )
    },
    [setItemsForDate]
  )

  const handleTextChange = useCallback(
    (id: string, text: string) => {
      setItemsForDate((previous) =>
        previous.map((item) => {
          if (item.id !== id) {
            return item
          }

          const trimmedNext = text.trim()
          const trimmedPrevious = item.text.trim()
          const shouldClearOrigin = item.origin && (trimmedNext.length === 0 || trimmedNext !== trimmedPrevious)

          return {
            ...item,
            text,
            origin: shouldClearOrigin ? undefined : item.origin,
          }
        })
      )
    },
    [setItemsForDate]
  )

  const handleTextBlur = useCallback(() => {
    setItemsForDate((previous) => previous)
  }, [setItemsForDate])

  const handleAddLine = useCallback(() => {
    const emptyCount = items.filter((item) => !item.text.trim()).length

    if (emptyCount >= MIN_EMPTY_ROWS) {
      return
    }

    const newItem = createEmptyItem()

    setItemsForDate((previous) => [...previous, newItem])

    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLInputElement>(`[data-check-id="${newItem.id}"]`)
      element?.focus()
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [items, setItemsForDate])

  const handleRemove = useCallback(
    (id: string) => {
      setItemsForDate((previous) => previous.filter((item) => item.id !== id))
    },
    [setItemsForDate]
  )

  const handleClearChecks = useCallback(() => {
    setItemsForDate((previous) => previous.map((item) => ({ ...item, checked: false })))
  }, [setItemsForDate])

  const handleDuplicateFromYesterday = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const yesterdayKey = getYesterdayDateKey()
    const map = readChecklistMap()
    const from = Array.isArray(map[yesterdayKey]) ? map[yesterdayKey] : []

    if (from.length === 0) {
      return
    }

    const normalized = from
      .filter((item) => item.text?.trim())
      .map((item) => cloneItemWithOrigin(item.text, 'yesterday'))

    const hasExisting = items.some((item) => item.text.trim().length > 0)

    if (hasExisting) {
      const confirmReplace = window.confirm(
        'Você já tem itens hoje. Deseja substituir pelos de ontem?\n(OK = substituir, Cancelar = mesclar)'
      )

      if (confirmReplace) {
        setItemsForDate(normalized)
        return
      }
    }

    const existingTexts = new Set(
      items
        .map((item) => item.text.trim().toLowerCase())
        .filter((value) => value.length > 0)
    )

    const toAppend = normalized.filter((item) => !existingTexts.has(item.text.trim().toLowerCase()))

    if (toAppend.length === 0) {
      return
    }

    setItemsForDate((previous) => [...previous, ...toAppend])
  }, [items, setItemsForDate])

  const handleDuplicateToTomorrow = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const todayKey = getLocalDateKey()
    const tomorrowKey = getTomorrowDateKey()

    const map = readChecklistMap()
    const current = Array.isArray(map[todayKey]) ? map[todayKey] : []
    const meaningfulCurrent = current.filter((item) => item.text?.trim())

    if (meaningfulCurrent.length === 0) {
      return
    }

    const existingTomorrow = Array.isArray(map[tomorrowKey]) ? map[tomorrowKey] : []

    if (existingTomorrow.length > 0) {
      const confirmReplace = window.confirm(
        'Amanhã já tem itens. Deseja substituir pelos de hoje?\n(OK = substituir, Cancelar = mesclar)'
      )

      if (confirmReplace) {
        const next = meaningfulCurrent.map((item) => cloneItemWithOrigin(item.text, 'today'))
        map[tomorrowKey] = next
        persistChecklistMap(map)
        return
      }
    }

    const tomorrowTexts = new Set(
      existingTomorrow
        .map((item) => item.text?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    )

    const toAppend = meaningfulCurrent
      .filter((item) => !tomorrowTexts.has(item.text.trim().toLowerCase()))
      .map((item) => cloneItemWithOrigin(item.text, 'today'))

    if (toAppend.length === 0) {
      return
    }

    map[tomorrowKey] = [...existingTomorrow, ...toAppend]
    persistChecklistMap(map)
  }, [])

  return (
    <Card className="p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">{title}</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleAddLine}
            aria-label="+ Adicionar linha"
            className={`${ACTION_BUTTON_BASE} border border-primary/20 bg-white text-primary hover:bg-primary/10`}
          >
            + Adicionar linha
          </button>
          <button
            type="button"
            onClick={handleDuplicateFromYesterday}
            aria-label="Duplicar de ontem"
            className={`${ACTION_BUTTON_BASE} border border-white/50 bg-white text-support-1 hover:bg-white/70`}
          >
            Duplicar de ontem
          </button>
          <button
            type="button"
            onClick={handleDuplicateToTomorrow}
            aria-label="Duplicar para amanhã"
            className={`${ACTION_BUTTON_BASE} border border-white/50 bg-white text-support-1 hover:bg-white/70`}
          >
            Duplicar para amanhã
          </button>
          <button
            type="button"
            onClick={handleClearChecks}
            aria-label="Limpar checks"
            className={`${ACTION_BUTTON_BASE} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`}
          >
            Limpar checks
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const originLabel = item.origin === 'yesterday' ? 'de ontem' : item.origin === 'today' ? 'de hoje' : null

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-soft transition-all duration-300 focus-within:border-primary/60 focus-within:shadow-elevated"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
                className="h-5 w-5 rounded-full border-2 border-primary/40 bg-white accent-primary"
                aria-label={item.text ? `Concluir tarefa: ${item.text}` : 'Concluir tarefa'}
              />
              <div className="flex flex-1 items-center gap-2">
                <input
                  data-check-id={item.id}
                  type="text"
                  value={item.text}
                  onChange={(event) => handleTextChange(item.id, event.target.value)}
                  onBlur={handleTextBlur}
                  placeholder="Digite uma tarefa…"
                  className="flex-1 border-none bg-transparent text-sm text-support-1 placeholder:text-support-2/70 focus:outline-none"
                />
                {originLabel && (
                  <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-support-2">
                    {originLabel}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-support-2 transition hover:bg-secondary/80"
                title="Remover"
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

    </Card>
  )
}
