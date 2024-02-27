import fs from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { slash } from '@antfu/utils'
import fg from 'fast-glob'
import type { Plugin } from 'vite'
import { findDepPkgJsonPath } from 'vitefu'
import type { ResolvedSlidevOptions } from '../options'
import { toAtFS } from '../resolver'

export function createMonacoTypesLoader({ userRoot }: ResolvedSlidevOptions): Plugin {
  const resolvedDepsMap: Record<string, Set<string>> = {}

  return {
    name: 'slidev:monaco-types-loader',

    resolveId(id) {
      if (id.startsWith('/@slidev-monaco-types/'))
        return id
      return null
    },

    async load(id) {
      const matchResolve = id.match(/^\/\@slidev-monaco-types\/resolve\?pkg=(.*?)(?:&importer=(.*))?$/)
      if (matchResolve) {
        const [_, pkg, importer = userRoot] = matchResolve

        const resolvedDeps = resolvedDepsMap[importer] ??= new Set()
        if (resolvedDeps.has(pkg))
          return ''
        resolvedDeps.add(pkg)

        const pkgJsonPath = await findDepPkgJsonPath(pkg, importer)
        if (!pkgJsonPath)
          throw new Error(`Package "${pkg}" not found in "${importer}"`)
        const root = dirname(pkgJsonPath)

        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'))
        const deps = pkgJson.dependencies ?? {}

        return [
          `import "/@slidev-monaco-types/load?root=${slash(root)}&name=${pkgJson.name}"`,
          ...Object.keys(deps).map(dep => `import "/@slidev-monaco-types/resolve?pkg=${dep}&importer=${slash(root)}"`),
        ].join('\n')
      }

      const matchLoad = id.match(/^\/\@slidev-monaco-types\/load\?root=(.*?)&name=(.*)$/)
      if (matchLoad) {
        const [_, root, name] = matchLoad
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
          return ''

        return [
          'import * as monaco from \'monaco-editor\'',
          'async function addFile(mod, subPath) {',
          '  const code = (await mod).default',
          `  const path = ${JSON.stringify(`/node_modules/${name}/`)} + subPath`,
          '  monaco.languages.typescript.typescriptDefaults.addExtraLib(code, "file://" + path)',
          '  monaco.editor.createModel(code, "javascript", monaco.Uri.file(path))',
          '}',
          ...files.map(file => `addFile(import(${JSON.stringify(`${toAtFS(resolve(root, file))}?monaco-types&raw`)}), ${JSON.stringify(file)})`),
        ].join('\n')
      }
    },
  }
}
