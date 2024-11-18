import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { slash } from '@antfu/utils'
import fg from 'fast-glob'
import { findDepPkgJsonPath } from 'vitefu'
import { toAtFS } from '../resolver'

export function createMonacoTypesLoader({ userRoot, utils }: ResolvedSlidevOptions): Plugin {
  return {
    name: 'slidev:monaco-types-loader',

    resolveId(id) {
      if (id.startsWith('/@slidev-monaco-types/'))
        return id
      return null
    },

    async load(id) {
      if (!id.startsWith('/@slidev-monaco-types/'))
        return null

      const url = new URL(id, 'http://localhost')
      if (url.pathname === '/@slidev-monaco-types/resolve') {
        const query = new URLSearchParams(url.search)
        const pkg = query.get('pkg')!
        const importer = query.get('importer') ?? userRoot

        const pkgJsonPath = await findDepPkgJsonPath(pkg, importer)
        if (!pkgJsonPath)
          throw new Error(`Package "${pkg}" not found in "${importer}"`)
        const root = slash(dirname(pkgJsonPath))

        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'))
        let deps = Object.keys(pkgJson.dependencies ?? {})
        deps = deps.filter(pkg => !utils.isMonacoTypesIgnored(pkg))

        return [
          `import "/@slidev-monaco-types/load?${new URLSearchParams({ root, name: pkgJson.name })}"`,
          ...deps.map(dep => `import "/@slidev-monaco-types/resolve?${new URLSearchParams({ pkg: dep, importer: root })}"`),
        ].join('\n')
      }

      if (url.pathname === '/@slidev-monaco-types/load') {
        const query = new URLSearchParams(url.search)
        const root = query.get('root')!
        const name = query.get('name')!
        const files = await fg(
          [
            '**/*.ts',
            '**/*.mts',
            '**/*.cts',
            'package.json',
          ],
          {
            cwd: root,
            followSymbolicLinks: true,
            ignore: ['**/node_modules/**'],
          },
        )

        if (!files.length)
          return '/** No files found **/'

        return [
          'import { addFile } from "@slidev/client/setup/monaco.ts"',
          ...files.map(file => `addFile(() => import(${
            JSON.stringify(`${toAtFS(resolve(root, file))}?monaco-types&raw`)
          }), ${JSON.stringify(`node_modules/${name}/${file}`)})`),
        ].join('\n')
      }
    },
  }
}
