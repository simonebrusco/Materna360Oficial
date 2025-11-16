"use client";

import { PageTemplate } from "@/components/common/PageTemplate";

export default function Page() {
  return (
    <PageTemplate>
      <div className="flex flex-col gap-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Minha Jornada</h1>
          <p className="text-gray-600 mt-1">Seu progresso</p>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed">
          Esta página mostrará sua evolução, conquistas e aprendizados ao longo da maternidade.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  );
}
