declare interface Window {
  // extend the window
}

// with vite-plugin-vue-markdown, markdowns can be treat as Vue components
declare module '*.md' {
  import type { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}

declare module '/@slidev/configs' {
  import { SlidevConfig } from '@slidev/types'
  export default SlidevConfig
}
