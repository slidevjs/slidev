import { defineConfig } from 'vite-plugin-windicss'

export default defineConfig({
  extract: {
    include: [
      '**/*.{md,vue}',
      '.vitepress/**/*.{ts,md,vue}',
    ],
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3AB9D4',
          deep: '#2082A6',
        },
      },
    },
  },
})
