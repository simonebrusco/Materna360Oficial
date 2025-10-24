/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff005e',
        secondary: '#ffd8e6',
        'support-1': '#2f3a56',
        'support-2': '#545454',
        'support-3': 'rgba(255, 255, 255, 0.65)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 22px 45px -26px rgba(47, 58, 86, 0.55)',
        elevated: '0 35px 60px -25px rgba(255, 0, 94, 0.45)',
        glow: '0 20px 45px -20px rgba(255, 0, 94, 0.48)',
      },
      borderRadius: {
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
  plugins: [],
}
