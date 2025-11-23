import type { ReactNode } from 'react'

export default function GridStable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-screen-xl px-4 ${className}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {children}
      </div>
    </section>
  )
}
