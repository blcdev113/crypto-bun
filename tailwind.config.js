/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        secondary: '#2563EB',
        negative: '#EF4444',
        background: '#0F172A',
        surface: '#1E293B',
        'surface-light': '#2D3748',
      },
      fontFamily: {
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};