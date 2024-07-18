import type Vue from '@vitejs/plugin-vue'
import type VueJsx from '@vitejs/plugin-vue-jsx'
import type Icons from 'unplugin-icons/vite'
import type Components from 'unplugin-vue-components/vite'
import type Markdown from 'unplugin-vue-markdown/vite'
import type { VitePluginConfig as UnoCSSConfig } from 'unocss/vite'
import type RemoteAssets from 'vite-plugin-remote-assets'
import type ServerRef from 'vite-plugin-vue-server-ref'
import type { ViteStaticCopyOptions } from 'vite-plugin-static-copy'
import type { Options as ViteInspectOptions } from 'vite-plugin-inspect'
import type { ArgumentsType } from '@antfu/utils'

export interface SlidevPluginOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  vuejsx?: ArgumentsType<typeof VueJsx>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof Components>[0]
  icons?: ArgumentsType<typeof Icons>[0]
  remoteAssets?: ArgumentsType<typeof RemoteAssets>[0]
  serverRef?: ArgumentsType<typeof ServerRef>[0]
  unocss?: UnoCSSConfig
  staticCopy?: ViteStaticCopyOptions
  inspect?: ViteInspectOptions
}

// extend vite.config.ts
declare module 'vite' {
  interface UserConfig {
    /**
     * Custom internal plugin options for Slidev (advanced)
     *
     * @see https://github.com/slidevjs/slidev/blob/main/packages/slidev/node/options.ts#L50
     */
    slidev?: SlidevPluginOptions
  }
}
