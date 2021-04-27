
import { resolve } from 'path'
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { notNullish } from '@antfu/utils'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './loaders'
import { createMonacoLoader, transformMarkdownMonaco, truncateMancoMark } from './monaco'
import { createEntryPlugin } from './entry'
import { ResolvedSlidevOptions, SlidevPluginOptions } from './options'
import { createSetupPlugin } from './setups'
import VitePluginVueFactory, { VueFactoryResolver } from './factory'
import VitePluginServerRef from './server-ref'

export function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
): Plugin[] {
  const {
    vue: vueOptions = {},
    markdown: mdOptions = {},
    components: componentsOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
    windicss: windiOptions = {},
  } = pluginOptions

  const {
    mode,
    themeRoots,
    clientRoot,
    data: { config },
  } = options

  const DEV = mode === 'dev' ? 'true' : 'false'

  return [
    <Plugin>{
      name: 'transform',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.vue'))
          return code.replaceAll('__DEV__', DEV)
      },
    },

    Vue({
      include: [/\.vue$/, /\.md$/],
      ...vueOptions,
    }),

    Markdown({
      wrapperClasses: '',
      headEnabled: true,
      markdownItOptions: {
        quotes: '""\'\'',
        html: true,
        xhtmlOut: true,
        linkify: true,
      },
      markdownItSetup(md) {
        md.use(mila, {
          attrs: {
            target: '_blank',
            rel: 'noopener',
          },
        })
        md.use(Prism)
      },
      transforms: {
        before: (config.monaco === true || (config.monaco === 'dev-only' && mode === 'dev'))
          ? transformMarkdownMonaco
          : truncateMancoMark,
      },
      ...mdOptions,
    }),

    <Plugin>{
      name: 'slidev:vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    },

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
        VueFactoryResolver,
      ],

      ...componentsOptions,
    }),

    ViteIcons({
      ...iconsOptions,
    }),

    WindiCSS(
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
    ),

    ((config.remoteAssets === true) || (config.remoteAssets === 'dev-only' && mode === 'dev'))
      ? RemoteAssets({
        rules: [
          ...DefaultRules,
          {
            match: /\b(https?:\/\/image.unsplash\.com.*?)(?=[`'")\]])/ig,
            ext: '.png',
          },
        ],
        resolveMode: '@fs',
        ...remoteAssetsOptions,
      })
      : null,

    VitePluginVueFactory(),
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
    createSetupPlugin(options),
    createMonacoLoader(),
  ].flat().filter(notNullish)
}
