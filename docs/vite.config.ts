import { defineConfig } from 'vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import Inspect from 'vite-plugin-inspect'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@slidev/client/': '@slidev-old/client/',
      '@slidev/parser': '@slidev-old/parser',
      '@slidev/theme-default': '@slidev-old/theme-default',
    },
  },
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
    Components({
      dirs: [
        './.vitepress/theme/components',
        './node_modules/@slidev-old/client/builtin',
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
    {
      name: 'virtual-modules',
      resolveId(id) {
        return id === '/@slidev/configs' ? id : null
      },
      load(id) {
        if (id !== '/@slidev/configs')
          return
        return 'export default {}'
      },
    },
  ],
})
