/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1F2937',
          950: '#111827',
          900: '#172130',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#F5C451',
          dark: '#A87C12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Gujarati', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0.45)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,160,23,0)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'gold-pulse': 'gold-pulse 1.8s ease-out infinite',
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
