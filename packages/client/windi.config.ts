import { resolve, dirname } from 'path'
import { isTruthy } from '@antfu/utils'
import { DefaultExtractor, defineConfig } from 'vite-plugin-windicss'
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
      '.git',
      dirname(require.resolve('monaco-editor/package.json')),
    ],
    extractors: [
      {
        extensions: ['md'],
        extractor(code, id) {
          const data = DefaultExtractor(code, id)

          const frontmatterClasses = Array.from(code.matchAll(/^class:\s+(.*)$/gm)).flatMap(i => i[1].split(/[\s'"`]/g)).filter(isTruthy)
          const classes = [
            ...data.classes || [],
            ...frontmatterClasses,
          ]

          return {
            ...data,
            classes,
          }
        },
      },
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
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'inherit',
            a: { color: 'inherit' },
            b: { color: 'inherit' },
            code: { color: 'inherit' },
            strong: { color: 'inherit' },
            em: { color: 'inherit' },
            h1: { color: 'inherit' },
            h2: { color: 'inherit' },
            h3: { color: 'inherit' },
            h4: { color: 'inherit' },
            blockquote: { color: 'inherit' },
          },
        },
      },
    },
  },
})
