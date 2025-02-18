import { defineConfig, presetAttributify, presetIcons, presetWebFonts, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetWebFonts({
      fonts: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
    }),
    presetIcons(),
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
