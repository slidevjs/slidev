declare module '*.md' {
  // with unplugin-vue-markdown, markdowns can be treat as Vue components
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module 'mermaid/dist/mermaid.esm.mjs' {
  import Mermaid from 'mermaid/dist/mermaid.d.ts'

  export default Mermaid
}

declare module 'wavedrom' {
  export function renderAny(number, string, unknown): any[]
}

declare module 'wavedrom/skins/default' {
  export default unknown
}

declare module 'wavedrom/skins/narrow' {
  export const narrow: unknown
}

declare module 'wavedrom/skins/lowkey' {
  export const lowkey: unknown
}

declare module 'onml' {
  export function s(value: unknown): string
}
