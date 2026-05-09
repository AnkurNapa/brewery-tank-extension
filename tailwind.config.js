/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tank: {
          steel: '#cfd5db',
          steelDark: '#9099a3',
          shell: '#e8edf2',
          accent: '#d97706',
        },
        temp: {
          cold: '#1976d2',
          normal: '#2e7d32',
          hot: '#ef6c00',
          critical: '#c62828',
        },
      },
      keyframes: {
        // Liquid wave: translate-x animates a wider-than-tank wave path leftward.
        liquidWave: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Soft pulsing for active fermentation halo.
        glowPulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%':      { opacity: '0.95', transform: 'scale(1.03)' },
        },
        // Sharper blink for critical-temperature tanks.
        criticalBlink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.45' },
        },
      },
      animation: {
        liquidWave:    'liquidWave 6s linear infinite',
        glowPulse:     'glowPulse 2.4s ease-in-out infinite',
        criticalBlink: 'criticalBlink 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
