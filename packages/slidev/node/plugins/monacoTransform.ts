import { dirname, join } from 'node:path'
import fs from 'node:fs/promises'
import process from 'node:process'
import { slash } from '@antfu/utils'
import type { Plugin } from 'vite'
import { findDepPkgJsonPath } from 'vitefu'

async function getPackageData(pkg: string) {
  const pkgJsonPath = await findDepPkgJsonPath(pkg, process.cwd())
  if (!pkgJsonPath)
    return

  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'))

  const typePath = pkgJson.types || pkgJson.typings
  if (!typePath)
    return

  return [dirname(pkgJsonPath), pkgJson, typePath]
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

        const [pkgDir, pkgJson, typePath] = packageData

        return [
          'import * as monaco from \'monaco-editor\'',
          `import Type from "${slash(join(pkgDir, typePath))}?raw"`,
          ...Object.keys(pkgJson.dependencies || {}).map(i => `import "/@slidev-monaco-types/${i}"`),
          `monaco.languages.typescript.typescriptDefaults.addExtraLib(\`declare module "${pkg}" { \$\{Type\} }\`)`,
        ].join('\n')
      }
    },
  }
}
