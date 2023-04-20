import { join } from 'node:path'
import { slash } from '@antfu/utils'
import type { Plugin } from 'vite'

async function getPackageData(pkg: string) {
  const { resolvePackageData } = await import('vite')
  const info = resolvePackageData(pkg, process.cwd())
  if (!info)
    return

  const typePath = info.data.types || info.data.typings
  if (!typePath)
    return

  return [info, typePath]
}

export function createMonacoTypesLoader(): Plugin {
  return {
    name: 'slidev:monaco-types-loader',

    resolveId(id) {
      if (id.startsWith('/@slidev-monaco-types/'))
        return id
      return null
    },

    async load(id) {
      const match = id.match(/^\/\@slidev-monaco-types\/(.*)$/)
      if (match) {
        const pkg = match[1]
        const packageData = await getPackageData(pkg) || await getPackageData(`@types/${pkg}`)
        if (!packageData)
          return

        const [info, typePath] = packageData

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
