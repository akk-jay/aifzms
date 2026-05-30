/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./overlay.html",
    "./record.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./overlay-src/**/*.{js,ts,jsx,tsx}",
    "./record-src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
