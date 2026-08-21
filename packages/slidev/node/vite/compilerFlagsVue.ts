import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'

const RE_VUE_FILE = /\.vue(?:$|\?)/
const RE_VUE_QUERY = /\?vue&/
const RE_TS_JS_FILE = /\.[cm]?[jt]s(?:$|\?)/

/**
 * Replace compiler flags like `__DEV__` in Vue SFCs and client JS/TS modules.
 *
 * Vite's own `vite:define` does not substitute bare identifiers for the
 * client environment in dev (see vitejs/vite#22419 class of regression), so
 * Slidev's `__DEV__`/`__SLIDEV_*` flags would pass through unsubstituted in
 * `.ts`/`.js` modules such as `packages/client/setup/main.ts`, breaking cold
 * starts of custom `setup/main.ts` directives. Vue SFC templates are covered
 * here too because the compiled render functions reference the same flags.
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
        if (!RE_VUE_FILE.test(id) && !RE_VUE_QUERY.test(id) && !RE_TS_JS_FILE.test(id))
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
