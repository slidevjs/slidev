import { resolve } from 'node:path'
import { isTruthy } from '@antfu/utils'
import { DefaultExtractor, defineConfig } from 'vite-plugin-windicss'
import typography from 'windicss/plugin/typography'

export default defineConfig({
  extract: {
    include: [
      resolve(process.cwd(), '**/*.{vue,ts,tsx,js,jsx,md}'),
      // @slidev/client/**/*.{vue,ts}
      resolve(__dirname, '**/*.{vue,ts}'),
    ],
    exclude: [
      '.git',
      'dist',
      resolve(process.cwd(), '.git'),
      resolve(process.cwd(), 'dist'),
      // @slidev/client/node_modules
      resolve(__dirname, 'node_modules'),
      resolve(__dirname, 'windi.config.ts'),
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
    // @ts-expect-error casing
    typography,
  ],
  safelist: [
    '!opacity-0',
  ],
  shortcuts: {
    'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
    'bg-active': 'bg-gray-400/10',
    'border-main': 'border-gray-400/20',
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
