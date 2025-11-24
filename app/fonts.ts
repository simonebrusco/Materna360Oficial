import { Inter, Poppins } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
})

export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})
