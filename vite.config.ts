import { UserConfig } from 'vite'
import Icons, { ViteIconsResolver } from 'vite-plugin-icons'
import Components from 'vite-plugin-components'
import WindiCSS from 'vite-plugin-windicss'

const config: UserConfig = {
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
  ],
}

export default config
