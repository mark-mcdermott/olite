/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables
        obsidian: {
          bg: 'var(--color-bg)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-tertiary': 'var(--color-bg-tertiary)',
          surface: 'var(--color-surface)',
          border: 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          hover: 'var(--color-hover)',
          active: 'var(--color-active)',
        },
        accent: {
          DEFAULT: '#14b8a6',
          light: '#2dd4bf',
          dark: '#0d9488',
          muted: 'rgba(20, 184, 166, 0.15)',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-text)',
            '--tw-prose-headings': 'var(--color-text)',
            '--tw-prose-lead': 'var(--color-text-secondary)',
            '--tw-prose-links': '#14b8a6',
            '--tw-prose-bold': 'var(--color-text)',
            '--tw-prose-counters': 'var(--color-text-secondary)',
            '--tw-prose-bullets': 'var(--color-text-muted)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-quotes': 'var(--color-text-secondary)',
            '--tw-prose-quote-borders': '#14b8a6',
            '--tw-prose-captions': 'var(--color-text-muted)',
            '--tw-prose-code': '#14b8a6',
            '--tw-prose-pre-code': 'var(--color-text)',
            '--tw-prose-pre-bg': 'var(--color-bg-tertiary)',
            '--tw-prose-th-borders': 'var(--color-border)',
            '--tw-prose-td-borders': 'var(--color-border)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
