import { resolve, dirname } from 'path'
import { slash } from '@antfu/utils'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '..'
import { resolveImportPath } from '../utils'

export function createWindiCSSPlugin(
  { themeRoots, clientRoot, userRoot }: ResolvedSlidevOptions,
  { windicss: windiOptions }: SlidevPluginOptions,
) {
  return WindiCSS(
    {
      configFiles: [
        ...defaultConfigureFiles,
        ...themeRoots.map(i => `${i}/windi.config.ts`),
        resolve(clientRoot, 'windi.config.ts'),
      ],
      onOptionsResolved(config) {
        config.scanOptions.include.push(`!${slash(resolve(userRoot, 'node_modules'))}`)
        config.scanOptions.exclude.push(dirname(resolveImportPath('monaco-editor/package.json', true)))
        config.scanOptions.exclude.push(dirname(resolveImportPath('katex/package.json', true)))
      },
      ...windiOptions,
    },
    {
      hookOptions: {
        ignoreNodeModules: false,
      },
    },
  )
}
