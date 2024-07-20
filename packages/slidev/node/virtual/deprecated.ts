import type { VirtualModuleTemplate } from './types'

/**
 * Kept for backward compatibility, use #slidev/slides instead
 *
 * @deprecated
 */
export const templateLegacyRoutes: VirtualModuleTemplate = {
  id: '/@slidev/routes',
  getContent() {
    return [
      `export { slides } from '#slidev/slides'`,
      `console.warn('[slidev] #slidev/routes is deprecated, use #slidev/slides instead')`,
    ].join('\n')
  },
}

/**
 * Kept for backward compatibility, use #slidev/title-renderer instead
 *
 * @deprecated
 */
export const templateLegacyTitles: VirtualModuleTemplate = {
  id: '/@slidev/titles.md',
  getContent() {
    return `
<script setup lang="ts">
import TitleRenderer from '#slidev/title-renderer'
defineProps<{ no: number | string }>()
console.warn('/@slidev/titles.md is deprecated, import from #slidev/title-renderer instead')
</script>

<TitleRenderer :no="no" />
`
  },
}
