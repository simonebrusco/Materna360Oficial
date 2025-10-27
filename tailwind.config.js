/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './app/(tabs)/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary) / <alpha-value>)',
        secondary: '#ffd8e6',
        'support-1': 'rgb(var(--support-1) / <alpha-value>)',
        'support-2': 'rgb(var(--support-2) / <alpha-value>)',
        'support-3': 'rgba(255, 255, 255, 0.65)',
        'neutral-1': 'rgb(var(--neutral-1) / <alpha-value>)',
        'neutral-2': 'rgb(var(--neutral-2) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.06)',
        soft: '0 22px 45px -26px rgba(47, 58, 86, 0.55)',
        elevated: '0 35px 60px -25px rgba(255, 0, 94, 0.45)',
        glow: '0 20px 45px -20px rgba(255, 0, 94, 0.48)',
      },
      borderRadius: {
        xl2: '1rem',
        'soft-3xl': '1.75rem',
      },
      backgroundImage: {
        'materna-gradient': 'linear-gradient(160deg, rgba(255, 216, 230, 0.75) 0%, rgba(255, 255, 255, 0.95) 100%)',
        'materna-card': 'linear-gradient(145deg, rgba(255, 216, 230, 0.55) 0%, rgba(255, 255, 255, 0.95) 100%)',
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(18px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: 0, transform: 'translateY(-14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 0, 94, 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(255, 0, 94, 0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.94)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'fade-down': 'fade-down 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  safelist: [
    { pattern: /^(bg|text|from|via|to|shadow|rounded|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|grid-cols|col-span|gap)-/ },
    { pattern: /(bg|text)-[a-zA-Z0-9-]+\/[0-9]{1,3}/ },
  ],
  plugins: [],
}
