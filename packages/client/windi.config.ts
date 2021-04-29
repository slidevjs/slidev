import { resolve } from 'path'
import { defineConfig } from 'windicss/helpers'
import typography from 'windicss/plugin/typography'

export default defineConfig({
  extract: {
    include: [
      resolve(__dirname, '**/*.{vue,ts}'),
      'src/**/*.{vue,ts}',
      'components/**/*.{vue,ts}',
      '*.md',
    ],
    exclude: [
      '.git/**',
    ],
  },
  plugins: [
    typography,
  ],
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
  attributify: true,
  darkMode: 'class',
  preflight: {
    includeAll: true,
  },
})
