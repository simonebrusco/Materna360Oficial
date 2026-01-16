import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import MaternarClient from './Client'

const toBool = (v: string | undefined, fallback: boolean) => {
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return fallback
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Maternar Hub',
  description: 'Central hub para acessar todos os recursos do Maternar',
}

export default async function MaternarPage(props: {
  searchParams?: Promise<Record<string, string | string[]>>
}) {
  // Detecta Builder preview pelo header
  const headerValue = headers().get('x-builder-preview')
  const isHeaderPreview = headerValue === '1' || headerValue === 'true'

  // Detecta Builder preview pela query (?builder.preview=1)
  let isQueryPreview = false
  try {
    if (props.searchParams) {
      const params = await props.searchParams
      isQueryPreview = params['builder.preview'] === '1'
    }
  } catch {
    // se der erro, segue sem o parâmetro
  }

  const isBuilderPreview = isHeaderPreview || isQueryPreview

  // Feature flag do Maternar Hub
  const cookieVal = cookies().get('ff_maternar')?.value ?? null
  const cookieBool = cookieVal === '1' ? true : cookieVal === '0' ? false : null

  /**
   * Correção:
   * - Em produção, o default NÃO pode ser "false" quando env não existe,
   *   senão a aba Maternar vira redirect permanente para /meu-dia.
   * - Portanto: se NEXT_PUBLIC_FF_MATERNAR_HUB estiver ausente, default = true.
   */
  const envDefault = toBool(process.env.NEXT_PUBLIC_FF_MATERNAR_HUB, true)

  // Em preview do Builder, sempre habilita o hub
  const ff_maternar_hub = isBuilderPreview ? true : cookieBool !== null ? cookieBool : envDefault

  // Se a feature estiver desligada, redireciona para /meu-dia
  // (exceto no preview do Builder)
  if (!ff_maternar_hub) {
    redirect('/meu-dia')
  }

  return <MaternarClient />
}
