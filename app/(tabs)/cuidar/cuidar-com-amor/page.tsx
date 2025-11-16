"use client";

import { PageTemplate } from "@/components/common/PageTemplate";

export default function Page() {
  return (
    <PageTemplate title="Cuidar com Amor" subtitle="Para o seu filho">
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Este será o seu espaço de cuidados essenciais para o seu filho. Em breve traremos rotinas, orientações e conteúdos relevantes.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  );
}
