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

declare module '#slidev/slides' {
  import type { ShallowRef } from 'vue'
  import type { SlideRoute } from '@slidev/types'

  const slides: ShallowRef<SlideRoute[]>
  export { slides }
}

declare module '#slidev/title-renderer' {
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

declare module '#slidev/setups/monaco' {
  import type { MonacoSetup } from '@slidev/types'

  const setups: MonacoSetup[]
  export default setups
}

declare module '#slidev/setups/code-runners' {
  import type { CodeRunnersSetup } from '@slidev/types'

  const setups: CodeRunnersSetup[]
  export default setups
}

declare module '#slidev/setups/mermaid' {
  import type { MermaidSetup } from '@slidev/types'

  const setups: MermaidSetup[]
  export default setups
}

declare module '#slidev/setups/main' {
  import type { AppSetup } from '@slidev/types'

  const setups: AppSetup[]
  export default setups
}

declare module '#slidev/setups/root' {
  import type { RootSetup } from '@slidev/types'

  const setups: RootSetup[]
  export default setups
}

declare module '#slidev/setups/shortcuts' {
  import type { ShortcutsSetup } from '@slidev/types'

  const setups: ShortcutsSetup[]
  export default setups
}

declare module '#slidev/styles' {
  // side-effects only
}

declare module '#slidev/monaco-types' {
  // side-effects only
}
