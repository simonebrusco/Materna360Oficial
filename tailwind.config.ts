import type { Config } from 'tailwindcss'

const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'support-1': 'rgb(var(--support-1) / <alpha-value>)',
        'support-2': 'rgb(var(--support-2) / <alpha-value>)',
        'neutral-1': 'rgb(var(--neutral-1) / <alpha-value>)',
        'neutral-2': 'rgb(var(--neutral-2) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(47,58,86,0.08)',
      },
      borderRadius: {
        'soft-3xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
