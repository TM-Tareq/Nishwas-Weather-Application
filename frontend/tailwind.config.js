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
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nishwas brand colors
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // AQI scale colors (US EPA standard)
        aqi: {
          good: '#22c55e',           // 0-50    Good
          moderate: '#eab308',       // 51-100  Moderate
          unhealthySG: '#f97316',    // 101-150 Unhealthy for Sensitive Groups
          unhealthy: '#ef4444',      // 151-200 Unhealthy
          veryUnhealthy: '#a855f7',  // 201-300 Very Unhealthy
          hazardous: '#7f1d1d',      // 301+    Hazardous
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bangla: ['Noto Sans Bengali', 'sans-serif'],
      },
    },
  },
  plugins: [],
};