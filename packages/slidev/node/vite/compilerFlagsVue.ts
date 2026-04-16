import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'

const RE_VUE_FILE = /\.vue(?:$|\?)/

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
    transform: {
      // TODO: static filter
      handler(code, id) {
        if (!RE_VUE_FILE.test(id) && !id.includes('?vue&'))
          return
        const original = code
        define.forEach(([from, to]) => {
          code = code.replaceAll(from, to)
        })
        if (original !== code)
          return code
      },
    },
  }
}
