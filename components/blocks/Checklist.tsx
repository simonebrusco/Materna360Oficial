'use client';

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const STORAGE_KEY = 'daily_checklist_v1'
const FALLBACK_NAME = 'Mãe'
const MIN_EMPTY_ROWS = 2

const REFERENCE_TEXTS = [
  'Beber água (garrafinha por perto)',
  '5 min de respiração/pausa pra mim',
  'Brincadeira curta com meu filho (10–15 min)',
]

type ChecklistItem = {
  id: string
  text: string
  checked: boolean
  isReference: boolean
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

  const item = value as Partial<ChecklistItem>
  const text = typeof item.text === 'string' ? item.text : ''
  const checked = Boolean(item.checked)
  const isReference = Boolean(item.isReference)
  const id = typeof item.id === 'string' && item.id.trim() ? item.id : createId()

  return {
    id,
    text,
    checked,
    isReference,
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
      empty.push({ ...item, text: '' })
    }
  }

  const trimmedEmpty = empty.slice(-MIN_EMPTY_ROWS)
  const combined = [...nonEmpty, ...trimmedEmpty]

  if (combined.length === 0) {
    return [createEmptyItem()]
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
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                text,
              }
            : item
        )
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

    const todayKey = getLocalDateKey()
    const yesterdayKey = getYesterdayDateKey()

    const map = readChecklistMap()
    const from = Array.isArray(map[yesterdayKey]) ? map[yesterdayKey] : []

    if (from.length === 0) {
      return
    }

    const current = Array.isArray(map[todayKey]) ? map[todayKey] : []

    if (current.length > 0) {
      const confirmReplace = window.confirm(
        'Você já tem itens hoje. Deseja substituir pelos de ontem?\n(OK = substituir, Cancelar = mesclar)'
      )

      if (confirmReplace) {
        const next = from.map((item) => ({
          id: createId(),
          text: item.text,
          checked: false,
          isReference: false,
        }))

        setItemsForDate(next)
        return
      }
    }

    const existingTexts = new Set(
      current
        .map((item) => item.text?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    )

    const toAppend = from
      .filter((item) => item.text?.trim())
      .filter((item) => !existingTexts.has(item.text.trim().toLowerCase()))
      .map((item) => ({
        id: createId(),
        text: item.text,
        checked: false,
        isReference: false,
      }))

    const merged = [...current, ...toAppend]

    setItemsForDate(merged)
  }, [setItemsForDate])

  return (
    <Card className="p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDuplicateFromYesterday}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/80"
          >
            Duplicar de ontem
          </button>
          <button
            type="button"
            onClick={handleClearChecks}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/80"
          >
            Limpar checks
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
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
            <input
              data-check-id={item.id}
              type="text"
              value={item.text}
              onChange={(event) => handleTextChange(item.id, event.target.value)}
              onBlur={handleTextBlur}
              placeholder="Digite uma tarefa…"
              className="flex-1 border-none bg-transparent text-sm text-support-1 placeholder:text-support-2/70 focus:outline-none"
            />
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
        ))}
      </div>

      <div className="mt-5">
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleAddLine}>
          + Adicionar linha
        </Button>
      </div>
    </Card>
  )
}
