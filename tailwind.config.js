/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        lightblue: '#EFF6FF',
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
