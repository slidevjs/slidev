
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
import ServerRef from 'vite-plugin-vue-server-ref'
import { notNullish } from '@antfu/utils'
import { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '../options'
import { loadDrawings, writeDarwings } from '../drawings'
import { createConfigPlugin } from './extendConfig'
import { createSlidesLoader } from './loaders'
import { createMonacoTypesLoader } from './monacoTransform'
import { createClientSetupPlugin } from './setupClient'
import { createMarkdownPlugin } from './markdown'
import { createWindiCSSPlugin } from './windicss'
import { createFixPlugins } from './patchTransform'

const customElements = new Set([
  // katex
  'annotation',
  'math',
  'mrow',
  'mcol',
  'mfrac',
  'mi',
  'mn',
  'mo',
  'mover',
  'mspace',
  'mtable',
  'mtd',
  'msup',
  'msqrt',
  'mtr',
  'semantics',
  'mstyle',
  'mtext',
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
  } = pluginOptions

  const {
    mode,
    themeRoots,
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
    await createWindiCSSPlugin(options, pluginOptions),
    MarkdownPlugin,
    VuePlugin,

    createSlidesLoader(options, pluginOptions, serverOptions, VuePlugin, MarkdownPlugin),

    Components({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        `${clientRoot}/builtin`,
        `${clientRoot}/components`,
        ...themeRoots.map(i => `${i}/components`),
        'src/components',
        'components',
      ],

      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
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
      },
      onChanged(key, data, patch) {
        if (!options.data.config.drawings.persist)
          return
        if (key === 'drawings')
          writeDarwings(options, patch ?? data)
      },
    }),

    createConfigPlugin(options),
    createClientSetupPlugin(options),
    createMonacoTypesLoader(),
    createFixPlugins(options),
  ]
    .flat()
    .filter(notNullish)
}
