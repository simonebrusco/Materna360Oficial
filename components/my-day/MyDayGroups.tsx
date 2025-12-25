// components/my-day/MyDayGroups.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import {
  groupTasks,
  listMyDayTasks,
  toggleDone,
  snoozeTask,
  unsnoozeTask,
  removeTask,
  type GroupedTasks,
  type MyDayTaskItem,
} from '@/app/lib/myDayTasks.client'
import { consumeRecentMyDaySave } from '@/app/lib/myDayContinuity.client'

type FocusGroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  const s = (t as any).status
  if (s === 'active' || s === 'snoozed' || s === 'done') return s
  if ((t as any).done === true) return 'done'
  return 'active'
}

function groupIdForOrigin(origin: string): FocusGroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

function labelForGroupId(id: FocusGroupId) {
  if (id === 'para-hoje') return 'Para hoje (simples e real)'
  if (id === 'familia') return 'Família & conexão'
  if (id === 'autocuidado') return 'Autocuidado'
  if (id === 'rotina-casa') return 'Rotina & casa'
  return 'Outros'
}

function countOpen(items: MyDayTaskItem[]) {
  let n = 0
  for (const t of items) {
    const s = statusOf(t)
    if (s === 'active' || s === 'snoozed') n += 1
  }
  return n
}

function countActive(items: MyDayTaskItem[]) {
  let n = 0
  for (const t of items) {
    if (statusOf(t) === 'active') n += 1
  }
  return n
}

function clamp(n: number, min: number, max: number) {
  if (n < min) return min
  if (n > max) return max
  return n
}

function SoftButton({
  children,
  onClick,
  variant = 'primary',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
}) {
  const base =
    'inline-flex items-center justify-center rounded-full px-3 py-2 text-[12px] transition border shadow-sm'
  const cls =
    variant === 'primary'
      ? 'bg-white text-[#2f3a56] border-[#f5d7e5] hover:bg-[#ffe1f1]'
      : variant === 'danger'
        ? 'bg-white text-[#b8236b] border-[#f5d7e5] hover:bg-[#ffe1f1]'
        : 'bg-transparent text-[#2f3a56] border-transparent hover:bg-[#ffe1f1]'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[base, cls, disabled ? 'opacity-60 cursor-not-allowed' : ''].join(' ')}
    >
      {children}
    </button>
  )
}

function EmptyState({ groupId }: { groupId: FocusGroupId }) {
  const title =
    groupId === 'para-hoje'
      ? 'Nada aqui por enquanto.'
      : groupId === 'familia'
        ? 'Sem tarefas de conexão por agora.'
        : groupId === 'autocuidado'
          ? 'Sem autocuidado salvo por agora.'
          : groupId === 'rotina-casa'
            ? 'Sem rotinas salvas por agora.'
            : 'Sem lembretes por agora.'

  const hint =
    groupId === 'para-hoje'
      ? 'Quando você salva algo no app, ele aparece aqui.'
      : 'Se você salvar uma ação, ela aparece aqui — sem esforço.'

  return (
    <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
      <div className="text-[13px] font-semibold text-[#2f3a56]">{title}</div>
      <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{hint}</div>
    </div>
  )
}

function TaskRow({
  t,
  onToggle,
  onSnooze,
  onUnsnooze,
  onRemove,
}: {
  t: MyDayTaskItem
  onToggle: () => void
  onSnooze: () => void
  onUnsnooze: () => void
  onRemove: () => void
}) {
  const st = statusOf(t)
  const isDone = st === 'done'
  const isSnoozed = st === 'snoozed'

  return (
    <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-start gap-3 text-left w-full"
        >
          <div
            className={[
              'mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center shrink-0',
              isDone ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5]',
            ].join(' ')}
          >
            {isDone ? <AppIcon name="check" size={16} className="text-[#b8236b]" /> : null}
          </div>

          <div className="min-w-0">
            <div
              className={[
                'text-[13px] font-semibold leading-snug',
                isDone ? 'text-[#6a6a6a] line-through' : 'text-[#2f3a56]',
              ].join(' ')}
            >
              {t.title}
            </div>

            {isSnoozed && t.snoozeUntil ? (
              <div className="mt-1 text-[11px] text-[#6a6a6a]">
                Adiado até {t.snoozeUntil}
              </div>
            ) : null}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {isSnoozed ? (
            <SoftButton variant="ghost" onClick={onUnsnooze}>
              Voltar
            </SoftButton>
          ) : (
            <SoftButton variant="ghost" onClick={onSnooze} disabled={isDone}>
              Adiar
            </SoftButton>
          )}

          <SoftButton variant="danger" onClick={onRemove}>
            Remover
          </SoftButton>
        </div>
      </div>
    </div>
  )
}

export default function MyDayGroups({
  initialDate,
}: {
  initialDate?: Date
}) {
  const [date] = useState<Date>(() => initialDate ?? new Date())
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [focusGroupId, setFocusGroupId] = useState<FocusGroupId>('para-hoje')

  function refresh() {
    const list = listMyDayTasks(date)
    setTasks(list)
  }

  // initial load
  useEffect(() => {
    refresh()
  }, [])

  // P26 continuity: focus the intended group once, silently
  useEffect(() => {
    const payload = consumeRecentMyDaySave({ windowMs: 30 * 60 * 1000 })
    if (!payload) return

    const gid = groupIdForOrigin(payload.origin)
    setFocusGroupId(gid)

    try {
      track('my_day.continuity.consume', {
        ok: true,
        origin: payload.origin,
        source: payload.source,
        focusGroupId: gid,
      })
    } catch {}
  }, [])

  const grouped: GroupedTasks = useMemo(() => groupTasks(tasks), [tasks])

  const groupOrder: FocusGroupId[] = useMemo(
    () => ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros'],
    []
  )

  const tabs = useMemo(() => {
    return groupOrder.map((id) => {
      const items = grouped[id]?.items ?? []
      const open = countOpen(items)
      const active = countActive(items)
      return { id, title: labelForGroupId(id), open, active }
    })
  }, [groupOrder, grouped])

  const focusedItems = grouped[focusGroupId]?.items ?? []

  function onToggle(t: MyDayTaskItem) {
    const res = toggleDone(t.id, date)
    if (!res.ok) {
      toast.info('Não deu agora. Tente de novo.')
      return
    }
    refresh()
  }

  function onSnooze(t: MyDayTaskItem) {
    const res = snoozeTask(t.id, 1, date)
    if (!res.ok) {
      toast.info('Não deu agora. Tente de novo.')
      return
    }
    refresh()
  }

  function onUnsnooze(t: MyDayTaskItem) {
    const res = unsnoozeTask(t.id, date)
    if (!res.ok) {
      toast.info('Não deu agora. Tente de novo.')
      return
    }
    refresh()
  }

  function onRemove(t: MyDayTaskItem) {
    const res = removeTask(t.id, date)
    if (!res.ok) {
      toast.info('Não deu agora. Tente de novo.')
      return
    }
    refresh()
  }

  return (
    <section className="space-y-4">
      {/* Header / Nav */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[14px] font-semibold text-[#2f3a56]">Meu Dia</div>
          <div className="text-[12px] text-[#6a6a6a]">Sem cobrança. Só o próximo passo.</div>
        </div>

        <Link
          href="/maternar"
          className="inline-flex items-center rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
        >
          <span className="mr-1.5 text-lg leading-none">←</span>
          Maternar
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = focusGroupId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFocusGroupId(t.id)}
              className={[
                'rounded-full px-3 py-2 text-[12px] border transition',
                active
                  ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                  : 'bg-white border-[#f5d7e5] text-[#2f3a56] hover:bg-[#ffe1f1]',
              ].join(' ')}
              aria-pressed={active}
            >
              <span className="font-semibold">{t.id === 'para-hoje' ? 'Para hoje' : t.id}</span>
              <span className="ml-2 text-[11px] text-[#6a6a6a]">
                {t.active > 0 ? `${t.active} ativas` : t.open > 0 ? `${t.open} abertas` : 'vazio'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {focusedItems.length === 0 ? <EmptyState groupId={focusGroupId} /> : null}

        {focusedItems.map((t) => (
          <TaskRow
            key={t.id}
            t={t}
            onToggle={() => onToggle(t)}
            onSnooze={() => onSnooze(t)}
            onUnsnooze={() => onUnsnooze(t)}
            onRemove={() => onRemove(t)}
          />
        ))}
      </div>
    </section>
  )
}
