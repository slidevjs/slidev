
import { resolve } from 'path'
import { existsSync } from 'fs'
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import Shiki, { Options as ShikiOptions } from 'markdown-it-shiki'
import RemoteAssets, { DefaultRules } from 'vite-plugin-remote-assets'
// @ts-expect-error
import mila from 'markdown-it-link-attributes'
import { deepMerge, notNullish, uniq } from '@antfu/utils'
import { registerSucrase } from '../utils/register'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './loaders'
import { createMonacoLoader, transformMarkdownMonaco, truncateMancoMark } from './monaco'
import { createEntryPlugin } from './entry'
import { ResolvedSlidevOptions, SlidevPluginOptions } from './options'
import { createSetupPlugin } from './setups'
import VitePluginVueFactory, { VueFactoryResolver } from './factory'
import VitePluginServerRef from './server-ref'

async function loadSetups<T, R extends object>(roots: string[], name: string, arg: T, initial: R, merge = true): Promise<R> {
  let returns = initial
  const revert = registerSucrase()
  for (const root of roots) {
    const path = resolve(root, 'setup', name)
    if (existsSync(path)) {
      const { default: setup } = await import(path)
      const result = await setup(arg)
      if (result !== null) {
        returns = merge
          ? deepMerge(returns, result)
          : result
      }
    }
  }
  revert()
  return returns
}

export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
): Promise<Plugin[]> {
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
    userRoot,
    data: { config },
  } = options

  const roots = uniq([clientRoot, ...themeRoots, userRoot])

  const DEV = mode === 'dev' ? 'true' : 'false'

  let shikiOptions: ShikiOptions = undefined!

  if (config.highlighter === 'shiki') {
    shikiOptions = await loadSetups(roots, 'shiki.ts', {}, {
      theme: {
        dark: 'min-dark',
        light: 'min-light',
      },
    }, false)
  }

  return [
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

    <Plugin>{
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.vue'))
          return code.replace(/__DEV__/g, DEV)
      },
    },

    <Plugin>{
      name: 'slidev:vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
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
        if (config.highlighter === 'shiki')
          md.use(Shiki, shikiOptions)

        else
          md.use(Prism)
      },
      transforms: {
        before: (config.monaco === true || config.monaco === mode)
          ? transformMarkdownMonaco
          : truncateMancoMark,
      },
      ...mdOptions,
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
        VueFactoryResolver,
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
