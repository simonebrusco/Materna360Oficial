export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  return (
    <main className="px-6 sm:px-8 pt-10 pb-14">
      <h1 className="text-3xl font-semibold">Materna360</h1>
      <p className="mt-2 opacity-80">Tudo o que você precisa em um só lugar.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="/meu-dia" className="rounded-2xl p-5 border shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">Meu Dia</h2>
          <p className="opacity-75">Planner diário, recados e checklist.</p>
        </a>
        <a href="/cuidar" className="rounded-2xl p-5 border shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-medium">Cuidar</h2>
          <p className="opacity-75">Bem-estar e práticas guiadas.</p>
        </a>
      </div>
    </main>
  )
}
