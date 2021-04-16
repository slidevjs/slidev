
import { mergeConfig, Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import base64 from 'js-base64'
import { getPackageRoot, getThemeRoot } from '../env'
import { getDefultWindiConfig } from '../windicss'
import { getIndexHtml } from '../common'
import { createSlidesLoader } from './slides'
import { createMonacoLoader } from './monaco'
import { createEntryPlugin } from './entry'

export type ArgumentsType<T> = T extends ((...args: infer A) => void) ? A : never

export interface ViteSlidesOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof ViteComponents>[0]
  windicss?: ArgumentsType<typeof WindiCSS>[0]
  icons?: ArgumentsType<typeof ViteIcons>[0]
}

export function ViteSlides(options: ViteSlidesOptions = {}): Plugin[] {
  const {
    vue: vueOptions = {},
    markdown: mdOptions = {},
    components: componentsOptions = {},
    windicss: windicssOptions = {},
    icons: iconsOptions = {},
  } = options

  const packageRoot = getPackageRoot()

  return [
    {
      name: 'vite-slides:config',
      config(config) {
        return mergeConfig(config, {
          optimizeDeps: {
            include: [
              'vue',
              'vue-router',
              '@vueuse/core',
              'monaco-editor',
              'js-base64',
              '@vueuse/head',
              '@antfu/utils',
              'prettier',
              'prettier/esm/parser-html',
              'prettier/esm/parser-babel',
              'prettier/esm/parser-typescript',
            ],
            exclude: [
              'vue-demi',
              '@iconify/json',
              '@vitejs/plugin-vue',
              '@vue/compiler-sfc',
              'cac',
              'markdown-it-prism',
              'vite',
              'vite-ssg',
              'vite-plugin-components',
              'vite-plugin-icons',
              'vite-plugin-md',
              'vite-plugin-windicss',
              'vue-router',
            ],
          },
        })
      },
      configureServer(server) {
        // serve our index.html after vite history fallback
        return () => {
          server.middlewares.use(async(req, res, next) => {
            if (req.url!.endsWith('.html')) {
              res.statusCode = 200
              res.end(await getIndexHtml())
              return
            }
            next()
          })
        }
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
        md.use(Prism)
      },
      transforms: {
        before(code) {
        // transform monaco
          code = code.replace(/\n```(\w+?){monaco([\w:,-]*)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = 'ts', options: string, code: string) => {
            options = options || ''
            code = base64.encode(code, true)
            return `<Monaco :code="'${code}'" :lang="'${lang}'" :readonly="${options.includes('readonly')}" />`
          })

          return code
        },
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
        `${getThemeRoot()}/components`,
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
      config: getDefultWindiConfig(),
      ...windicssOptions,
    }),

    createEntryPlugin(),
    createSlidesLoader(),
    createMonacoLoader(),
  ]
}
