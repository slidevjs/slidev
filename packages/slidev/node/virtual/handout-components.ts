import type { VirtualModuleTemplate } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { toAtFS } from '../resolver'

function createHandoutComponentTemplate(name: 'handout-bottom' | 'handout-cover' | 'handout-ending'): VirtualModuleTemplate {
  return {
    id: `/@slidev/global-components/${name}`,
    getContent({ roots }) {
      const candidates = name === 'handout-bottom'
        ? ['handout-bottom.vue', 'HandoutBottom.vue']
        : name === 'handout-cover'
          ? ['handout-cover.vue', 'HandoutCover.vue']
          : ['handout-ending.vue', 'HandoutEnding.vue']

      const components = roots
        .flatMap(root => candidates.map(n => join(root, n)))
        .filter(p => existsSync(p))

      if (components.length === 0) {
        // Return an empty component
        return `export default { render: () => null }`
      }

      const key = name.replace('-', '_')
      const imports = components.map((p, i) => `import __h${key}_${i} from '${toAtFS(p)}'`).join('\n')
      // Explicitly declare and forward pageNumber (kebab or camelCase) so
      // overrides using defineProps<{ pageNumber: number }>() receive it.
      const body = `export default {\n  name: 'SlidevGlobal_${key}',\n  inheritAttrs: false,\n  props: { pageNumber: Number },\n  setup(props, { attrs }) {\n    const camelize = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())\n    function normalize(p) {\n      const out = {}\n      for (const k in p) out[camelize(k)] = p[k]\n      return out\n    }\n    return () => [${components.map((_, i) => `h(__h${key}_${i}, { ...normalize(attrs), pageNumber: props.pageNumber })`).join(',')}]\n  }\n}`
      return [imports, `import { h } from 'vue'`, body].join('\n')
    },
  }
}

export const templateGlobalHandoutBottom = createHandoutComponentTemplate('handout-bottom')
export const templateGlobalHandoutCover = createHandoutComponentTemplate('handout-cover')
export const templateGlobalHandoutEnding = createHandoutComponentTemplate('handout-ending')
