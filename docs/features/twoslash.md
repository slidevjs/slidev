---
depends:
  - guide/syntax#code-block
relates:
  - TwoSlash: https://twoslash.netlify.app/
since: v0.46.0
tags: [codeblock]
description: |
  A powerful tool for rendering TypeScript code blocks with type information on hover or inlined.
---

# TwoSlash Integration

[TwoSlash](https://twoslash.netlify.app/) is a powerful tool for rendering TypeScript code blocks with type information on hover or inlined. It's quite useful for preparing slides for JavaScript/TypeScript-related topics.

To use it, you can add `twoslash` to the code block's language identifier:

````md
```ts twoslash
import { ref } from 'vue'

const count = ref(0)
//            ^?
```
````

It will be rendered as:

```ts twoslash
import { ref } from 'vue'

const count = ref(0)
//            ^?
```

<!-- For the popup to not overlap the content below -->
<div class="py-20" />
