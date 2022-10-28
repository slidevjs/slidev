import { join } from 'path'
import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
import ServerRef from 'vite-plugin-vue-server-ref'
import { notNullish } from '@antfu/utils'
import Inspect from 'vite-plugin-inspect'
import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '../options'
import { loadDrawings, writeDrawings } from '../drawings'
import { createConfigPlugin } from './extendConfig'
import { createSlidesLoader } from './loaders'
import { createMonacoTypesLoader } from './monacoTransform'
import { createClientSetupPlugin } from './setupClient'
import { createMarkdownPlugin } from './markdown'
import { createWindiCSSPlugin } from './windicss'
import { createFixPlugins } from './patchTransform'
import { createUnocssPlugin } from './unocss'

const customElements = new Set([
  // katex
  'annotation',
  'math',
  'menclose',
  'mfrac',
  'mglyph',
  'mi',
  'mlabeledtr',
  'mn',
  'mo',
  'mover',
  'mpadded',
  'mphantom',
  'mroot',
  'mrow',
  'mspace',
  'msqrt',
  'mstyle',
  'msub',
  'msubsup',
  'msup',
  'mtable',
  'mtd',
  'mtext',
  'mtr',
  'munder',
  'munderover',
  'semantics',
])

export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
  serverOptions: SlidevServerOptions = {},
): Promise<Plugin[]> {
  const {
    vue: vueOptions = {},
    components: componentsOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
    serverRef: serverRefOptions = {},
  } = pluginOptions

  const {
    mode,
    themeRoots,
    addonRoots,
    clientRoot,
    data: { config },
  } = options

  const VuePlugin = Vue({
    include: [/\.vue$/, /\.md$/],
    exclude: [],
    template: {
      compilerOptions: {
        isCustomElement(tag) {
          return customElements.has(tag)
        },
      },
      ...vueOptions?.template,
    },
    ...vueOptions,
  })

  const MarkdownPlugin = await createMarkdownPlugin(options, pluginOptions)

  const drawingData = await loadDrawings(options)

  return [
    config.css === 'unocss'
      ? await createUnocssPlugin(options, pluginOptions)
      : await createWindiCSSPlugin(options, pluginOptions),
    MarkdownPlugin,
    VuePlugin,

    createSlidesLoader(options, pluginOptions, serverOptions, VuePlugin, MarkdownPlugin),

    Components({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        join(clientRoot, 'builtin'),
        join(clientRoot, 'components'),
        ...themeRoots.map(i => join(i, 'components')),
        ...addonRoots.map(i => join(i, 'components')),
        'src/components',
        'components',
      ],

      include: [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/, /\.md$/],
      exclude: [],

      resolvers: [
        IconsResolver({
          prefix: '',
          customCollections: Object.keys(iconsOptions.customCollections || []),
        }),
      ],

      ...componentsOptions,
    }),

    Icons({
      defaultClass: 'slidev-icon',
      autoInstall: true,
      ...iconsOptions,
    }),

    (config.remoteAssets === true || config.remoteAssets === mode)
      ? RemoteAssets({
        rules: [
          ...DefaultRules,
          {
            match: /\b(https?:\/\/image.unsplash\.com.*?)(?=[`'")\]])/ig,
            ext: '.png',
          },
        ],
        resolveMode: id => id.endsWith('index.html') ? 'relative' : '@fs',
        awaitDownload: mode === 'build',
        ...remoteAssetsOptions,
      })
      : null,

    ServerRef({
      debug: process.env.NODE_ENV === 'development',
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
        serverRefOptions.onChanged && serverRefOptions.onChanged(key, data, patch, timestamp)
        if (!options.data.config.drawings.persist)
          return
        if (key === 'drawings')
          writeDrawings(options, patch ?? data)
      },
    }),

    createConfigPlugin(options),
    createClientSetupPlugin(options),
    createMonacoTypesLoader(),
    createFixPlugins(options),

    options.inspect
      ? Inspect({
        dev: true,
        build: true,
      })
      : null,
  ]
    .flat()
    .filter(notNullish)
}
