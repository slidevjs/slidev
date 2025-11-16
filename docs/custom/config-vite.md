# Configure Vite and Plugins

<Environment type="node" />

Slidev is powered by [Vite](https://vitejs.dev/) under the hood. This means you can leverage Vite's great plugin system to customize your slides even further.

The `vite.config.ts` will be respected if you have one, and will be merged with the Vite config provided by Slidev, your theme and the addons.

## Configure Internal Plugins

Slidev internally adds the following plugins to Vite:

- [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue)
- [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
- [unplugin-icons](https://github.com/unplugin/unplugin-icons)
- [vite-plugin-vue-markdown](https://github.com/unplugin/unplugin-vue-markdown)
- [vite-plugin-remote-assets](https://github.com/antfu/vite-plugin-remote-assets)
- [unocss/vite](https://github.com/unocss/unocss/tree/main/packages/vite)

To configure the built-in plugins listed above, create a `vite.config.ts` with the following content. Please note that Slidev has some [default configurations](https://github.com/slidevjs/slidev/blob/main/packages/slidev/node/vite/index.ts) for those plugins, this usage will override some of them, which may potentially cause the app to break. Please treat this as **an advanced feature**, and make sure you know what you are doing before moving on.

<!-- eslint-disable import/first -->

```ts twoslash [vite.config.ts]
/// <reference types="@slidev/types" />
import type MarkdownIt from 'markdown-it'

declare const MyPlugin: (md: any) => void
// ---cut---
import { defineConfig } from 'vite'

export default defineConfig({
  slidev: {
    vue: {
      /* vue options */
    },
    markdown: {
      /* markdown-it options */
      markdownItSetup(md) {
        /* custom markdown-it plugins */
        md.use(MyPlugin)
      },
    },
    /* options for other plugins */
  },
})
```

See the [type declarations](https://github.com/slidevjs/slidev/blob/main/packages/types/src/vite.ts#L11) for more options.

::: warning
It is not allowed to re-add plugins that has been used internally be Slidev. For example, instead of

```ts twoslash
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Vue({
      /* vue options */
    })
  ],
})
```

Please pass the Vue options to the `slidev.vue` field as described above
:::

## Add Custom Plugins based on Slide data

Usually you can add Vite plugins into your `vite.config.ts` (see above).
However, if you want to add plugins based on the slide data, you need to add a `./setup/vite-plugins.ts` with the following content:

```ts twoslash
import { defineVitePluginsSetup } from '@slidev/types'

export default defineVitePluginsSetup((options) => {
  return [
    // Your plugins here
    // Slide data is available as options.data.slides
  ]
})
```
