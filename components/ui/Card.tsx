import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
