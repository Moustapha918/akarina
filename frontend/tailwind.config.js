/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9f4',
          100: '#dcf0e5',
          200: '#bbe1cd',
          300: '#8dcaaa',
          400: '#5aad82',
          500: '#359162',
          600: '#25734c',
          700: '#1a5f3c',  // Main brand color
          800: '#174d33',
          900: '#14402b',
        },
        gold: {
          400: '#f0c040',
          500: '#e6ac20',
          600: '#cc9900',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'serif'],
      },
    },
  },
  plugins: [],
}
