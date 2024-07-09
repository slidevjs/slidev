import type { VirtualModuleTemplate } from './types'

export const VIRTUAL_SLIDE_PREFIX = '/@slidev/slides/'

export const templateSlides: VirtualModuleTemplate = {
  id: '/@slidev/slides',
  async getContent({ data }, { getLayouts }) {
    const layouts = await getLayouts()
    const imports = [
      `import { shallowRef } from 'vue'`,
      `import * as __layout__error from '${layouts.error}'`,
    ]
    const slides = data.slides
      .map((_, idx) => {
        const no = idx + 1
        imports.push(`import { meta as f${no} } from '${VIRTUAL_SLIDE_PREFIX}${no}/frontmatter'`)
        return `{
          no: ${no},
          meta: f${no},
          component: async () => {
            try {
              return await import('${VIRTUAL_SLIDE_PREFIX}${no}/md')
            }
            catch(e) {
              console.error('Failed to load slide ${no}:', e)
              return __layout__error
            }
          },
        }`
      })
    return [
      ...imports,
      `const data = [\n${slides.join(',\n')}\n]`,
      `if (import.meta.hot) {`,
      `  import.meta.hot.data.slides ??= shallowRef()`,
      `  import.meta.hot.data.slides.value = data`,
      `  import.meta.hot.accept()`,
      `}`,
      `export const slides = import.meta.hot ? import.meta.hot.data.slides : shallowRef(data)`,
    ].join('\n')
  },
}
