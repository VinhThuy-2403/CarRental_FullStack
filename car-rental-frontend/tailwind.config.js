/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111111',
          soft:    '#2a2a2a',
          muted:   '#555555',
          subtle:  '#999999',
        },
        teal: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
          900: '#04342C',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft:    '#f7f8f9',
          muted:   '#f0f1f2',
        },
        border: {
          DEFAULT: '#e5e7eb',
          strong:  '#d1d5db',
        },
      },
      borderRadius: {
        xs:  '6px',
        sm:  '10px',
        md:  '14px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.12)',
        focus: '0 0 0 3px rgba(29,158,117,0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'spin-slow':  'spin 1.5s linear infinite',
        'shimmer':    'shimmer 1.4s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
    },
  },
  plugins: [],
}