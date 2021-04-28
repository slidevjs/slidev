import { resolve } from 'path'
import { mergeWindicssConfig, defineConfig } from 'vite-plugin-windicss'
import BaseConfig from '@slidev/client/windi.config'

// extend the base config
export default mergeWindicssConfig(
  BaseConfig,
  defineConfig({
    extract: {
      include: [
        resolve(__dirname, '**/*.{vue,ts}'),
      ],
    },
    shortcuts: {
      // custom the default background
      'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
    },
    theme: {
      extend: {
        // fonts can be replaced here, remember to update the web font links in `index.html`
        fontFamily: {
          sans: '"Nunito Sans", ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
          mono: '"Fira Code", monospace',
        },
      },
    },
  }),
)
