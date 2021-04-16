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
  darkMode: 'class',
  preflight: {
    includeAll: true,
  },
})
