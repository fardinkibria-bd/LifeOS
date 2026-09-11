/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover) / <alpha-value>)',
        'surface-active': 'rgb(var(--surface-active) / <alpha-value>)',
        'surface-glass': 'rgb(var(--surface-glass) / <alpha-value>)',
        'surface-glass-strong': 'rgb(var(--surface-glass-strong) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        'border-glow': 'rgb(var(--border-glow) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',

        // Accent system
        accent: {
          DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          'primary-light': 'rgb(var(--accent-primary-light) / <alpha-value>)',
          'primary-dark': 'rgb(var(--accent-primary-dark) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          'secondary-light': 'rgb(var(--accent-secondary-light) / <alpha-value>)',
          tertiary: 'rgb(var(--accent-tertiary) / <alpha-value>)',
          'tertiary-light': 'rgb(var(--accent-tertiary-light) / <alpha-value>)',
        },

        // Brand (alias for accent-primary for backwards compat)
        brand: {
          50: 'rgb(var(--accent-primary) / 0.05)',
          100: 'rgb(var(--accent-primary) / 0.1)',
          200: 'rgb(var(--accent-primary) / 0.2)',
          300: 'rgb(var(--accent-primary) / 0.3)',
          400: 'rgb(var(--accent-primary-light) / 0.4)',
          500: 'rgb(var(--accent-primary) / <alpha-value>)',
          600: 'rgb(var(--accent-primary-dark) / <alpha-value>)',
          700: 'rgb(var(--accent-primary-dark) / 0.8)',
        },

        success: {
          50: 'rgb(var(--success) / 0.08)',
          100: 'rgb(var(--success) / 0.15)',
          500: 'rgb(var(--success) / <alpha-value>)',
          600: 'rgb(var(--success) / 0.8)',
          700: 'rgb(var(--success) / 0.6)',
        },
        warning: {
          50: 'rgb(var(--warning) / 0.08)',
          100: 'rgb(var(--warning) / 0.15)',
          500: 'rgb(var(--warning) / <alpha-value>)',
          600: 'rgb(var(--warning) / 0.8)',
          700: 'rgb(var(--warning) / 0.6)',
        },
        danger: {
          50: 'rgb(var(--danger) / 0.08)',
          100: 'rgb(var(--danger) / 0.15)',
          500: 'rgb(var(--danger) / <alpha-value>)',
          600: 'rgb(var(--danger) / 0.8)',
          700: 'rgb(var(--danger) / 0.6)',
        },
        info: {
          50: 'rgb(var(--info) / 0.08)',
          100: 'rgb(var(--info) / 0.15)',
          500: 'rgb(var(--info) / <alpha-value>)',
          600: 'rgb(var(--info) / 0.8)',
          700: 'rgb(var(--info) / 0.6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.03em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }],
        'h1': ['2rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.025em' }],
        'h2': ['1.5rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.015em' }],
        'h3': ['1.25rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.5' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
        'numeric': ['1.75rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }],
      },
      borderRadius: {
        'sm': '8px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'md': '0 4px 12px -2px rgb(0 0 0 / 0.1), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        'lg': '0 12px 28px -6px rgb(0 0 0 / 0.12), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
        'xl': '0 24px 48px -8px rgb(0 0 0 / 0.16), 0 8px 20px -6px rgb(0 0 0 / 0.08)',
        '2xl': '0 32px 64px -12px rgb(0 0 0 / 0.2), 0 12px 28px -8px rgb(0 0 0 / 0.1)',
        'glow': '0 0 24px -4px rgb(var(--glow-primary) / 0.3)',
        'glow-lg': '0 0 40px -8px rgb(var(--glow-primary) / 0.25)',
        'inner-glow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
      },
      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px -4px rgb(var(--glow-primary) / 0.2)' },
          '50%': { boxShadow: '0 0 30px -4px rgb(var(--glow-primary) / 0.35)' },
        },
        'stagger-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out-quart',
        'fade-in-up': 'fade-in-up 400ms ease-out-quart',
        'fade-in-down': 'fade-in-down 300ms ease-out-quart',
        'scale-in': 'scale-in 200ms ease-out-quart',
        'slide-in-right': 'slide-in-right 300ms ease-out-quart',
        'slide-in-bottom': 'slide-in-bottom 300ms ease-out-quart',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'stagger-in': 'stagger-in 400ms ease-out-quart both',
      },
    },
  },
  plugins: [],
};
