import { resolve } from 'path'
import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  extract: {
    include: [
      resolve(__dirname, '**/*.{vue,ts}'),
      'src/**/*.{vue,ts}',
      'components/**/*.{vue,ts}',
      'slides.md',
    ],
    exclude: [
      '.git/**',
    ],
  },
  safelist: [
    '!opacity-0',
  ],
  shortcuts: {
    'abs-t': 'absolute bottom-0 left-0 right-0',
    'abs-tl': 'absolute top-0 left-0',
    'abs-tr': 'absolute top-0 right-0',
    'abs-b': 'absolute bottom-0 left-0 right-0',
    'abs-bl': 'absolute bottom-0 left-0',
    'abs-br': 'absolute bottom-0 right-0',
  },
  darkMode: 'class',
  preflight: {
    includeAll: true,
  },
})
