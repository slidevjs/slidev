import { useStyleTag } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { configs, slideHeight, slideWidth } from '../env'
import { useNav } from './useNav'

export function usePrintStyles() {
  const { isPrintMode } = useNav()
  const route = useRoute()

  // Only inject slide-sized @page for the default print/export view.
  // Handout and cover have their own A4 page sizing and should not be overridden.
  useStyleTag(computed(() => (isPrintMode.value && !['handout', 'cover'].includes((route.name as string) || ''))
    ? `
@page {
  size: ${slideWidth.value}px ${slideHeight.value}px;
  margin: 0px;
}

* {
  transition: none !important;
  transition-duration: 0s !important;
}`
    : ''))
}

// Monaco uses `<style media="screen" class="monaco-colors">` to apply colors, which will be ignored in print mode.
export function patchMonacoColors() {
  document.querySelectorAll<HTMLStyleElement>('style.monaco-colors').forEach((el) => {
    el.media = ''
  })
}

export type HandoutPageContext = 'handout' | 'cover' | 'ending'

export function useHandoutPageSetup(context: HandoutPageContext = 'handout') {
  const { isPrintMode } = useNav()
  const route = useRoute()

  const allowedRoute = computed(() => {
    if (context === 'cover')
      return route.name === 'cover'
    return route.name === 'handout'
  })

  const margins = computed(() => context === 'cover'
    ? configs.handout.coverMargins
    : configs.handout.margins)
  const pageSize = computed(() => configs.handout.cssPageSize)

  useStyleTag(computed(() => (isPrintMode.value && allowedRoute.value)
    ? `
@page {
  size: ${pageSize.value};
  margin-top: ${margins.value.top};
  margin-right: ${margins.value.right};
  margin-bottom: ${margins.value.bottom};
  margin-left: ${margins.value.left};
}
`
    : ''))

  return {
    margins,
    pageSize,
  }
}
