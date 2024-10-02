import { builtinModules } from 'node:module'
import { join, resolve } from 'node:path'

import fg from 'fast-glob'
import { uniq } from '@antfu/utils'
import { toAtFS } from '../resolver'
import type { VirtualModuleTemplate } from './types'

export const templateMonacoTypes: VirtualModuleTemplate = {
  id: '/@slidev/monaco-types',
  getContent: async ({ userRoot, data, utils }) => {
    if (!data.features.monaco)
      return ''
    const typesRoot = join(userRoot, 'snippets')
    const files = await fg(['**/*.ts', '**/*.mts', '**/*.cts'], { cwd: typesRoot })
    let result = 'import { addFile } from "@slidev/client/setup/monaco.ts"\n'

    // User snippets
    for (const file of files) {
      const url = `${toAtFS(resolve(typesRoot, file))}?monaco-types&raw`
      result += `addFile(() => import(${JSON.stringify(url)}), ${JSON.stringify(file)})\n`
    }

    // Copied from https://github.com/microsoft/TypeScript-Website/blob/v2/packages/ata/src/edgeCases.ts
    // Converts some of the known global imports to node so that we grab the right info
    function mapModuleNameToModule(moduleSpecifier: string) {
      if (moduleSpecifier.startsWith('node:'))
        return 'node'
      if (builtinModules.includes(moduleSpecifier))
        return 'node'
      const mainPackageName = moduleSpecifier.split('/')[0]
      if (builtinModules.includes(mainPackageName) && !mainPackageName.startsWith('@'))
        return 'node'

      // strip module filepath e.g. lodash/identity => lodash
      const [a = '', b = ''] = moduleSpecifier.split('/')
      const moduleName = a.startsWith('@') ? `${a}/${b}` : a

      return moduleName
    }

    // Dependencies
    let deps = [...data.config.monacoTypesAdditionalPackages]
    if (data.config.monacoTypesSource === 'local')
      deps.push(...data.features.monaco.types)

    deps = uniq(deps.map((specifier) => {
      if (specifier[0] === '.')
        return ''
      return mapModuleNameToModule(specifier)
    }).filter(Boolean))
    deps = deps.filter(pkg => !utils.isMonacoTypesIgnored(pkg))

    for (const pkg of deps) {
      result += `import(${JSON.stringify(`/@slidev-monaco-types/resolve?${new URLSearchParams({ pkg })}`)})\n`
    }

    return result
  },
}
