import type { DefaultTheme } from 'vitepress/theme'
import type { DefineComponent } from 'vue'

// Typed stand-in for VitePress's default-theme `VPMenuLink.vue`, wired up via
// the `paths` entry in the root `tsconfig.json`. That component's source `.vue`
// files reference internal `.js` modules that ship without `.d.ts`, so letting
// `vue-tsc` parse them surfaces `noImplicitAny` errors from inside
// `node_modules`. Redirecting only TypeScript's resolution here avoids that;
// Vite still resolves the real component at runtime via node resolution.
declare const VPMenuLink: DefineComponent<{
  item: DefaultTheme.NavItemWithLink
  rel?: string
}>

export default VPMenuLink
