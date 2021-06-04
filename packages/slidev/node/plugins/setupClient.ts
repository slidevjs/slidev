import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { slash, uniq } from '@antfu/utils'
import { Plugin } from 'vite'
import { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../utils'

export function createClientSetupPlugin({ clientRoot, themeRoots, userRoot }: ResolvedSlidevOptions): Plugin {
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

        const setups = uniq([
          ...themeRoots,
          userRoot,
        ]).map(i => join(i, 'setup', name))

        setups.forEach((path, idx) => {
          if (!existsSync(path))
            return

          imports.push(`import __n${idx} from '${toAtFS(path)}'`)

          let fn = `__n${idx}`
          let awaitFn = `await __n${idx}`

          if (/\binjection_return\b/g.test(code)) {
            fn = `injection_return = ${fn}`
            awaitFn = `injection_return = ${awaitFn}`
          }
          if (/\binjection_arg\b/g.test(code)) {
            fn += ('(injection_arg)')
            awaitFn += ('(injection_arg)')
          }
          else {
            fn += ('()')
            awaitFn += ('()')
          }

          injections.push(
            `// ${path}`,
            fn,
          )
          asyncInjections.push(
            `// ${path}`,
            awaitFn,
          )
        })

        code = code.replace('/* __imports__ */', imports.join('\n'))
        code = code.replace('/* __injections__ */', injections.join('\n'))
        code = code.replace('/* __async_injections__ */', asyncInjections.join('\n'))
        return code
      }

      return null
    },
  }
}
