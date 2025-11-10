'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Client-side redirect
    router.replace('/meu-dia')
  }, [router])

  return null
}
