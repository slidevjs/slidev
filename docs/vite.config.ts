import { slidebars } from '.vitepress/config'
import UnoCSS from 'unocss/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import llmstxt from 'vitepress-plugin-llms'

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
    llmstxt({
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
