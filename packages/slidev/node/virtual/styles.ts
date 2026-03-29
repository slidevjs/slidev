import type { VirtualModuleTemplate } from './types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveImportUrl, toAtFS } from '../resolver'
import { makeAbsoluteImportGlob } from '../utils'

export const templateStyle: VirtualModuleTemplate = {
  id: '/@slidev/styles',
  async getContent({ data, clientRoot, userRoot, roots }) {
    function resolveUrlOfClient(name: string) {
      return toAtFS(join(clientRoot, name))
    }

    const imports: string[] = [
      `import "${await resolveImportUrl('@unocss/reset/tailwind.css')}"`,
      'import "uno:preflights.css"',
      'import "uno:typography.css"',
      'import "uno:shortcuts.css"',
    ]

    // Default client styles - use direct imports to ensure correct order
    const clientStyles = [
      'styles/vars.css',
      'styles/index.css',
      'styles/code.css',
      'styles/katex.css',
      'styles/transitions.css',
    ]
    for (const style of clientStyles) {
      imports.push(`import "${resolveUrlOfClient(style)}"`)
    }

    // User styles - use direct imports to ensure correct order
    // Check for files in the order they should be imported
    for (const root of roots) {
      const userStyles = [
        join(root, 'styles', 'index.ts'),
        join(root, 'styles', 'index.js'),
        join(root, 'styles', 'index.css'),
        join(root, 'styles.css'),
        join(root, 'style.css'),
      ]
      for (const style of userStyles) {
        if (existsSync(style)) {
          imports.push(`import "${toAtFS(style)}"`)
          break // Only import the first one found
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

    imports.push('import "uno.css"')

    return imports.join('\n')
  },
}
