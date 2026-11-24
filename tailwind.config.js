/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1F2937',
          950: '#111827',
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
    },
  },
  plugins: [],
}
