# Highlighter

Slidev comes with two syntax highlighter for you to choose:

- [Prism](https://prismjs.com/)
- [Shiki](https://github.com/shikijs/shiki)

**Prism** is one of the most popular syntax highlighters, the highlighting is done by adding token classes to the code and colorized using CSS. You can search for their [official themes](https://github.com/PrismJS/prism-themes) or customize one with [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars) very easily.

**Shiki** on the other hand, is a TextMate grammar-powered syntax highlighter. It generates colored tokens where there is not additional CSS needed. Since it has great grammar support, the generated colors are very accurate, just like what you will see in VS Code. Shiki also comes with [a bunch of themes built-in](https://github.com/shikijs/shiki/blob/master/docs/themes.md) you can directly use. The downside of it is that it also requires TextMate themes (compatible with VS Code theme) to do the highlighting, which could be a bit hard to customize.

Depends on the theme you are using, it might support both or only one of them.

But when you have the choice, the tradeoff is basically:

- **Prism** for easier customization
- **Shiki** for more accurate highlighting

By default, Slidev uses Prism. You can change it by modifying your frontmatter:

```yaml
---
highlighter: shiki
---
```

## Configure Prism

To configure your Prism, you can just import the theme css or use [`prism-theme-vars`](https://github.com/antfu/prism-theme-vars) to configure themes for both light and dark mode. Refer to it's docs for more details.

## Configure Shiki

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
import { loadTheme } from 'shiki'

export default defineShikiSetup(async() => {
  return {
    theme: {
      dark: await loadTheme('path/to/theme.json')),
      light: await loadTheme('path/to/theme.json')),
    },
  }
})
```


