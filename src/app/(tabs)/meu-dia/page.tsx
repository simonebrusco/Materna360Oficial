'use client';

import { useMemo } from 'react';

function formatDateBR(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function MeuDiaPage() {
  const today = useMemo(() => new Date(), []);
  const label = useMemo(() => formatDateBR(today), [today]);

  return (
    <section className="mx-auto max-w-screen-sm p-6 sm:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Meu Dia</h1>
        <p className="text-sm text-zinc-600 capitalize">{label}</p>
      </header>

      <div className="grid gap-4">
        <div className="rounded-2xl border p-4 shadow-sm">
          <h2 className="font-medium mb-2">Saudação</h2>
          <p className="text-zinc-700">
            Olá! Aqui ficam seu planejamento rápido, tarefas e lembretes do dia.
          </p>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <h2 className="font-medium mb-2">Checklist rápido</h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-700">
            <li>Hidratação ✓</li>
            <li>Respirar 2 min ✓</li>
            <li>Planejar 3 prioridades</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
