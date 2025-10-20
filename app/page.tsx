export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">🌸 Materna360</h1>
        <p className="text-lg text-support-2 mb-8">
          Um ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="p-6 bg-secondary rounded-lg shadow-sm">
            <h2 className="font-bold text-support-1 mb-2">Meu Dia</h2>
            <p className="text-sm text-support-2">Organize sua rotina e planeje com sua família</p>
          </div>
          <div className="p-6 bg-secondary rounded-lg shadow-sm">
            <h2 className="font-bold text-support-1 mb-2">Cuidar</h2>
            <p className="text-sm text-support-2">Meditações e dicas de autocuidado</p>
          </div>
          <div className="p-6 bg-secondary rounded-lg shadow-sm">
            <h2 className="font-bold text-support-1 mb-2">Descobrir</h2>
            <p className="text-sm text-support-2">Atividades e brincadeiras para seus filhos</p>
          </div>
          <div className="p-6 bg-secondary rounded-lg shadow-sm">
            <h2 className="font-bold text-support-1 mb-2">Eu360</h2>
            <p className="text-sm text-support-2">Check-in emocional e progresso</p>
          </div>
        </div>
      </div>
    </main>
  )
}
