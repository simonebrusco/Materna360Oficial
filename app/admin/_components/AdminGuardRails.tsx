export function AdminGuardRails() {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="font-semibold">Como funciona o conteúdo no Materna360</div>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li><b>Ideias</b> e <b>Textos editoriais</b> publicados alimentam diretamente o app.</li>
        <li><b>IDs / keys / slugs</b> são contratos: <b>não devem ser alterados</b>.</li>
        <li>Conteúdo recorrente é produzido por <b>seed/import</b>, não “no braço”.</li>
        <li>A IA <b>não cria conteúdo</b>; ela só seleciona e adapta onde permitido.</li>
        <li>Em dúvida: <b>não edite</b>. Pare e registre antes.</li>
      </ul>
    </div>
  )
}
