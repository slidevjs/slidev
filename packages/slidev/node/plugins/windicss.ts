import { resolve } from 'path'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '..'

export function createWindiCSSPlugin(
  { themeRoots, clientRoot }: ResolvedSlidevOptions,
  { windicss: windiOptions }: SlidevPluginOptions,
) {
  return WindiCSS(
    {
      configFiles: [
        ...defaultConfigureFiles,
        ...themeRoots.map(i => `${i}/windi.config.ts`),
        resolve(clientRoot, 'windi.config.ts'),
      ],
      ...windiOptions,
    },
    {
      hookOptions: {
        ignoreNodeModules: false,
      },
    },
  )
}
