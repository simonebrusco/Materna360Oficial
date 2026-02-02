// app/lib/siteUrl.ts
export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL

  const raw =
    (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : (envUrl || '')

  const cleaned = String(raw || '').trim().replace(/\/+$/, '')

  // Se veio "www.materna360.com.br" sem protocolo, conserta.
  if (cleaned && !/^https?:\/\//i.test(cleaned)) return `https://${cleaned}`

  return cleaned
}
