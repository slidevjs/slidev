import { slidebars } from '.vitepress/config'
import UnoCSS from 'unocss/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import llmstxt from 'vitepress-plugin-llms'
import config from './.vitepress/config'

const IS_ROOT_ENGLISH_DOC = config.locales?.root.label.includes('English') || false

export default defineConfig({
  optimizeDeps: {
    exclude: [
      'vue-demi',
      '@vueuse/shared',
      '@vueuse/core',
    ],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    IS_ROOT_ENGLISH_DOC && llmstxt({
      ignoreFiles: [
        'index.md',
        'README.md',
      ],
      sidebar: slidebars,
    }),
    Components({
      dirs: [
        './.vitepress/theme/components',
        './node_modules/@slidev/client/builtin',
      ],
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/, /\.md\?vue/],
      resolvers: [
        IconsResolver({
          prefix: '',
        }),
      ],
    }),
    Icons({
      defaultStyle: 'display: inline-block;',
    }),
    Inspect(),
    UnoCSS(),
    groupIconVitePlugin(),
  ],
})
