import { createLayoutWrapperPlugin } from '@slidev/cli/node/vite/layoutWrapper'
import { slidesInfo } from './slides'
import { moduleLoaders } from './runtime/module'

import '@slidev/theme-seriph/styles/index'

const layoutsRaw = [
  import.meta.glob('../../client/layouts/*.vue', { eager: true }),
  import.meta.glob('../node_modules/@slidev/theme-default/layouts/*.vue', { eager: true }),
]

const layouts: Record<string, any> = {}

for (const raw of layoutsRaw) {
  for (const path in raw) {
    const name = path.match(/([^/]+)\.vue$/)![1]
    layouts[name] = raw[path]
  }
}

function registerLoaders() {
  for (const name in layouts) {
    moduleLoaders[`/@fs/slidev-layouts:${name}`] = async () => layouts[name]
  }
}

registerLoaders()

export const layoutWrapperPlugin = createLayoutWrapperPlugin({
  data: {
    get slides() {
      return slidesInfo.value
    },
  },
  utils: {
    getLayouts() {
      return Object.fromEntries(
        Object.keys(layouts).map(i => [i, `slidev-layouts:${i}`]),
      )
    },
  },
} as any)
