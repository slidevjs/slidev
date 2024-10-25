import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'

/**
 * Replace compiler flags like `__DEV__` in Vue SFC
 */
export function createVueCompilerFlagsPlugin(
  options: ResolvedSlidevOptions,
): Plugin {
  const define = objectEntries(options.utils.define)
  return {
    name: 'slidev:flags',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.vue($|\?)/) && !id.includes('?vue&'))
        return
      const original = code
      define.forEach(([from, to]) => {
        code = code.replaceAll(from, to)
      })
      if (original !== code)
        return code
    },
  }
}
