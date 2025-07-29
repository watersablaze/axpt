/** @type {import('tailwindcss').Config} */
const path = require('path');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './app/src/**/*.{js,ts,jsx,tsx,css}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}', // Optional, for utilities or shared logic
  ],
  theme: {
    extend: {
      colors: {
        axisGold: '#e6c667',
        pulseBlack: '#0a0a0a',
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
      },
      keyframes: {
        slideFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};