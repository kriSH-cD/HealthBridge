/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c90e7',
          600: '#0170c4',
          700: '#02599f',
          800: '#064b83',
          900: '#0b3f6d',
          950: '#072848',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          emerald: '#059669',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Gurmukhi', 'system-ui', 'sans-serif'],
        gurmukhi: ['Noto Sans Gurmukhi', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

