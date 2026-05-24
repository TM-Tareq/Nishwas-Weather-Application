// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      maxWidth: {
        '1440': '1440px',
      },
      colors: {
        // Nishwas brand — Premium Aero-Green
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Dark UI palette
        slate: {
          950: '#090D16',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        // AQI scale
        aqi: {
          good:        '#10B981',
          moderate:    '#F59E0B',
          unhealthySG: '#F97316',
          unhealthy:   '#EF4444',
          veryUnhealthy: '#A855F7',
          hazardous:   '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bangla: ['Noto Sans Bengali', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up':   'slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':    'fade-in 0.25s ease-out',
        'float':      'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'count-up':   'count-up 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
