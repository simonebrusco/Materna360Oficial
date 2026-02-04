// app/admin/_components/adminEnv.ts
export type AdminEnv = 'prod' | 'preview' | 'local'

export function getAdminEnv(): { env: AdminEnv; label: string } {
  const ve = process.env.VERCEL_ENV // 'production' | 'preview' | 'development' | undefined
  if (ve === 'production') return { env: 'prod', label: 'PROD' }
  if (ve === 'preview') return { env: 'preview', label: 'PREVIEW' }
  return { env: 'local', label: 'LOCAL' }
}

export function getShortCommit(): string | null {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    null
  if (!sha) return null
  return sha.slice(0, 7)
}
