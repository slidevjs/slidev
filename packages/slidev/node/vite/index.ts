import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import type { PluginOption } from 'vite'
import setupShiki from '../setups/shiki'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'
import { createComponentsPlugin } from './components'
import { createContextInjectionPlugin } from './contextInjection'
import { createConfigPlugin } from './extendConfig'
import { createHmrPatchPlugin } from './hmrPatch'
import { createIconsPlugin } from './icons'
import { createInspectPlugin } from './inspect'
import { createLayoutWrapperPlugin } from './layoutWrapper'
import { createSlidesLoader } from './loaders'
import { createMarkdownPlugin } from './markdown'
import { createMonacoTypesLoader } from './monacoTypes'
import { createMonacoWriterPlugin } from './monacoWrite'
import { createRemoteAssetsPlugin } from './remoteAssets'
import { createServerRefPlugin } from './serverRef'
import { createUnocssPlugin } from './unocss'
import { createVuePlugin } from './vue'
import { createStaticCopyPlugin } from './staticCopy'

export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions = {},
  serverOptions: SlidevServerOptions = {},
): Promise<PluginOption[]> {
  const shiki = await setupShiki(options)
  return Promise.all([
    createSlidesLoader(options, serverOptions, shiki),
    createMarkdownPlugin(options, pluginOptions, shiki),
    createLayoutWrapperPlugin(options),
    createContextInjectionPlugin(),
    createVuePlugin(options, pluginOptions),
    createHmrPatchPlugin(),
    createComponentsPlugin(options, pluginOptions),
    createIconsPlugin(options, pluginOptions),
    createRemoteAssetsPlugin(options, pluginOptions),
    createServerRefPlugin(options, pluginOptions),
    createConfigPlugin(options),
    createMonacoTypesLoader(options),
    createMonacoWriterPlugin(options),
    createVueCompilerFlagsPlugin(options),
    createUnocssPlugin(options, pluginOptions),
    createStaticCopyPlugin(options, pluginOptions),
    createInspectPlugin(options, pluginOptions),
  ])
}
