import { useStyleTag } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { configs, slideHeight, slideWidth } from '../env'
import { useNav } from './useNav'

export function usePrintStyles() {
  const { isPrintMode } = useNav()
  const route = useRoute()

  // Only inject slide-sized @page for the default print/export view.
  // Handout has its own page sizing and should not be overridden.
  useStyleTag(computed(() => (isPrintMode.value && route.name !== 'handout')
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

export function useHandoutPageSetup() {
  const { isPrintMode } = useNav()
  const route = useRoute()

  const allowedRoute = computed(() => route.name === 'handout')
  const margins = computed(() => configs.handout.margins)
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
