'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getTodayDateKey } from '@/lib/dailyActivity'

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

  return Math.random().toString(36).slice(2, 11)
}

const createEmptyItem = (): ChecklistItem => ({
  id: createId(),
  text: '',
  checked: false,
  isReference: false,
})

const sanitizeItem = (value: any): ChecklistItem | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const text = typeof value.text === 'string' ? value.text : ''
  const checked = Boolean(value.checked)
  const isReference = Boolean(value.isReference)
  const id = typeof value.id === 'string' && value.id.trim() ? value.id : createId()

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
  const trimmed = items.map((item) => ({ ...item, text: item.text }))
  let emptyCount = 0
  const result: ChecklistItem[] = []

  for (const item of trimmed) {
    const isEmpty = item.text.trim().length === 0
    if (isEmpty) {
      emptyCount += 1
      if (emptyCount > MIN_EMPTY_ROWS) {
        continue
      }
    }
    result.push(item)
  }

  if (result.length === 0) {
    return [createEmptyItem(), createEmptyItem()]
  }

  while (result.filter((item) => item.text.trim().length === 0).length < MIN_EMPTY_ROWS) {
    result.push(createEmptyItem())
  }

  return result
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
  const [dateKey, setDateKey] = useState(() => getTodayDateKey())
  const [isInitialized, setIsInitialized] = useState(false)

  const title = useMemo(() => `Checklist da ${profileName}`, [profileName])

  useEffect(() => {
    const todayKey = getTodayDateKey()
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

    setIsInitialized(true)
  }, [])

  useEffect(() => {
    void fetchMotherName().then((name) => {
      setProfileName(name)
    })
  }, [])

  useEffect(() => {
    if (!isInitialized) {
      return
    }

    const map = readChecklistMap()
    map[dateKey] = items
    persistChecklistMap(map)
  }, [items, dateKey, isInitialized])

  const updateItems = useCallback((updater: (previous: ChecklistItem[]) => ChecklistItem[]) => {
    setItems((previous) => ensureEmptyRowLimit(updater(previous)))
  }, [])

  const handleToggle = useCallback((id: string) => {
    updateItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item
      )
    )
  }, [updateItems])

  const handleTextChange = useCallback((id: string, text: string) => {
    updateItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              text,
            }
          : item
      )
    )
  }, [updateItems])

  const handleTextBlur = useCallback(() => {
    updateItems((previous) => ensureEmptyRowLimit(previous))
  }, [updateItems])

  const handleAddRow = useCallback(() => {
    updateItems((previous) => [...previous, createEmptyItem()])
  }, [updateItems])

  const handleRemove = useCallback((id: string) => {
    updateItems((previous) => previous.filter((item) => item.id !== id))
  }, [updateItems])

  const handleClearChecks = useCallback(() => {
    updateItems((previous) => previous.map((item) => ({ ...item, checked: false })))
  }, [updateItems])

  return (
    <Card className="p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">{title}</h2>
        <button
          type="button"
          onClick={handleClearChecks}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/80"
        >
          Limpar checks
        </button>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddRow}
        >
          + Adicionar linha
        </Button>
      </div>
    </Card>
  )
}
