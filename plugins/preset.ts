
import { mergeConfig, Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import base64 from 'js-base64'
import { createSlidesLoader } from './slides'
import { createMonacoLoader } from './monaco'

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
            ],
            exclude: [
              'vue-demi',
            ],
          },
        })
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
      // https://prismjs.com/
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
        'src/builtin',
        'src/components',
      ],

      customLoaderMatcher: id => id.endsWith('.md'),

      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: '',
        }),
      ],

      ...componentsOptions,
    }),

    createSlidesLoader(),
    createMonacoLoader(),

    ViteIcons({
      ...iconsOptions,
    }),

    ...WindiCSS({
      ...windicssOptions,
    }),
  ]
}
