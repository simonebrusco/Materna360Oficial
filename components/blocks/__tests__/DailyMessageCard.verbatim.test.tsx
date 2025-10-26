import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import DailyMessageCard from '../DailyMessageCard'

describe('DailyMessageCard (verbatim render)', () => {
  it('renders the server-formatted greeting verbatim', () => {
    const greeting = 'Boa tarde, Mariana!'
    render(<DailyMessageCard greeting={greeting} />)
    expect(screen.getByText(greeting)).toBeInTheDocument()
  })

  it('does not alter fallback greetings', () => {
    const greeting = 'Boa noite, Mãe!'
    render(<DailyMessageCard greeting={greeting} />)
    expect(screen.getByText(greeting)).toBeInTheDocument()
  })
})
