import { existsSync } from 'fs'
import { join, resolve, basename } from 'path'
import { Plugin } from 'vite'
import fg from 'fast-glob'
import { ResolvedViteSlidesOptions } from './options'

export function createEntryPlugin({ packageRoot, themeRoot, userRoot }: ResolvedViteSlidesOptions): Plugin {
  const mainEntry = resolve(packageRoot, 'client/main.ts')

  return {
    name: 'aslide:entry',
    enforce: 'pre',
    async transform(code, id) {
      if (id === mainEntry) {
        const imports: string[] = []
        const layouts: Record<string, string> = {}

        async function scanStyle(root: string) {
          const styles = [
            join(root, 'styles/index.ts'),
            join(root, 'styles/index.js'),
            join(root, 'styles/index.css'),
            join(root, 'styles.css'),
            join(root, 'style.css'),
          ]

          for (const style of styles) {
            if (existsSync(style)) {
              imports.push(`import "/@fs${style}"`)
              return
            }
          }
        }

        async function scanLayouts(root: string) {
          const layoutPaths = await fg('layouts/*.{vue,ts}', {
            cwd: root,
            absolute: true,
          })

          for (const layoutPath of layoutPaths) {
            const layout = basename(layoutPath).replace(/\.\w+$/, '')
            if (layouts[layout])
              continue
            imports.push(`import __layout_${layout} from "/@fs${layoutPath}"`)
            layouts[layout] = `__layout_${layout}`
          }
        }

        await scanStyle(themeRoot)
        await scanStyle(userRoot)

        await scanLayouts(join(packageRoot, 'client'))
        await scanLayouts(themeRoot)
        await scanLayouts(userRoot)

        code = code.replace('/* __imports__ */', imports.join('\n'))
        code = code.replace('/* __layouts__ */', `{${Object.entries(layouts).map(([k, v]) => `"${k}": ${v}`).join(',\n')}}`)
        return code
      }

      return null
    },
  }
}
