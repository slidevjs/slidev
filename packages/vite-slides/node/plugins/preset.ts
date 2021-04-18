
import { resolve } from 'path'
import { existsSync } from 'fs'
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS, { loadConfiguration } from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import RemoteAssets from 'vite-plugin-remote-assets'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './slides'
import { createMonacoLoader, transformMarkdownMonaco } from './monaco'
import { createEntryPlugin } from './entry'
import { resolveOptions, ViteSlidesPluginOptions } from './options'

export function ViteSlides(options: ViteSlidesPluginOptions = {}): Plugin[] {
  const {
    vue: vueOptions = {},
    markdown: mdOptions = {},
    components: componentsOptions = {},
    windicss: windicssOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
  } = options

  const slidesOptions = resolveOptions(options)
  const { themeRoot, packageRoot } = slidesOptions

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
      name: 'vite-slides:vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    },

    ViteComponents({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        `${packageRoot}/client/builtin`,
        `${packageRoot}/client/components`,
        `${themeRoot}/components`,
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

    ...WindiCSS({
      async onConfigResolved(config, filepath) {
        if (filepath)
          return

        // if the user does not provide windi.config
        const themeConfig = resolve(themeRoot, 'windi.config.ts')
        if (existsSync(themeConfig)) {
          return (
            await loadConfiguration({ config: themeConfig })
          ).resolved
        }
        else {
          return (
            await loadConfiguration({ config: resolve(packageRoot, 'client/windi.config.ts') })
          ).resolved
        }
      },
      ...windicssOptions,
    }),

    RemoteAssets({
      ...remoteAssetsOptions,
    }),

    createConfigPlugin(),
    createEntryPlugin(slidesOptions),
    createSlidesLoader(slidesOptions),
    createMonacoLoader(),
  ]
}
