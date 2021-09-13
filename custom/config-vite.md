# Configure Vite

<Environment type="node" />

Slidev is powered by [Vite](http://vitejs.dev/) under the hood. This means you can leverage Vite's great plugin system to customize your slides even further.

The `vite.config.ts` will be respected if you have one.

Slidev has the following plugins preconfigured:

- [@vitejs/plugin-vue](https://github.com/vitejs/vite/tree/main/packages/plugin-vue)
- [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components)
- [unplugin-icons](https://github.com/antfu/unplugin-icons)
- [vite-plugin-md](https://github.com/antfu/vite-plugin-md)
- [vite-plugin-windicss](https://github.com/windicss/vite-plugin-windicss)
- [vite-plugin-remote-assets](https://github.com/antfu/vite-plugin-remote-assets)

Learn more about the [pre-configurations here](https://github.com/slidevjs/slidev/blob/main/packages/slidev/node/plugins/preset.ts).

## Configure Internal Plugins

> Available since v0.21

To configure the built-in plugins list above, create `vite.config.ts` with the following content. Please note Slidev has some preconfigure options for those plugins, this usage will override some of them, which could potentially cause the app to break. Please treat this as **an advanced feature**, make sure you know what you are doing before moving on.

```ts
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
        md.use(/* ... */)
      },
    },
    /* options for other plugins */
  },
})
```

See the [type declarations](https://github.com/slidevjs/slidev/blob/main/packages/slidev/node/options.ts#L50) for more options.
