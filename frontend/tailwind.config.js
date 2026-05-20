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
      colors: {
        // Nishwas brand colors — nature green
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
        // AQI scale colors (US EPA standard)
        aqi: {
          good: '#22c55e', // 0-50    Good
          moderate: '#eab308', // 51-100  Moderate
          unhealthySG: '#f97316', // 101-150 Unhealthy for Sensitive Groups
          unhealthy: '#ef4444', // 151-200 Unhealthy
          veryUnhealthy: '#a855f7', // 201-300 Very Unhealthy
          hazardous: '#7f1d1d', // 301+    Hazardous
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bangla: ['Noto Sans Bengali', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
