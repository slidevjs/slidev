import { resolve } from 'path'
import { mergeWindicssConfig } from 'aslide'
import { defineConfig } from 'windicss/helpers'
import BaseConfig from 'aslide/client/windi.config'

export default mergeWindicssConfig(
  BaseConfig,
  defineConfig({
    extract: {
      include: [
        resolve(__dirname, '**/*.{vue,ts}'),
      ],
      exclude: [
        resolve(__dirname, 'node_modules/**/*'),
      ],
    },
    shortcuts: {
      'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
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
  }),
)
