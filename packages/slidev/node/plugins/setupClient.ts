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
        const name = id
          .slice(setupEntry.length + 1)
          .replace(/\?.*$/, '') // remove query

        const imports: string[] = []
        const injections: string[] = []

        const setups = uniq([
          ...themeRoots,
          ...addonRoots,
          userRoot,
        ]).map(i => join(i, 'setup', name))

        setups.forEach((path, idx) => {
          if (!existsSync(path))
            return

          imports.push(`import __n${idx} from '${toAtFS(path)}'`)

          let fn = `:AWAIT:__n${idx}`

          if (/\binjection_return\b/g.test(code))
            fn = `injection_return = ${fn}`

          if (/\binjection_arg\b/g.test(code)) {
            fn += '('
            const matches = Array.from(code.matchAll(/\binjection_arg(_\d+)?\b/g))
            const dedupedMatches = Array.from(new Set(matches.map(m => m[0])))
            fn += dedupedMatches.join(', ')
            fn += ', :LAST:)'
          }
          else {
            fn += '(:LAST:)'
          }

          injections.push(
            `// ${path}`,
            fn,
          )
        })

        function getInjections(isAwait = false, isChained = false): string {
          return injections.join('\n')
            .replace(/:AWAIT:/g, isAwait ? 'await ' : '')
            .replace(/(,\s*)?:LAST:/g, isChained ? '$1injection_return' : '')
        }

        code = code.replace('/* __imports__ */', imports.join('\n'))
        code = code.replace('/* __injections__ */', getInjections())
        code = code.replace('/* __async_injections__ */', getInjections(true))
        code = code.replace('/* __chained_injections__ */', getInjections(false, true))
        code = code.replace('/* __chained_async_injections__ */', getInjections(true, true))
        return code
      }

      return null
    },
  }
}
