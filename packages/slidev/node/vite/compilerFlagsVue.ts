import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'

const RE_VUE_FILE = /\.vue(?:$|\?)/
const RE_TS_JS_FILE = /\.[cm]?[jt]s(?:$|\?)/
const RE_VUE_QUERY_SCRIPT = /\?vue&type=script/

/**
 * Replace compiler flags like `__DEV__` in Vue SFCs and client JS/TS modules.
 *
 * Vite's own `vite:define` does not substitute bare identifiers for the
 * client environment in dev (see vitejs/vite#22419 class of regression), so
 * Slidev's `__DEV__`/`__SLIDEV_*` flags would pass through unsubstituted in
 * `.ts`/`.js` modules such as `packages/client/setup/main.ts`, breaking cold
 * starts of custom `setup/main.ts` directives.
 *
 * Vue SFC files are transformed in every mode: their compiled render
 * functions reference the flags as property accesses (e.g.
 * `ctx.__SLIDEV_FEATURE_PWA__`), which Vite's identifier-only define cannot
 * substitute in production builds either.
 *
 * JS/TS modules are transformed in dev only: Vite's own define substitutes
 * bare identifiers in production builds, so running both would double-replace.
 */
export function createVueCompilerFlagsPlugin(
  options: ResolvedSlidevOptions,
): Plugin {
  const define = objectEntries(options.utils.define)
  const flagMap = new Map(define)
  const flagRe = new RegExp(
    [...flagMap.keys()].map(k => `(?<![\\w$])${escapeRegExp(k)}(?![\\w$])`).join('|'),
    'g',
  )
  return {
    name: 'slidev:flags',
    enforce: 'pre',
    transform: {
      filter: {
        id: {
          include: [RE_VUE_FILE, RE_VUE_QUERY_SCRIPT, RE_TS_JS_FILE],
          exclude: /\/node_modules\//,
        },
      },
      handler(code, id) {
        // JS/TS modules are dev-only: Vite's define handles production builds.
        if (options.mode !== 'dev' && RE_TS_JS_FILE.test(id))
          return
        // Static filter: skip modules that cannot contain any flag.
        if (!flagRe.test(code)) {
          flagRe.lastIndex = 0
          return
        }
        flagRe.lastIndex = 0
        const original = code
        code = code.replace(flagRe, m => flagMap.get(m)!)
        if (original !== code)
          return code
      },
    },
  }
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
