export function toggleDone(taskId: string, date: Date = new Date()) {
  const dk = toDateKey(date)
  const items = readTasksByDateKey(dk)

  const next: MyDayTaskItem[] = items.map((t): MyDayTaskItem => {
    if (t.id !== taskId) return t
    const nextStatus: TaskStatus = t.status === 'done' ? 'active' : 'done'
    return { ...t, status: nextStatus }
  })

  writeTasksByDateKey(dk, next)

  const changed = next.find((t) => t.id === taskId)
  return { ok: true, status: changed?.status ?? 'active', dateKey: dk }
}

export function snoozeTask(taskId: string, days = 1, date: Date = new Date()) {
  const dk = toDateKey(date)
  const items = readTasksByDateKey(dk)

  const until = new Date(date)
  until.setDate(until.getDate() + Math.max(1, days))
  const snoozeUntil = toDateKey(until)

  const next: MyDayTaskItem[] = items.map((t): MyDayTaskItem => {
    if (t.id !== taskId) return t
    return {
      ...t,
      status: 'snoozed' as const, // <- garante literal TaskStatus
      snoozeUntil,
    }
  })

  writeTasksByDateKey(dk, next)

  return { ok: true, snoozeUntil, dateKey: dk }
}

export function removeTask(taskId: string, date: Date = new Date()) {
  const dk = toDateKey(date)
  const items = readTasksByDateKey(dk)

  const next: MyDayTaskItem[] = items.filter((t) => t.id !== taskId)

  writeTasksByDateKey(dk, next)

  return { ok: true, dateKey: dk }
}
