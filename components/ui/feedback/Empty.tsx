export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
    </div>
  )
}
