'use client'

/**
 * Print element by ID with print-focus styling
 * Marks the element and triggers window.print() after layout settles
 */
export function printElementById(id: string) {
  const el = document.getElementById(id)
  if (!el) {
    window.print()
    return
  }

  const prev = document.querySelector('[data-print-focus="1"]') as HTMLElement | null
  prev?.removeAttribute('data-print-focus')

  el.setAttribute('data-print-focus', '1')
  // allow layout to settle before print
  setTimeout(() => window.print(), 50)
}
