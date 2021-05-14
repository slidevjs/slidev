import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { slash } from '@antfu/utils'
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

        const setups = [
          ...themeRoots,
          userRoot,
        ].map(i => join(i, 'setup', name))

        setups.forEach((path, idx) => {
          if (!existsSync(path))
            return

          imports.push(`import __n${idx} from '${toAtFS(path)}'`)
          injections.push(
            `// ${path}`,
            `injection_return = __n${idx}()`,
          )
          asyncInjections.push(
            `// ${path}`,
            `await __n${idx}(injection_arg)`,
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
