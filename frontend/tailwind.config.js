/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6fffb',
          100: '#b3fff0',
          200: '#80ffe5',
          300: '#4dffda',
          400: '#1affcf',
          500: '#00e6b8',
          600: '#00b390',
          700: '#008068',
          800: '#004d40',
          900: '#001a18',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b0b0b0',
          300: '#808080',
          400: '#505050',
          500: '#202020',
          600: '#1a1a1a',
          700: '#141414',
          800: '#0e0e0e',
          900: '#080808',
        },
      },
      fontFamily: {
        sans: ['Commissioner', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 184, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 230, 184, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
