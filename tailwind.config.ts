import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // warm, calming palette — soft teal/sage primary, warm cream accents
        brand: {
          50:  '#f0fbf7',
          100: '#daf4e9',
          200: '#b6e8d4',
          300: '#86d6b8',
          400: '#52bf98',
          500: '#2fa37c',
          600: '#1f8366',
          700: '#1a6753',
          800: '#185344',
          900: '#15443a',
        },
        warm: {
          50:  '#fdfaf5',
          100: '#f9f1e3',
          200: '#f0dfba',
          300: '#e4c685',
          400: '#d4a651',
          500: '#b8862f',
        },
        ink: {
          900: '#0f1a17',
          800: '#1f2a26',
          700: '#374441',
          600: '#5a6764',
          500: '#7a8682',
          400: '#9ca5a2',
          300: '#bdc4c2',
          200: '#dde0df',
          100: '#eef0ef',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        base: ['1.0625rem', '1.7rem'],
        lg:   ['1.1875rem', '1.85rem'],
        xl:   ['1.5rem', '2.1rem'],
        '2xl':['1.875rem', '2.4rem'],
        '3xl':['2.25rem', '2.7rem'],
        '4xl':['3rem', '3.4rem'],
        '5xl':['3.75rem', '4.1rem'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(24, 83, 68, 0.12), 0 2px 6px -2px rgba(24, 83, 68, 0.06)',
        lift: '0 18px 40px -12px rgba(24, 83, 68, 0.18), 0 6px 12px -4px rgba(24, 83, 68, 0.08)',
      },
      backgroundImage: {
        'hero-grain': "radial-gradient(circle at 20% 10%, rgba(47,163,124,0.10), transparent 40%), radial-gradient(circle at 80% 0%, rgba(212,166,81,0.12), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;
