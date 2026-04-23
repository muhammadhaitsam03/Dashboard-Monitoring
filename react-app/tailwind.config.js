/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F0F2F1',
        sidebar: '#1E463A',
        card: '#FFFFFF',
        textMain: '#111827',
        textMuted: '#6B7280',
        brand: '#1E463A',
        chartLine: '#1E463A'
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
