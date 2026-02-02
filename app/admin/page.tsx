import Link from 'next/link'

function Card(props: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={props.href}
      className="block rounded-lg border bg-white p-4 hover:bg-neutral-50"
    >
      <div className="text-sm font-semibold text-neutral-900">{props.title}</div>
      <div className="mt-1 text-sm text-neutral-600">{props.desc}</div>
      <div className="mt-3 text-xs font-medium text-neutral-900">Abrir →</div>
    </Link>
  )
}

export default function AdminHomePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Materna360 — Admin</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Área interna para governança de conteúdo. O app consome; o conteúdo nasce aqui.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card
          title="Ideias"
          desc="CRUD de ideias curadas por hub (anti-repetição estrutural por ID)."
          href="/admin/ideas"
        />
        <Card
          title="Insights"
          desc="Painel interno de visões e métricas (já implementado no projeto)."
          href="/admin/insights"
        />
      </div>

      <div className="text-xs text-neutral-500">
        Nota: o ADM MVP prioriza previsibilidade e governança. UI mínima é intencional.
      </div>
    </div>
  )
}
