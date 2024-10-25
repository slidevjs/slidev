# Configure Highlighter

Slidev uses [Shiki](https://github.com/shikijs/shiki) as the code highlighter. It's a TextMate Grammar powered syntax highlighter as accurate as VS Code. It generates colored tokens so no additinal CSS is required. Shiki also comes with [a bunch of built-in themes](https://shiki.style/themes). In Slidev, we also provided the [TwoSlash](#twoslash-integration) support.

## Configure Shiki

<Environment type="both" />

Create `./setup/shiki.ts` file with the following content:

```ts twoslash
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: 'min-dark',
      light: 'min-light',
    },
    transformers: [
      // ...
    ],
  }
})
```

If you want to add custom theme or language (TextMate grammar/themes in JSON), you can import them in the setup file:

<!-- eslint-disable import/first-->

```ts twoslash
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'
// ---cut-start---
// @ts-expect-error missing types
// ---cut-end---
import customTheme from './customTheme.tmTheme.json'
// ---cut-start---
// @ts-expect-error missing types
// ---cut-end---
import customLanguage from './customLanguage.tmLanguage.json'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: customTheme,
      light: 'min-light',
    },
    langs: [
      'js',
      'typescript',
      'cpp',
      customLanguage,
      // ...
    ],
    transformers: [
      // ...
    ],
  }
})
```

Check [Built-in languages](https://shiki.style/languages) and [Built-in themes](https://shiki.style/themes), and refer to [Shiki's docs](https://shiki.style) for more details.

:::info
For now, Shiki Magic Move does not support transformers.
:::

## Configure Prism

:::warning
Prism support has been removed since v0.50. Please use Shiki instead.
:::
