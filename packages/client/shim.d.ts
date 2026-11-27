// `vite-plugin-pwa` is an optional peer dependency (only needed when the `pwa`
// option is enabled), so declare the subset of `virtual:pwa-register` we use
// inline instead of `/// <reference types="vite-plugin-pwa/client" />`. When
// PWA is off, the CLI serves a no-op stub for this module.
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

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
