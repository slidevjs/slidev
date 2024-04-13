# Highlighters

Slidev comes with two syntax highlighters for you to choose from:

- [Prism](https://prismjs.com/)
- [Shiki](https://github.com/shikijs/shiki)

**Prism** is one of the most popular syntax highlighters. The highlighting is done by adding token classes to the code and it's colored using CSS. You can browse through their [official themes](https://github.com/PrismJS/prism-themes), or create/customize one yourself very easily using [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars).

**Shiki** is a TextMate grammar-powered syntax highlighter. It generates colored tokens, so there is no additional CSS needed. Since it has great grammar support, the generated colors are very accurate, just like what you will see in VS Code. Shiki also comes with [a bunch of built-in themes](https://shiki.style/themes). In Slidev, we also provided the [TwoSlash](#twoslash-integration) support is also built-in.

Slidev themes usually support both Prism and Shiki, but depending on the theme you are using, it might only support one of them.

When you have the choice, the tradeoff is basically:

- **Prism** for easier customization
- **Shiki** for accurate highlighting

Slidev uses Shiki by default since v0.47. You can switch to it by adding the following to your `slides.md`:

```yaml
---
highlighter: Prism
---
```

## Configure Shiki

<Environment type="node" />

Create `./setup/shiki.ts` file with the following content

```ts
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'
import customLanguage from './customLanguage.tmLanguage.json'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: 'min-dark',
      light: 'min-light',
    },
    langs: [
      'cpp',
      customLanguage,
    ],
    transformers: [
      // ...
    ],
  }
})
```

Refer to [Shiki's docs](https://shiki.style) for available theme names.

## Configure Prism

To configure your Prism, you can just import the theme CSS or use [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars) to configure themes for both light and dark mode. Refer to its docs for more details.
