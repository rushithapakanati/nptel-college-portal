/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.32 0.12 264)',
        accent: 'oklch(0.88 0.12 85)',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        sans: ['General Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
