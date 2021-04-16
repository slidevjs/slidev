
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import { getPackageRoot, getThemeRoot } from '../env'
import { getDefultWindiConfig } from './windicss'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './slides'
import { createMonacoLoader, transformMarkdownMonaco } from './monaco'
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
      // TODO: merge with theme/user config
      config: getDefultWindiConfig(),
      ...windicssOptions,
    }),

    createConfigPlugin(),
    createEntryPlugin(),
    createSlidesLoader(),
    createMonacoLoader(),
  ]
}
