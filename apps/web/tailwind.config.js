/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens — mirror CSS variable defaults so Tailwind utilities work
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#6db3ff',
          500: '#4d9fff',
          600: '#3b8fe0',
          700: '#2d73c4',
          800: '#1e55a0',
          900: '#153d7a',
        },
        dark: {
          bg:     '#111318',
          card:   '#1b1f27',
          border: '#23293a',
          text:   '#f0f4f8',
          muted:  '#8896a8',
        },
        positive: '#30d158',
        negative: '#ff453a',
        accent:   '#4d9fff',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
