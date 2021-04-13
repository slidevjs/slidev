import { defineConfig } from 'vite-plugin-windicss'

export default defineConfig({
  extract: {
    include: [
      'src/**/*.{vue,ts}',
      'slides.md',
    ],
  },
  darkMode: 'class',
  preflight: {
    includeAll: true,
  },
  shortcuts: {
    'bg-main': 'bg-white text-[#121212] dark:(bg-[#121212] text-white)',
    'icon-btn': `
      inline-block cursor-pointer select-none !outline-none
      opacity-75 transition duration-200 ease-in-out align-middle
      hover:(opacity-100 text-teal-600)
    `,
    'disabled': 'opacity-25 pointer-events-none',
    'abs-tl': 'absolute top-0 left-0',
    'abs-tr': 'absolute top-0 right-0',
    'abs-bl': 'absolute bottom-0 left-0',
    'abs-br': 'absolute bottom-0 right-0',
  },
  theme: {
    extend: {
      fontFamily: {
        sans: '"Avenir Next"',
      },
    },
  },
})
