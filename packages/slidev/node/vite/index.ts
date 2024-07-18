import type { PluginOption } from 'vite'
import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import { createConfigPlugin } from './extendConfig'
import { createSlidesLoader } from './loaders'
import { createUnocssPlugin } from './unocss'
import { createMarkdownPlugin } from './markdown'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'
import { createMonacoTypesLoader } from './monacoTypes'
import { createVuePlugin } from './vue'
import { createMonacoWriterPlugin } from './monacoWrite'
import { createComponentsPlugin } from './components'
import { createIconsPlugin } from './icons'
import { createRemoteAssetsPlugin } from './remoteAssets'
import { createServerRefPlugin } from './serverRef'
import { createInspectPlugin } from './inspect'

export function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions = {},
  serverOptions: SlidevServerOptions = {},
): Promise<PluginOption[]> {
  return Promise.all([
    createMarkdownPlugin(options, pluginOptions),
    createVuePlugin(options, pluginOptions),
    createSlidesLoader(options, pluginOptions, serverOptions),
    createMonacoWriterPlugin(options),
    createComponentsPlugin(options, pluginOptions),
    createIconsPlugin(options, pluginOptions),
    createRemoteAssetsPlugin(options, pluginOptions),
    createServerRefPlugin(options, pluginOptions),
    createConfigPlugin(options),
    createMonacoTypesLoader(options),
    createVueCompilerFlagsPlugin(options),
    createUnocssPlugin(options, pluginOptions),
    createInspectPlugin(options, pluginOptions),
  ])
}
