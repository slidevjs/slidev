import { join } from 'path'
import { slash } from '@antfu/utils'
import type { Plugin } from 'vite'
import { resolvePackageData } from 'vite'

export function createMonacoTypesLoader(): Plugin {
  return {
    name: 'slidev:monaco-types-loader',

    resolveId(id) {
      if (id.startsWith('/@slidev-monaco-types/'))
        return id
      return null
    },

    load(id) {
      const match = id.match(/^\/\@slidev-monaco-types\/(.*)$/)
      if (match) {
        const pkg = match[1]
        const info = resolvePackageData(pkg, process.cwd())
        if (!info)
          return

        const typePath = info.data.types || info.data.typings
        if (!typePath)
          return ''

        return [
          'import * as monaco from \'monaco-editor\'',
          `import Type from "${slash(join(info.dir, typePath))}?raw"`,
          ...Object.keys(info.data.dependencies || {}).map(i => `import "/@slidev-monaco-types/${i}"`),
          `monaco.languages.typescript.typescriptDefaults.addExtraLib(\`declare module "${pkg}" { \$\{Type\} }\`)`,
        ].join('\n')
      }
    },
  }
}
