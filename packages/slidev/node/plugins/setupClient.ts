import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { slash, uniq } from '@antfu/utils'
import type { Plugin } from 'vite'
import type { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../utils'

export function createClientSetupPlugin({ clientRoot, themeRoots, addonRoots, userRoot }: ResolvedSlidevOptions): Plugin {
  const setupEntry = slash(resolve(clientRoot, 'setup'))

  return {
    name: 'slidev:setup',
    enforce: 'pre',
    async transform(code, id) {
      if (id.startsWith(setupEntry)) {
        const name = id.slice(setupEntry.length + 1)
        const imports: string[] = []
        const injections: string[] = []
        const asyncInjections: string[] = []
        const chainedInjections: string[] = []
        const chainedAsyncInjections: string[] = []

        const setups = uniq([
          ...themeRoots,
          ...addonRoots,
          userRoot,
        ]).map(i => join(i, 'setup', name))

        setups.forEach((path, idx) => {
          if (!existsSync(path))
            return

          imports.push(`import __n${idx} from '${toAtFS(path)}'`)

          let fn = `__n${idx}`
          let awaitFn = `await __n${idx}`
          let chainedFn = `__n${idx}`
          let chainedAwaitFn = `await __n${idx}`

          if (/\binjection_return\b/g.test(code)) {
            fn = `injection_return = ${fn}`
            awaitFn = `injection_return = ${awaitFn}`
            chainedFn = `injection_return = ${chainedFn}`
            chainedAwaitFn = `injection_return = ${chainedAwaitFn}`
          }
          if (/\binjection_arg\b/g.test(code)) {
            fn += '('
            awaitFn += '('
            chainedFn += '('
            chainedAwaitFn += '('

            const matches = Array.from(code.matchAll(/\binjection_arg(_\d+)?\b/g))
            const dedupedMatches = Array.from(new Set(matches.map(m => m[0])))
            dedupedMatches.forEach((key, index) => {
              const isLast = index === dedupedMatches.length - 1
              const arg = key + (isLast ? '' : ',')
              fn += arg
              awaitFn += arg
              chainedFn += arg
              chainedAwaitFn += arg
            })

            fn += ')'
            awaitFn += ')'
            chainedFn += ', injection_return)'
            chainedAwaitFn += ', injection_return)'
          }
          else {
            fn += ('()')
            awaitFn += ('()')
            chainedFn += '(injection_return)'
            chainedAwaitFn += '(injection_return)'
          }

          injections.push(
            `// ${path}`,
            fn,
          )
          asyncInjections.push(
            `// ${path}`,
            awaitFn,
          )
          chainedInjections.push(
            `// ${path}`,
            chainedFn,
          )
          chainedAsyncInjections.push(
            `// ${path}`,
            chainedAwaitFn,
          )
        })

        code = code.replace('/* __imports__ */', imports.join('\n'))
        code = code.replace('/* __injections__ */', injections.join('\n'))
        code = code.replace('/* __async_injections__ */', asyncInjections.join('\n'))
        code = code.replace('/* __chained_injections__ */', chainedInjections.join('\n'))
        code = code.replace('/* __chained_async_injections__ */', chainedAsyncInjections.join('\n'))
        return code
      }

      return null
    },
  }
}
