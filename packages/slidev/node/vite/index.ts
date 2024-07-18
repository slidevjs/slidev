import { join } from 'node:path'
import { existsSync } from 'node:fs'
import process from 'node:process'
import type { Plugin } from 'vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import ServerRef from 'vite-plugin-vue-server-ref'
import { notNullish } from '@antfu/utils'
import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import { loadDrawings, writeDrawings } from '../integrations/drawings'
import { createConfigPlugin } from './extendConfig'
import { createSlidesLoader } from './loaders'
import { createUnocssPlugin } from './unocss'
import { createMarkdownPlugin } from './markdown'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'
import { createMonacoTypesLoader } from './monacoTypes'
import { createVuePlugin } from './vue'
import { createMonacoWriter } from './monacoWrite'
import { createLayoutWrapperPlugin } from './layoutWrapper'
import { createContextInjectionPlugin } from './contextInjection'
import { createHmrPatchPlugin } from './hmrPatch'

export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
  serverOptions: SlidevServerOptions = {},
): Promise<Plugin[]> {
  const {
    components: componentsOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
    serverRef: serverRefOptions = {},
  } = pluginOptions

  const {
    mode,
    themeRoots,
    addonRoots,
    roots,
    data: { config },
  } = options

  const drawingData = await loadDrawings(options)

  const publicRoots = [...themeRoots, ...addonRoots].map(i => join(i, 'public')).filter(existsSync)

  const plugins = [
    createSlidesLoader(options, serverOptions),
    createMarkdownPlugin(options, pluginOptions),
    createLayoutWrapperPlugin(options),
    createContextInjectionPlugin(),
    createVuePlugin(options, pluginOptions),
    createHmrPatchPlugin(),

    Components({
      extensions: ['vue', 'md', 'js', 'ts', 'jsx', 'tsx'],

      dirs: [
        join(options.clientRoot, 'builtin'),
        ...roots.map(i => join(i, 'components')),
        'src/components',
        'components',
        join(process.cwd(), 'components'),
      ],

      include: [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/, /\.md$/, /\.md\?vue/],
      exclude: [],

      resolvers: [
        IconsResolver({
          prefix: '',
          customCollections: Object.keys(iconsOptions.customCollections || []),
        }),
      ],

      dts: false,

      ...componentsOptions,
    }),

    Icons({
      defaultClass: 'slidev-icon',
      collectionsNodeResolvePath: options.cliRoot,
      ...iconsOptions,
    }),

    (config.remoteAssets === true || config.remoteAssets === mode)
      ? import('vite-plugin-remote-assets').then(r => r.VitePluginRemoteAssets({
        rules: [
          ...r.DefaultRules,
          {
            match: /\b(https?:\/\/image.unsplash\.com.*?)(?=[`'")\]])/gi,
            ext: '.png',
          },
        ],
        resolveMode: id => id.endsWith('index.html') ? 'relative' : '@fs',
        awaitDownload: mode === 'build',
        ...remoteAssetsOptions,
      }))
      : null,

    ServerRef({
      debug: false, // process.env.NODE_ENV === 'development',
      state: {
        sync: false,
        nav: {
          page: 0,
          clicks: 0,
        },
        drawings: drawingData,
        ...serverRefOptions.state,
      },
      onChanged(key, data, patch, timestamp) {
        if (serverRefOptions.onChanged)
          serverRefOptions.onChanged(key, data, patch, timestamp)
        if (!options.data.config.drawings.persist)
          return
        if (key === 'drawings')
          writeDrawings(options, patch ?? data)
      },
    }),

    createConfigPlugin(options),
    createMonacoTypesLoader(options),
    createMonacoWriter(options),
    createVueCompilerFlagsPlugin(options),
    createUnocssPlugin(options, pluginOptions),

    publicRoots.length
      ? import('vite-plugin-static-copy').then(r => r.viteStaticCopy({
        silent: true,
        targets: publicRoots.map(r => ({
          src: `${r}/*`,
          dest: 'theme',
        })),
      }))
      : null,
    options.inspect
      ? import('vite-plugin-inspect').then(r => (r.default || r)({
        dev: true,
        build: true,
      }))
      : null,
  ]

  return (await Promise.all(plugins))
    .flat()
    .filter(notNullish)
}
