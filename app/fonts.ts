import { Inter, Poppins, Quicksand } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
})

export const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-primary',
})

export const quicksand = Quicksand({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-secondary',
})
