/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'h1': ['1.75rem', { lineHeight: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h2': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.12)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06)',
        'card-hover-dark': '0 4px 16px rgba(0,0,0,0.2)',
      },
      transitionDuration: {
        'smooth': '220ms',
      },
    },
  },
  plugins: [],
}
