'use client'

import { useState, useEffect } from 'react'
import { save, load, getCurrentDateKey } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry-track'
import { useToast } from '@/components/ui/Toast'
import AppIcon from '@/components/ui/AppIcon'

interface LogEntry {
  type: 'alimentacao' | 'sono' | 'humor'
  value: string
  ts: number
}

const ALIMENTACAO_OPTIONS = [
  { label: 'Completou', icon: 'check' },
  { label: 'Parcial', icon: 'meh' },
  { label: 'Recusou', icon: 'x' },
]

const SONO_OPTIONS = [
  { label: 'Soneca curta', icon: 'moon' },
  { label: 'Soneca longa', icon: 'bed' },
  { label: 'Noite', icon: 'star' },
]

const HUMOR_OPTIONS = [
  { label: 'Calmo', icon: 'smile' },
  { label: 'Ativo', icon: 'sparkles' },
  { label: 'Irritado', icon: 'frown' },
]

interface ChipGroupProps {
  title: string
  options: Array<{ label: string; icon: string }>
  onSelect: (value: string) => void
}

function ChipGroup({ title, options, onSelect }: ChipGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-support-1">
        {title}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.label)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-white border border-white/60 hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm font-medium text-support-1"
            title={option.label}
          >
            <AppIcon name={option.icon as any} size={14} decorative />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden text-xs">{option.label.substring(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function QuickChildLogs() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load entries on mount
  useEffect(() => {
    const dateKey = getCurrentDateKey()
    const persistKey = `care:child:${dateKey}`
    const loaded = load<LogEntry[]>(persistKey, [])
    setEntries(loaded || [])
    setIsLoading(false)
  }, [])

  const handleLogEntry = (type: 'alimentacao' | 'sono' | 'humor', value: string) => {
    const newEntry: LogEntry = {
      type,
      value,
      ts: Date.now(),
    }

    const dateKey = getCurrentDateKey()
    const persistKey = `care:child:${dateKey}`
    const updated = [...entries, newEntry]

    // Persist immediately
    save(persistKey, updated)
    setEntries(updated)

    // Fire telemetry
    track({
      event: 'care.log_add',
      tab: 'cuidar',
      component: 'QuickChildLogs',
      action: 'log',
      payload: { type, value },
    })

    // Show toast
    toast({
      description: 'Registro salvo!',
    })
  }

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getIcon = (type: string, value: string) => {
    if (type === 'alimentacao') {
      const opt = ALIMENTACAO_OPTIONS.find((o) => o.label === value)
      return opt?.icon || 'check'
    }
    if (type === 'sono') {
      const opt = SONO_OPTIONS.find((o) => o.label === value)
      return opt?.icon || 'moon'
    }
    if (type === 'humor') {
      const opt = HUMOR_OPTIONS.find((o) => o.label === value)
      return opt?.icon || 'smile'
    }
    return 'info'
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'alimentacao':
        return 'Alimentação'
      case 'sono':
        return 'Sono'
      case 'humor':
        return 'Humor'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Logs Section */}
      <div className="space-y-4">
        <ChipGroup
          title="Alimentação"
          options={ALIMENTACAO_OPTIONS}
          onSelect={(value) => handleLogEntry('alimentacao', value)}
        />

        <ChipGroup
          title="Sono"
          options={SONO_OPTIONS}
          onSelect={(value) => handleLogEntry('sono', value)}
        />

        <ChipGroup
          title="Humor"
          options={HUMOR_OPTIONS}
          onSelect={(value) => handleLogEntry('humor', value)}
        />
      </div>

      {/* Timeline Section */}
      {!isLoading && entries.length > 0 && (
        <div className="border-t border-white/40 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-support-1">Registros de hoje</h4>
          <div className="space-y-2">
            {[...entries].reverse().map((entry, idx) => (
              <div
                key={`${entry.ts}-${idx}`}
                className="flex items-start gap-3 rounded-lg bg-white/40 p-3"
              >
                <div className="mt-1">
                  <AppIcon
                    name={getIcon(entry.type, entry.value) as any}
                    size={18}
                    variant="brand"
                    decorative
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-support-1">
                    {getTypeLabel(entry.type)}
                  </div>
                  <div className="text-sm text-support-2">{entry.value}</div>
                </div>
                <div className="text-xs text-support-3 whitespace-nowrap">
                  {formatTime(entry.ts)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="rounded-lg bg-white/40 p-4 text-center">
          <p className="text-sm text-support-2">
            Tap nos registros acima para começar a acompanhar o dia
          </p>
        </div>
      )}
    </div>
  )
}
