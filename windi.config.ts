import { defineConfig } from 'vite-plugin-windicss'
import aspectRatio from 'windicss/plugin/aspect-ratio'

export default defineConfig({
  extract: {
    include: [
      '**/*.{md,vue}',
      '.vitepress/**/*.{ts,md,vue}',
      '../packages/client/internals/SlideContainer.vue',
      '../packages/client/layouts/*.vue',
      '../packages/@theme-default/layouts/*.vue',
    ],
  },
  plugins: [
    aspectRatio,
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3AB9D4',
          deep: '#2082A6',
        },
      },
      fontFamily: {
        mono: '\'IBM Plex Mono\', source-code-pro, Menlo, Monaco, Consolas, \'Courier New\', monospace',
      },
    },
  },
})
