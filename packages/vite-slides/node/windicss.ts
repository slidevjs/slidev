import { resolve } from 'path'
import { defineConfig } from 'windicss/helpers'
import { Config as WindiConfig } from 'windicss/types/interfaces'
import { deepMerge } from '@antfu/utils'
import { getPackageRoot, getThemeRoot } from './env'

export function getDefultWindiConfig() {
  return defineConfig({
    extract: {
      include: [
        resolve(getPackageRoot(), 'client/**/*.{vue,ts}'),
        resolve(getThemeRoot(), '**/*.{vue,ts}'),
        'src/**/*.{vue,ts}',
        'slides.md',
      ],
    },
    safelist: '!opacity-0',
    darkMode: 'class',
    preflight: {
      includeAll: true,
    },
    shortcuts: {
      'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
      'icon-btn': `
        inline-block cursor-pointer select-none !outline-none
        opacity-75 transition duration-200 ease-in-out align-middle
        hover:(opacity-100 text-teal-600)
      `,
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

export function extendWindiConfig(a: WindiConfig) {
  return deepMerge(getDefultWindiConfig(), a)
}
