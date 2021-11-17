# Highlighters

Slidev comes with two syntax highlighter for you to choose from:

- [Prism](https://prismjs.com/)
- [Shiki](https://github.com/shikijs/shiki)

**Prism** is one of the most popular syntax highlighters. The highlighting is done by adding token classes to the code and it's colored using CSS. You can browse through their [official themes](https://github.com/PrismJS/prism-themes), or create/customize one yourself very easily using [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars).

**Shiki**, on the other hand, is a TextMate grammar-powered syntax highlighter. It generates colored tokens, so there is no additional CSS needed. Since it has great grammar support, the generated colors are very accurate, just like what you will see in VS Code. Shiki also comes with [a bunch of built-in themes](https://github.com/shikijs/shiki/blob/master/docs/themes.md). The downside of Shiki is that it also requires TextMate themes (compatible with VS Code theme) to do the highlighting, which can be a bit harder to customize.

Slidev themes usually support both Prism and Shiki, but depending on the theme you are using, it might only support one of them.

When you have the choice, the tradeoff is basically:

- **Prism** for easier customization
- **Shiki** for more accurate highlighting

By default, Slidev uses Prism. You can change it by modifying your frontmatter:

```yaml
---
highlighter: shiki
---
```

## Configure Prism

To configure your Prism, you can just import the theme css or use [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars) to configure themes for both light and dark mode. Refer to its docs for more details.

## Configure Shiki

<Environment type="node" />

Create `./setup/shiki.ts` file with the following content

```ts
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    theme: {
      dark: 'min-dark',
      light: 'min-light',
    },
  }
})
```

Refer to [Shiki's docs](https://github.com/shikijs/shiki/blob/master/docs/themes.md#all-themes) for available theme names.

Or if you want to use your own theme:

```ts
/* ./setup/shiki.ts */

import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(async({ loadTheme }) => {
  return {
    theme: {
      dark: await loadTheme('path/to/theme.json'),
      light: await loadTheme('path/to/theme.json'),
    },
  }
})
```
