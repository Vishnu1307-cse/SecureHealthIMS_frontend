/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#22D3EE',
        lightblue: '#0B1220',
        surface: '#0F172A',
        surfaceLight: '#111B2F',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '16px',
      },
    },
  },
  plugins: [],
}
