import { resolve } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import { createSlidesLoader } from './plugins/slides'
import { createMonacoLoader } from './plugins/monaco'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    Markdown({
      wrapperClasses: '',
      headEnabled: true,
      markdownItSetup(md) {
        // https://prismjs.com/
        md.use(Prism)
      },
      transforms: {
        before(code) {
          // transform monaco
          code = code.replace(/\n```(\w+?){monaco([\w:,-]*)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = 'ts', options: string, code: string) => {
            options = options || ''
            return `<Monaco :code="'${code.replace(/'/g, '\\\'').replace(/\n/g, '\\n')}'" :lang="${lang}" :readonly="${options.includes('readonly')}" />`
          })

          return code
        },
      },
    }),

    {
      name: 'vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    },

    // https://github.com/antfu/vite-plugin-components
    ViteComponents({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],

      // allow auto import and register components used in markdown
      customLoaderMatcher: id => id.endsWith('.md'),

      // auto import icons
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: '',
        }),
      ],
    }),

    createSlidesLoader(),
    createMonacoLoader(),

    ViteIcons(),

    WindiCSS(),
  ],
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
