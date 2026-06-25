import type { ResolvedSlidevOptions } from '@slidev/types'
import type { PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export function createPWAPlugin(options: ResolvedSlidevOptions): PluginOption {
  const matchMode = (mode: string | boolean) => mode === true || mode === options.mode
  const enabled = matchMode(options.data.config.offline)

  const base = options.base ?? '/'
  const title = options.data.config.title || 'Slidev'

  // Always register the plugin so `virtual:pwa-register` resolves in every build
  // (dev included); disable service-worker generation unless `offline` is enabled.
  return VitePWA({
    disable: !enabled,
    registerType: 'autoUpdate',
    injectRegister: null,
    base,
    workbox: {
      maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
      globPatterns: [
        '**/*.{js,css,html,woff,woff2,ttf,png,jpg,jpeg,svg,gif,webp,avif,ico,mp4,webm,ogv,mov,m4v,mp3,wav,ogg,oga,m4a,aac,flac,opus,weba}',
      ],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/^\/(presenter|notes|overview|print|export)/],
    },
    // No icons: an offline feature must not depend on a remote/CDN asset, and the
    // deck's own favicon may be a URL. Manifest stays valid without icons.
    manifest: {
      name: title,
      short_name: 'Slidev',
      start_url: base,
      display: 'fullscreen',
      theme_color: '#121212',
      background_color: '#121212',
    },
  }) as PluginOption
}
