/** @type {import('tailwindcss').Config} */
const path = require('path');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './app/src/**/*.{js,ts,jsx,tsx,css}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'axptRadialBackground',
    'axptSigil',
    'axptSigil.visible',
    'axptSigil.burst',
    'axptSigil.float',
  ],
  theme: {
    extend: {
      colors: {
        axisGold: '#e6c667',
        pulseBlack: '#0d0b10',
        gold: {
          900: '#bfa135',
          800: '#d4b44a',
          700: '#e6c667',
        },
        green: {
          900: '#146a2c',
          800: '#1f853c',
          700: '#28a745',
        },
        blue: {
          900: '#0a3d62',
          800: '#1c5f8a',
          700: '#2e86de',
        },
      },
      screens: {
        xs: '400px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      fontFamily: {
        mono: ['var(--font-fira-code)', 'monospace'],
        axis: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-fade-in': 'slideFadeIn 0.6s ease-out forwards',
        'pulse-slow': 'pulseSlow 12s ease-in-out infinite',
        'emerald-shimmer': 'emeraldShimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        slideFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1.03)', opacity: '0.10' },
          '50%': { transform: 'scale(1.07)', opacity: '0.15' },
        },
        emeraldShimmer: {
          '0%': {
            backgroundPosition: '-150% 0',
          },
          '100%': {
            backgroundPosition: '150% 0',
          },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};