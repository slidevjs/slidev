---
relates:
  - vite-plugin-pwa: https://vite-pwa-org.netlify.app/
  - Workbox: https://developer.chrome.com/docs/workbox
tags: [build]
since: v52.17.0
description: |
  Opt-in PWA support that precaches all deck assets so a built deck runs fully offline.
---

# PWA / Offline Support

Slides are often presented on an unfamiliar or locked-down machine, over a flaky or absent network. With the opt-in `pwa` option, `slidev build` generates a [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) (powered by [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) and [Workbox](https://developer.chrome.com/docs/workbox)) that **precaches every deck asset** — JavaScript, CSS, and HTML plus all images, video, and audio — so once the served deck has loaded a first time, it runs entirely from the cache with no per-slide asset fetching mid-talk.

## Usage

Enable it in the [headmatter](/custom/#headmatter) of your first slide:

```yaml
---
pwa: true
---
```

The `pwa` option can be a boolean or a string to control when the service worker is active:

- `false` (default) — no service worker.
- `true` — enabled in both dev and build.
- `'build'` — enabled in the built output only.
- `'dev'` — enabled in the dev server only.

Since precaching every asset is heavy, `pwa` is **off by default** and should be enabled deliberately — most useful together with [`slidev build`](/guide/hosting) for a self-hosted deck you want to work offline.

## Installing the PWA Plugin

PWA support is powered by [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/), which ships as an **optional peer dependency**. It is not installed by default, so decks that don't opt into `pwa` never download it.

The first time you enable `pwa`, the Slidev CLI detects that the package is missing and prompts you to install it:

```
? The "pwa" option requires the "vite-plugin-pwa" package, which is not installed
  in your project. Install it now? › (Y/n)
```

Confirm the prompt and Slidev installs it for you with your project's package manager (or globally, when Slidev itself is installed globally). In a non-interactive environment (such as CI) the prompt can't be shown, so install it ahead of time instead:

```bash
npm i -D vite-plugin-pwa
```

## How It Works

When you serve the built deck, the service worker downloads and caches all deck assets in the background. A small indicator in the bottom-right corner shows `Caching for offline…` while precaching is in progress, then briefly shows `Ready offline` once it completes. After that, disconnecting the network and reloading serves the whole deck — HTML, images, and video — from the cache.

The plugin is a complete no-op when `pwa` is disabled, and the client registration and indicator are tree-shaken out of the bundle, so there is no runtime cost unless you opt in.

## Notes

- **Only built assets are precached.** Files emitted into the build are cached; remote or CDN-fetched assets are not available offline. To make remote images work offline, combine this with [Bundle Remote Assets](/features/bundle-remote-assets), which downloads them into the build.
- **No manifest icons.** An offline feature must not depend on a remote/CDN asset (and a deck's own [`favicon`](/custom/#headmatter) may be a URL), so the generated web app manifest intentionally ships no icons. It remains a valid manifest without them.
- **Large media.** Workbox's `maximumFileSizeToCacheInBytes` is raised to 100 MB and the precache glob covers common image, video, and audio extensions, so large media files are not silently skipped.
- **Video seeking offline.** Precached media is served as a full cached response, so playing from the start works offline; scrubbing/seeking through video may require additional range-request handling.
