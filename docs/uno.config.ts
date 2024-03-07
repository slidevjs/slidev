import { defineConfig, presetAttributify, presetUno, presetWebFonts, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetWebFonts({
      fonts: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
  shortcuts: {
    'bg-main': 'bg-white dark:bg-[#111]',
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: '#3AB9D4',
        deep: '#2082A6',
      },
    },
  },
})
