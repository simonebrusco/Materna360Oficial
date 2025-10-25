export default function Loading() {
  return (
    <div className="my-6 mx-auto max-w-6xl space-y-4 px-4 md:px-6" aria-busy="true" aria-label="Carregando seção Cuidar">
      <div className="h-40 animate-pulse rounded-2xl border border-white/60 bg-white/60" />
      <div className="h-40 animate-pulse rounded-2xl border border-white/60 bg-white/60" />
    </div>
  )
}
