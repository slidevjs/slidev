import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin, PluginOption } from 'vite'
import { importOptionalDependency, promptForOptionalInstallation } from '../resolver'

type VitePWAFn = (options: Record<string, any>) => PluginOption

const PWA_PACKAGE = 'vite-plugin-pwa'

export async function createPWAPlugin(options: ResolvedSlidevOptions): Promise<PluginOption> {
  const matchMode = (mode: string | boolean) => mode === true || mode === options.mode
  const enabled = matchMode(options.data.config.pwa)

  // PWA off (the default): `vite-plugin-pwa` is an optional peer dependency, so
  // don't require it at all. A tiny stub keeps the client's guarded
  // `import('virtual:pwa-register')` resolvable so no PWA install is needed.
  if (!enabled)
    return createPWARegisterStubPlugin()

  const VitePWA = await resolveVitePWA()

  const base = options.base ?? '/'
  const title = options.data.config.title || 'Slidev'

  return VitePWA({
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
    // No icons: a PWA feature must not depend on a remote/CDN asset, and the
    // deck's own favicon may be a URL. Manifest stays valid without icons.
    manifest: {
      name: title,
      short_name: 'Slidev',
      start_url: base,
      display: 'fullscreen',
      theme_color: '#121212',
      background_color: '#121212',
    },
  })
}

/**
 * Resolve `vite-plugin-pwa`'s `VitePWA` factory, prompting the user to install
 * the optional peer dependency when the `pwa` option is enabled but the package
 * is missing.
 */
async function resolveVitePWA(): Promise<VitePWAFn> {
  let mod = await importOptionalDependency<{ VitePWA?: VitePWAFn, default?: { VitePWA?: VitePWAFn } }>(PWA_PACKAGE)

  if (!mod?.VitePWA && !mod?.default?.VitePWA) {
    await promptForOptionalInstallation(PWA_PACKAGE, 'The "pwa" option')
    mod = await importOptionalDependency(PWA_PACKAGE)
  }

  const VitePWA = mod?.VitePWA ?? mod?.default?.VitePWA
  if (!VitePWA)
    throw new Error(`[slidev] Failed to load "${PWA_PACKAGE}", which is required by the "pwa" option.`)

  return VitePWA
}

/**
 * When PWA is disabled, resolve `virtual:pwa-register` to a no-op module. The
 * client only imports it behind the `__SLIDEV_FEATURE_PWA__` guard (stripped
 * from the build when off), but the guarded dynamic import must still resolve
 * during dev — without pulling in the optional `vite-plugin-pwa` dependency.
 */
function createPWARegisterStubPlugin(): Plugin {
  const VIRTUAL_ID = 'virtual:pwa-register'
  const RESOLVED_ID = `\0${VIRTUAL_ID}`
  return {
    name: 'slidev:pwa-register-stub',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id === RESOLVED_ID)
        return 'export function registerSW() { return () => Promise.resolve() }'
    },
  }
}
