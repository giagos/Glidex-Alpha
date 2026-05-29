import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: '#F2EBDC',
          panel: '#E8DFC9',
          card: '#FBF6E8',
          inset: '#DCD2B8',
        },
        ink: {
          DEFAULT: '#1F1A12',
          muted: '#6B5E45',
        },
        bevel: {
          hi: '#FFFCEF',
          lo: '#B7AC8E',
          dark: '#2A241B',
        },
        accent: {
          warm: '#8B5A2B',
          moss: '#6B7C3A',
          warn: '#B5651D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        bevel:
          'inset 1px 1px 0 #FFFCEF, inset -1px -1px 0 #B7AC8E, 0 0 0 1px #2A241B',
        'bevel-in':
          'inset 1px 1px 0 #B7AC8E, inset -1px -1px 0 #FFFCEF, 0 0 0 1px #2A241B',
      },
    },
  },
  plugins: [],
};

export default config;
