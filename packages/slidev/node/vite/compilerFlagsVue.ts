import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import { getDefine } from './extendConfig'

/**
 * Replace compiler flags like `__DEV__` in Vue SFC
 */
export function createVueCompilerFlagsPlugin(
  options: ResolvedSlidevOptions,
): Plugin[] {
  const define = objectEntries(getDefine(options))
  return [
    {
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.match(/\.vue($|\?)/) || id.includes('client/dist')) {
          const original = code
          define.forEach(([from, to]) => {
            code = code.replaceAll(from, to)
          })
          if (original !== code)
            return code
        }
      },
    },
  ]
}
