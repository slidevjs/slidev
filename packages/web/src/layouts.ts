import { createLayoutWrapperPlugin } from '@slidev/cli/node/vite/layoutWrapper'
import { slidesInfo } from './slides'
import { moduleLoaders } from './runtime/module'

const layoutsRaw = import.meta.glob(
  '../../client/layouts/*.vue',
  { eager: true },
)

const layouts = Object.fromEntries(
  Object.entries(layoutsRaw).map(([path, component]) => [
    path.match(/([^/]+)\.vue$/)![1],
    component,
  ]),
)

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
