/** @type {import('tailwindcss').Config} */
const path = require("path");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/src/**/*.{js,ts,jsx,tsx,css}"
  ],
  theme: {
    extend: {
      colors: {
        axisGold: "#e6c667",
        pulseBlack: "#0a0a0a",
        gold: {
          900: '#bfa135',
          800: '#d4b44a',
          700: '#e6c667'
        },
        green: {
          900: '#146a2c',
          800: '#1f853c',
          700: '#28a745'
        },
        blue: {
          900: '#0a3d62',
          800: '#1c5f8a',
          700: '#2e86de'
        }
      },
      screens: {
        xs: "400px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px"
      },
      fontFamily: {
        mono: ['var(--font-fira-code)', 'monospace'],
        axis: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
};