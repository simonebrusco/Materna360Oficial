import Link from 'next/link'

function Card(props: { title: string; desc: string; href: string; hint?: string }) {
  return (
    <Link
      href={props.href}
      className="block rounded-xl border bg-white p-5 shadow-sm transition hover:bg-neutral-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">{props.title}</div>
        <div className="text-xs font-medium text-neutral-400">Abrir →</div>
      </div>

      <div className="mt-2 text-sm text-neutral-600">{props.desc}</div>

      {props.hint && (
        <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-700">Quando usar:</span> {props.hint}
        </div>
      )}
    </Link>
  )
}

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-neutral-900">Materna360 — Admin</h1>
        <p className="text-sm text-neutral-600">
          Área interna de governança. Aqui você cria e mantém o que o app consome.
        </p>

        <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700">
          <div className="font-semibold text-neutral-900">Como pensar:</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
            <li>
              <span className="font-semibold">Ideias</span> = conteúdos que viram cards/experiências nos hubs (Meu Dia,
              Maternar, Cuidar, etc).
            </li>
            <li>
              <span className="font-semibold">Textos Fixos</span> = textos de tela (microcopy, FAQ, mensagens fixas) que
              não são ideias.
            </li>
            <li>
              <span className="font-semibold">Insights</span> = leitura interna (métricas/visões). Não cria conteúdo.
            </li>
            <li>
              <span className="font-semibold">Debug</span> = checagens técnicas (admin, ambiente, guard).
            </li>
          </ul>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          title="Ideias do App (Hubs & Blocos)"
          desc="Conteúdos curados que alimentam os hubs do app. Anti-repetição por ID e governança ADM-first."
          hint="Quando você quer criar/editar uma ideia que aparece como sugestão, card, rotina ou bloco dentro do app."
          href="/admin/ideas"
        />

        <Card
          title="Textos Fixos do App"
          desc="Títulos, descrições, microcopy, FAQ e mensagens fixas usadas direto nas telas (não são ideias)."
          hint="Quando você precisa ajustar texto de tela (explicação, ajuda, rótulos, mensagens) sem mexer em ideias."
          href="/admin/texts"
        />

        <Card
          title="Insights & Métricas"
          desc="Painel interno para acompanhar uso e comportamento (já implementado no projeto)."
          hint="Quando você quer entender o que está sendo usado e o que precisa de atenção."
          href="/admin/insights"
        />

        <Card
          title="Debug & Ambiente"
          desc="Checagens rápidas: sessão, admin ativo, ambiente (prod/preview/local) e guard do servidor."
          hint="Quando algo parece ‘não entrar’, ‘não abrir’, ou você quer confirmar se o admin está corretamente liberado."
          href="/api/debug/admin-guard"
        />
      </div>

      {/* Footer note */}
      <div className="rounded-xl border bg-white p-4 text-xs text-neutral-600">
        <div className="font-semibold text-neutral-700">Nota operacional</div>
        <div className="mt-1">
          Este Admin é feito para previsibilidade e governança (ADM-first). A UI é simples de propósito — a prioridade é
          não quebrar o app.
        </div>
      </div>
    </div>
  )
}
