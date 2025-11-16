# Configure UnoCSS

<Environment type="node" />

[UnoCSS](https://unocss.dev) is now the default CSS framework for Slidev since v0.42.0. UnoCSS is a fast atomic CSS engine that has full flexibility and extensibility. Most of the Tailwind CSS classes are supported **out-of-box**, and you can also extend it with your own configurations.

By default, Slidev enables the following presets out-of-box:

- [@unocss/preset-wind3](https://unocss.dev/presets/wind3) - Tailwind / Windi CSS compatible utilities
- [@unocss/preset-attributify](https://unocss.dev/presets/attributify) - Attributify mode
- [@unocss/preset-icons](https://unocss.dev/presets/icons) - Use any icons as class
- [@unocss/preset-web-fonts](https://unocss.dev/presets/web-fonts) - Use web fonts at ease
- [@unocss/transformer-directives](https://unocss.dev/transformers/directives) - Use `@apply` in CSS

Slidev also adds shortcuts as can be seen in its [source code](https://github.com/slidevjs/slidev/blob/main/packages/client/uno.config.ts).

You can therefore style your content the way you want. For example:

```html
<div class="grid pt-4 gap-4 grid-cols-[100px,1fr]">

### Name

- Item 1
- Item 2

</div>
```

## Configurations

You can create `uno.config.ts` under the root of your project to extend the builtin configurations

```ts twoslash [uno.config.ts]
import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    // custom the default background
    'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
  },
  // ...
})
```

Learn more about [UnoCSS configurations](https://unocss.dev/guide/config-file)
