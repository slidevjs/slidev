import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  safelist: [
    '!opacity-0',
    'prose',
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
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives({ enforce: 'pre' }),
    transformerVariantGroup(),
  ],
})
