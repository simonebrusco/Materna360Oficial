export default function AdminTextsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-neutral-900">Textos Fixos do App</h1>
        <p className="text-sm text-neutral-600">
          Aqui entram textos de tela (microcopy, FAQ, mensagens fixas) — <b>não</b> são “Ideias”. O objetivo é ter
          governança e atualização segura sem mexer no código.
        </p>
      </div>

      {/* O que entra / não entra */}
      <div className="rounded-xl border bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">O que entra aqui (e o que não entra)</div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-neutral-900">✅ Entra em Textos</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li>Títulos e descrições fixas de páginas</li>
              <li>FAQ (perguntas e respostas curtas)</li>
              <li>Mensagens de onboarding / instruções de tela</li>
              <li>Textos de ajuda (“como usar”, “o que fazer agora”)</li>
              <li>Microcopy de botões e estados vazios (empty state)</li>
            </ul>
          </div>

          <div className="rounded-lg bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-neutral-900">❌ Não entra em Textos</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li>Conteúdo que vira sugestão/atividade nos hubs → isso é <b>Ideias</b></li>
              <li>Conteúdo com variação por filtros (idade, tempo, local etc.) → <b>Ideias</b></li>
              <li>Listas grandes de conteúdo “consumível” → <b>Ideias</b> (ADM-first)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Onde salva */}
      <div className="rounded-xl border bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">Onde isso salva no Supabase</div>

        <div className="mt-2 text-sm text-neutral-700">
          A estrutura usa a tabela <b>adm_editorial_texts</b>. Cada item é identificado por uma chave estável.
        </div>

        <div className="mt-3 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
          <div className="font-semibold text-neutral-900">Chave (não-negociável)</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>hub</b> + <b>key</b> são a identidade do texto (chave única).
            </li>
            <li>
              <b>source</b> deve ser <b>adm</b> quando curado/validado.
            </li>
            <li>
              <b>status</b> recomendado: <b>published</b> quando pronto para consumo.
            </li>
          </ul>
        </div>
      </div>

      {/* Padrão de nomenclatura */}
      <div className="rounded-xl border bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">Padrão de nomes (key) — para não virar caos</div>

        <div className="mt-2 text-sm text-neutral-700">
          Use keys “legíveis e estáveis”, com namespaces simples. Exemplo:
        </div>

        <div className="mt-3 rounded-lg bg-neutral-50 p-4 font-mono text-xs text-neutral-800">
          meu-dia.page.intro
          <br />
          meu-dia.empty.no-items
          <br />
          cuidar.page.header
          <br />
          cuidar.help.how-it-works
          <br />
          maternar.ajuda.faq
          <br />
          admin.texts.guidance
        </div>

        <div className="mt-3 text-sm text-neutral-700">
          Regra prática: <b>page</b> (texto de página), <b>empty</b> (estado vazio), <b>help</b> (ajuda), <b>faq</b>{' '}
          (FAQ).
        </div>
      </div>

      {/* Como operar hoje */}
      <div className="rounded-xl border bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">Como operar hoje (sem editor)</div>

        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-neutral-700">
          <li>
            Você pode inserir/alterar textos direto no Supabase em <b>adm_editorial_texts</b> (até o editor ficar pronto).
          </li>
          <li>
            Sempre que criar um texto, garanta: <b>hub</b>, <b>key</b>, <b>body</b>, <b>status</b>, <b>source</b>.
          </li>
          <li>
            Se um texto for sensível/recorrente/monetizável → ele precisa estar aqui (ADM-first), não no código.
          </li>
        </ul>

        <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-xs text-neutral-700">
          <div className="font-semibold text-neutral-900">Status do módulo</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Listagem por hub/key: em construção</li>
            <li>Edição no Admin (UI): em construção</li>
            <li>Upsert por chave única (hub, key): já validado</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
