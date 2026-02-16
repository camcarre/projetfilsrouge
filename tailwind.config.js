/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2f7',
          100: '#d4dfeb',
          200: '#a8bfd7',
          300: '#769bc0',
          400: '#4d7aa8',
          500: '#1e3a5f',
          600: '#18304d',
          700: '#12263b',
          800: '#0c1c29',
          900: '#061218',
        },
      },
    },
  },
  plugins: [],
}
