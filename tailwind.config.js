/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // nConnect brand colors - tech/modern vibe
        nconnect: {
          primary: '#0A1628',    // Deep dark blue
          secondary: '#1E3A5F',  // Medium blue
          accent: '#00D4FF',     // Cyan accent
          highlight: '#FF6B35',  // Orange for CTAs
          surface: '#0D1F33',    // Card backgrounds
          muted: '#64748B',      // Muted text
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.3)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(0, 212, 255, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255, 107, 53, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 212, 255, 0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
