// app/lib/ai/profileAdapter.ts

export type MaternaContext = {
  profile: unknown | null
  child: unknown | null
}

/**
 * Versão neutra do adapter para a branch main.
 *
 * Ela NÃO depende de nenhum outro arquivo de IA,
 * não importa maternaCore, nem eu360ProfileAdapter.
 *
 * Isso garante que o build não quebre, e o endpoint de IA
 * continua funcionando com contexto nulo (comportamento seguro).
 */
export async function loadMaternaContextFromRequest(
  _req: Request
): Promise<MaternaContext> {
  return {
    profile: null,
    child: null,
  }
}
