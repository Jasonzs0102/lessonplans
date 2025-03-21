/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8c4cc',
          300: '#f39aa7',
          400: '#eb6375',
          500: '#e03e52',
          600: '#cf2438',
          700: '#ac1c35', // This is our primary crimson color (C0 M100 Y63 K29)
          800: '#8f1a2d',
          900: '#7a1c29',
          950: '#450b14',
        },
      },
    },
  },
  plugins: [],
}
