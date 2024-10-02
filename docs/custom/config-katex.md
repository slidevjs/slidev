# Configure KaTeX

<Environment type="node" />

Create `./setup/katex.ts` with the following content:

```ts twoslash
import { defineKatexSetup } from '@slidev/types'

export default defineKatexSetup(() => {
  return {
    maxExpand: 2000,
    /* ... */
  }
})
```

The return value should be the custom options for KaTeX. Refer to [KaTeX's documentation](https://katex.org/docs/options.html) or the type definition for the full options list.
