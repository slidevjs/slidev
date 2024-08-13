import type { VirtualModuleTemplate } from './types'

export const VIRTUAL_SLIDE_PREFIX = '/@slidev/slides/'

export const templateSlides: VirtualModuleTemplate = {
  id: '/@slidev/slides',
  getContent({ data, utils }) {
    const layouts = utils.getLayouts()
    const statements = [
      `import { defineAsyncComponent, shallowRef } from 'vue'`,
      `import SlideError from '${layouts.error}'`,
      `import SlideLoading from '@slidev/client/internals/SlideLoading.vue'`,
      `const componentsCache = new Array(${data.slides.length})`,
      `const getAsyncComponent = (idx, loader) => defineAsyncComponent({`,
      `  loader,`,
      `  delay: 300,`,
      `  loadingComponent: SlideLoading,`,
      `  errorComponent: SlideError,`,
      `  onError: e => console.error('Failed to load slide ' + (idx + 1), e) `,
      `})`,
    ]
    const slides = data.slides
      .map((_, idx) => {
        const no = idx + 1
        statements.push(
          `import { meta as f${no} } from '${VIRTUAL_SLIDE_PREFIX}${no}/frontmatter'`,
          // For some unknown reason, import error won't be caught by the error component. Catch it here.
          `const load${no} = async () => {`,
          `  try { return componentsCache[${idx}] ??= await import('${VIRTUAL_SLIDE_PREFIX}${no}/md') }`,
          `  catch (e) { console.error('slide failed to load', e); return SlideError }`,
          `}`,
        )
        return `{ no: ${no}, meta: f${no}, load: load${no}, component: getAsyncComponent(${idx}, load${no}) }`
      })
    return [
      ...statements,
      `const data = [\n${slides.join(',\n')}\n]`,
      `if (import.meta.hot) {`,
      `  import.meta.hot.data.slides ??= shallowRef()`,
      `  import.meta.hot.data.slides.value = data`,
      `  import.meta.hot.dispose(() => componentsCache.length = 0)`,
      `  import.meta.hot.accept()`,
      `}`,
      `export const slides = import.meta.hot ? import.meta.hot.data.slides : shallowRef(data)`,
    ].join('\n')
  },
}
