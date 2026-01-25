/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1628',
        surface: '#111827',
        secondary: '#1E3A5F',
        accent: '#00D4FF',
        highlight: '#FF6B35',
        muted: '#94A3B8',
        'ai-stage': '#FF6B35',
        'softdev-stage': '#EF4444',
      },
    },
  },
  plugins: [],
};
