
import { resolve } from 'path'
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './loaders'
import { createMonacoLoader, transformMarkdownMonaco } from './monaco'
import { createEntryPlugin } from './entry'
import { resolveOptions, SlidevPluginOptions } from './options'
import { createSetupPlugin } from './setups'
import VitePluginVueFactory, { VueFactoryResolver } from './factory'
import VitePluginServerRef from './server-ref'

export async function ViteSlidevPlugin(pluginOptions: SlidevPluginOptions = {}): Promise<Plugin[]> {
  const {
    vue: vueOptions = {},
    markdown: mdOptions = {},
    components: componentsOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
    windicss: windiOptions = {},
  } = pluginOptions

  const options = pluginOptions.resolved || await resolveOptions(pluginOptions.entry)
  const {
    themeRoot,
    clientRoot,
  } = options

  return [
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
        md.use(Prism)
      },
      transforms: {
        before: transformMarkdownMonaco,
      },
      ...mdOptions,
    }),

    {
      name: 'slidev:vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    } as Plugin,

    ViteComponents({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        `${clientRoot}/builtin`,
        `${clientRoot}/components`,
        `${themeRoot}/components`,
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
          resolve(themeRoot, 'windi.config.ts'),
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

    RemoteAssets({
      rules: [
        ...DefaultRules,
        {
          match: /\b(https?:\/\/\w+\.unsplash\.com.*?)(?=[`'")\]])/ig,
          ext: '.png',
        },
      ],
      resolveMode: '@fs',
      ...remoteAssetsOptions,
    }),

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
    createSlidesLoader(options),
    createSetupPlugin(options),
    createMonacoLoader(),
  ].flat()
}
