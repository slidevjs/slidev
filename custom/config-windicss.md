# Configure Windi CSS

<Environment type="node" />

::: warning
Since Slidev v0.42.0, [UnoCSS](/custom/config-unocss) become the default CSS framework for Slidev.

You can still use Windi CSS by setting `css: windicss` in the frontmatter.
```md
---
css: windicss
---
```
:::

Markdown naturally supports embedded HTML markups. You can therefore style your content the way you want.

For example:

```html
<div class="grid pt-4 gap-4 grid-cols-[100px,1fr]">

### Name

- Item 1
- Item 2

</div>
```

The [Attributify Mode](https://windicss.org/posts/v30.html#attributify-mode) in [Windi CSS v3.0](https://windicss.org/posts/v30.html) is enabled by default.

## Configurations

To configure Windi CSS, create `setup/windicss.ts` with the following content to extend the builtin configurations

```ts
// setup/windicss.ts

import { defineWindiSetup } from '@slidev/types'

// extending the builtin windicss configurations
export default defineWindiSetup(() => ({
  shortcuts: {
    // custom the default background
    'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
  },
  theme: {
    extend: {
      // fonts can be replaced here, remember to update the web font links in `index.html`
      fontFamily: {
        sans: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
        mono: '"Fira Code", monospace',
      },
    },
  },
}))
```

Learn more about [Windi CSS configurations](https://windicss.org/guide/configuration.html)
