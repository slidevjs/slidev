
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
import { notNullish } from '@antfu/utils'
import { ResolvedSlidevOptions, SlidevPluginOptions } from '../options'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './loaders'
import { createMonacoTypesLoader } from './monaco'
import { createEntryPlugin } from './entry'
import { createClientSetupPlugin } from './setupClient'
import VitePluginServerRef from './server-ref'
import { createMarkdownPlugin } from './markdown'
import { createWindiCSSPlugin } from './windicss'
import { createFixPlugins } from './fix'

export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
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

  return [
    createWindiCSSPlugin(options, pluginOptions),
    await createMarkdownPlugin(options, pluginOptions),

    Vue({
      include: [/\.vue$/, /\.md$/],
      ...vueOptions,
    }),

    ViteComponents({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        `${clientRoot}/builtin`,
        `${clientRoot}/components`,
        ...themeRoots.map(i => `${i}/components`),
        'src/components',
        'components',
      ],

      customLoaderMatcher: id => id.endsWith('.md'),

      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: '',
        }),
      ],

      ...componentsOptions,
    }),

    ViteIcons({
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

    VitePluginServerRef({
      dataMap: {
        sync: false,
        state: {
          page: 0,
          tab: 0,
        },
      },
    }),
    createConfigPlugin(options),
    createEntryPlugin(options),
    createSlidesLoader(options, pluginOptions),
    createClientSetupPlugin(options),
    createMonacoTypesLoader(),
    createFixPlugins(options),
  ]
    .flat()
    .filter(notNullish)
}
