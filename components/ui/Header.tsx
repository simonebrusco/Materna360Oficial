'use client'

import { Avatar } from './Avatar'

interface HeaderProps {
  title: string
  showNotification?: boolean
}

export function Header({ title, showNotification = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-secondary sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=mom" alt="Me" size="sm" />
          <h1 className="text-lg md:text-xl font-semibold text-support-1">{title}</h1>
        </div>
        {showNotification && (
          <button className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Notifications">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        )}
      </div>
    </header>
  )
}
