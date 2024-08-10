import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'

/**
 * Replace compiler flags like `__DEV__` in Vue SFC
 */
export function createVueCompilerFlagsPlugin(
  options: ResolvedSlidevOptions,
): Plugin[] {
  const define = objectEntries(options.utils.defines)
  return [
    {
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.match(/\.vue($|\?)/)) {
          const original = code
          define.forEach(([from, to]) => {
            code = code.replace(new RegExp(from, 'g'), to)
          })
          if (original !== code)
            return code
        }
      },
    },
  ]
}
