import { resolve } from 'path'
import { defineConfig } from 'windicss/helpers'
import { ResolvedViteSlidesOptions } from './options'

export function getDefultWindiConfig({ packageRoot, themeRoot }: ResolvedViteSlidesOptions) {
  return defineConfig({
    extract: {
      include: [
        resolve(packageRoot, 'client/**/*.{vue,ts}'),
        resolve(themeRoot, '**/*.{vue,ts}'),
        'src/**/*.{vue,ts}',
        'components/**/*.{vue,ts}',
        'slides.md',
      ],
      exclude: [
        '.git/**',
        resolve(themeRoot, 'node_modules/*'),
      ],
    },
    safelist: [
      '!opacity-0',
    ],
    darkMode: 'class',
    preflight: {
      includeAll: true,
    },
    shortcuts: {
      'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
      'disabled': 'opacity-25 pointer-events-none',
      'abs-t': 'absolute bottom-0 left-0 right-0',
      'abs-tl': 'absolute top-0 left-0',
      'abs-tr': 'absolute top-0 right-0',
      'abs-b': 'absolute bottom-0 left-0 right-0',
      'abs-bl': 'absolute bottom-0 left-0',
      'abs-br': 'absolute bottom-0 right-0',
    },
    theme: {
      extend: {
        fontFamily: {
          sans: '"Avenir Next"',
        },
        colors: {
          primary: {
            DEFAULT: '#42b883',
          },
        },
      },
    },
  })
}
