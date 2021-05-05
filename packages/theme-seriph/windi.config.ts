import { resolve } from 'path'
import { mergeWindicssConfig, defineConfig } from 'vite-plugin-windicss'
import BaseConfig from '@slidev/client/windi.config'

export default mergeWindicssConfig(
  BaseConfig,
  defineConfig({
    extract: {
      include: [
        resolve(__dirname, '**/*.{vue}'),
      ],
      exclude: [
        resolve(__dirname, 'node_modules'),
      ],
    },
    shortcuts: {
      'bg-main': 'bg-white text-[#555] dark:(bg-[#121212] text-[#ddd])',
    },
    theme: {
      extend: {
        fontFamily: {
          sans: '"PT Serif",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
          serif: '"PT Serif",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
          mono: '"PT Mono", monospace',
        },
        colors: {
          primary: {
            DEFAULT: '#5d8392',
          },
        },
      },
    },
  }),
)
