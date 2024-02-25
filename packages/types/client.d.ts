// Types for virtual modules
// `#slidev/*` is an alias for `/@slidev/*`, because TS will consider `/@slidev/*` as an absolute path that we can't override

declare module '#slidev/configs' {
  import type { SlidevConfig } from '@slidev/types'

  const configs: SlidevConfig
  export default configs
}

declare module '#slidev/global-components/top' {
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module '#slidev/global-components/bottom' {
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module '#slidev/routes' {
  import type { RouteRecordRaw } from 'vue-router'

  const rawRoutes: RouteRecordRaw[]
  const redirects: RouteRecordRaw[]
  export { rawRoutes, redirects }
}

declare module '@slidev/titles.md' {
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module '#slidev/custom-nav-controls' {
  import type { ComponentOptions } from 'vue'

  const component: ComponentOptions
  export default component
}

declare module '#slidev/shiki' {
  import type { ShikiHighlighterCore } from 'shiki/core'
  import type { BundledLanguage, BundledTheme } from 'shiki'

  export { shikiToMonaco } from '@shikijs/monaco'

  export const langs: BundledLanguage[]
  export const themes: BundledTheme | Record<string, BundledTheme>
  export const shiki: Promise<ShikiHighlighterCore>
}

declare module '#slidev/styles' {
  // side-effects only
}

declare module '#slidev/monaco-types' {
  // side-effects only
}
