/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Light mode colors
        light: {
          background: '#f8fafc', // slate-50
          card: '#ffffff',
          text: {
            primary: '#0f172a', // slate-900
            secondary: '#475569', // slate-600
            accent: '#0d9488', // teal-600
          },
          border: '#e2e8f0', // slate-200
          accent: {
            primary: '#0d9488', // teal-600
            secondary: '#14b8a6', // teal-500
          },
        },
        // Dark mode colors (current theme)
        dark: {
          background: '#0f172a', // slate-900
          card: '#1e293b', // slate-800
          text: {
            primary: '#f8fafc', // slate-50
            secondary: '#cbd5e1', // slate-300
            accent: '#5eead4', // teal-300
          },
          border: '#334155', // slate-700
          accent: {
            primary: '#14b8a6', // teal-500
            secondary: '#2dd4bf', // teal-400
          },
        },
      },
    },
  },
  plugins: [],
};