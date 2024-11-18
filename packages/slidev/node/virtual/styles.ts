import type { VirtualModuleTemplate } from './types'
import { existsSync } from 'node:fs'

import { join } from 'node:path'
import { resolveImportUrl, toAtFS } from '../resolver'

export const templateStyle: VirtualModuleTemplate = {
  id: '/@slidev/styles',
  async getContent({ data, clientRoot, roots }) {
    function resolveUrlOfClient(name: string) {
      return toAtFS(join(clientRoot, name))
    }

    const imports: string[] = [
      `import "${resolveUrlOfClient('styles/vars.css')}"`,
      `import "${resolveUrlOfClient('styles/index.css')}"`,
      `import "${resolveUrlOfClient('styles/code.css')}"`,
      `import "${resolveUrlOfClient('styles/katex.css')}"`,
      `import "${resolveUrlOfClient('styles/transitions.css')}"`,
    ]

    for (const root of roots) {
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
          continue
        }
      }
    }

    if (data.features.katex)
      imports.push(`import "${await resolveImportUrl('katex/dist/katex.min.css')}"`)

    if (data.config.highlighter === 'shiki') {
      imports.push(
        `import "${await resolveImportUrl('@shikijs/vitepress-twoslash/style.css')}"`,
        `import "${resolveUrlOfClient('styles/shiki-twoslash.css')}"`,
        `import "${await resolveImportUrl('shiki-magic-move/style.css')}"`,
      )
    }

    imports.unshift(
      `import "${await resolveImportUrl('@unocss/reset/tailwind.css')}"`,
      'import "uno:preflights.css"',
      'import "uno:typography.css"',
      'import "uno:shortcuts.css"',
    )
    imports.push('import "uno.css"')

    return imports.join('\n')
  },
}
