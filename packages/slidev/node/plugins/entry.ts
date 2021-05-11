import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { slash } from '@antfu/utils'
import { Plugin } from 'vite'
import { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../utils'

export function createEntryPlugin({ clientRoot, themeRoots, userRoot }: ResolvedSlidevOptions): Plugin {
  const mainEntry = slash(resolve(clientRoot, 'main.ts'))

  return {
    name: 'slidev:entry',
    enforce: 'pre',
    async transform(code, id) {
      if (id === mainEntry) {
        const imports: string[] = []
        const body: string[] = []

        async function scanStyle(root: string) {
          const styles = [
            join(root, 'styles', 'index.ts'),
            join(root, 'styles', 'index.js'),
            join(root, 'styles', 'index.css'),
            join(root, 'styles.css'),
            join(root, 'style.css'),
          ]

          for (const style of styles) {
            if (existsSync(style)) {
              imports.push(`import "${toAtFS(style)}"`)
              return
            }
          }
        }
        const roots = [
          ...themeRoots,
          userRoot,
        ]

        for (const root of roots)
          await scanStyle(root)

        code = code.replace('/* __imports__ */', imports.join('\n'))
        code = code.replace('/* __body__ */', body.join('\n'))
        return code
      }

      return null
    },
  }
}
