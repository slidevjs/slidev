declare module '*.md' {
  // with unplugin-vue-markdown, markdowns can be treat as Vue components
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module '#slidev/configs' {
  import type { SlidevConfig } from '@slidev/types'

  const configs: SlidevConfig
  export default configs
}

declare module '#slidev/shiki' {
  import type { ShikiHighlighterCore } from 'shiki/core'
  import type { BundledLanguage, BundledTheme } from 'shiki'

  export { shikiToMonaco } from '@shikijs/monaco'

  export const langs: BundledLanguage[]
  export const themes: BundledTheme | Record<string, BundledTheme>
  export const shiki: Promise<ShikiHighlighterCore>
}

declare module '#slidev/monaco-types' {
  // side-effects only
}

declare module 'mermaid/dist/mermaid.esm.mjs' {
  import Mermaid from 'mermaid/dist/mermaid.d.ts'

  export default Mermaid
}
