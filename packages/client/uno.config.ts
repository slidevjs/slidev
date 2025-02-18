import extractorMdc from '@unocss/extractor-mdc'
import { variantMatcher } from '@unocss/preset-mini/utils'
import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  safelist: [
    '!opacity-0',
    'prose',
    // See https://github.com/slidevjs/slidev/issues/1705
    'grid-rows-[1fr_max-content]',
    'grid-cols-[1fr_max-content]',
  ],
  shortcuts: {
    'bg-main': 'bg-white dark:bg-[#121212]',
    'bg-active': 'bg-gray-400/10',
    'border-main': 'border-gray/20',
    'text-main': 'text-[#181818] dark:text-[#ddd]',
    'text-primary': 'color-$slidev-theme-primary',
    'bg-primary': 'bg-$slidev-theme-primary',
    'border-primary': 'border-$slidev-theme-primary',
    'abs-tl': 'absolute top-0 left-0',
    'abs-tr': 'absolute top-0 right-0',
    'abs-b': 'absolute bottom-0 left-0 right-0',
    'abs-bl': 'absolute bottom-0 left-0',
    'abs-br': 'absolute bottom-0 right-0',

    'z-drawing': 'z-10',
    'z-camera': 'z-15',
    'z-dragging': 'z-18',
    'z-menu': 'z-20',
    'z-label': 'z-40',
    'z-nav': 'z-50',
    'z-context-menu': 'z-60',
    'z-modal': 'z-70',
    'z-focus-indicator': 'z-200',

    'slidev-glass-effect': 'shadow-xl backdrop-blur-8 border border-main bg-main bg-opacity-75!',
  },
  // Slidev Specific Variants, probably extrat to a preset later
  variants: [
    // `forward:` and `backward:` variant to selectively apply styles based on the direction of the slide
    // For example, `forward:text-red` will only apply to the slides that are navigated forward
    variantMatcher('forward', input => ({ prefix: `.slidev-nav-go-forward ${input.prefix}` })),
    variantMatcher('backward', input => ({ prefix: `.slidev-nav-go-backward ${input.prefix}` })),
  ],
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography(),
    /* Preset Icons is added in ../node/setups/unocss.ts */
  ],
  transformers: [
    transformerDirectives({ enforce: 'pre' }),
    transformerVariantGroup(),
  ],
  extractors: [
    extractorMdc(),
  ],
})
