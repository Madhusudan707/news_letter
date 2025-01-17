/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'input-focus': 'input-focus 0.2s ease-out',
      },
      keyframes: {
        'input-focus': {
          '0%': { borderColor: 'transparent' },
          '100%': { borderColor: 'rgb(99 102 241)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};