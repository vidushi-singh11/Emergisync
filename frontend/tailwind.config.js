/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#020203',
        'surface-primary': '#080808',
        'surface-elevated': '#141414',
        'border-glow': '#2d1313',
        'accent-cyan': '#ff2e63',
        'accent-amber': '#ff5e00',
        'accent-crimson': '#ef4444',
        'accent-violet': '#991b1b',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'large': '24px',
        'button': '12px',
        'badge': '999px',
      },
      letterSpacing: {
        'tighter-02': '-0.02em',
        'tighter-01': '-0.01em',
        'wide-08': '0.08em',
      },
      lineHeight: {
        '1.1': '1.1',
        '1.7': '1.7',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-radar': 'radar 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mesh-shift': 'mesh 20s ease-in-out infinite alternate',
        'shake': 'shake 0.3s ease-in-out',
        'spin-slow': 'spin 10s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        mesh: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        }
      }
    },
  },
  plugins: [],
}