import { resolve } from 'path'
import { UserConfig } from 'vite'
import Icons, { ViteIconsResolver } from 'vite-plugin-icons'
import Components from 'vite-plugin-components'
import WindiCSS from 'vite-plugin-windicss'

const config: UserConfig = {
  resolve: {
    alias: {
      '@slidev/client': resolve(__dirname, '../packages/client'),
      '@slidev/parser': resolve(__dirname, '../packages/parser'),
    },
  },
  optimizeDeps: {
    exclude: [
      'vue-demi',
      '@vueuse/shared',
      '@vueuse/core',
    ],
  },
  publicDir: resolve(__dirname, '../assets'),
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    Components({
      dirs: [
        '.vitepress/theme/components',
        '../packages/client/builtin',
      ],
      customLoaderMatcher: id => id.endsWith('.md'),
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: '',
        }),
      ],
    }),
    Icons(),
    WindiCSS({
      preflight: false,
    }),
    {
      name: 'code-block-escape',
      enforce: 'post',
      transform(code, id) {
        if (!id.endsWith('.md'))
          return
        return code.replace(/\/\/```/mg, '```')
      },
    },
  ],
}

export default config
