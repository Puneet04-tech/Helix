/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ai-dark': '#0D1B3E',
        'ai-secondary': '#112D5E',
        'ai-tertiary': '#1A3A6E',
        'ai-border': '#1E3A5F',
        'ai-accent': '#2979CC',
        'ai-accent-light': '#5BA4F5',
      },
      backgroundColor: {
        'gradient-dark': 'linear-gradient(135deg, #0D1B3E 0%, #1A3A6E 100%)',
      },
    },
  },
  plugins: [],
};
