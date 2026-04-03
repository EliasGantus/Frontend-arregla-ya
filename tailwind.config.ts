import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ebf4ff',
          100: '#d0e3ff',
          200: '#a7cbff',
          300: '#72aeff',
          400: '#3b89f5',
          500: '#1268d7',
          600: '#0c54b5',
          700: '#0a438f',
          800: '#0d376f',
          900: '#102f5a',
        },
        accent: {
          50: '#fff4e8',
          100: '#ffe6c5',
          200: '#ffd08d',
          300: '#ffb252',
          400: '#ff9621',
          500: '#ff7d00',
          600: '#e05d00',
          700: '#b74603',
          800: '#93380b',
          900: '#782f0c',
        },
        ink: '#0d1726',
        mist: '#eef4fa',
      },
      boxShadow: {
        glow: '0 24px 70px -24px rgba(18, 104, 215, 0.45)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
      fontFamily: {
        display: ['Trebuchet MS', 'Segoe UI', 'sans-serif'],
        body: ['Segoe UI', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
