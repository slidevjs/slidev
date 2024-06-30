---
layout: feature
depends:
  - feature/code-block
description: |
  Highlight specific lines in code blocks.
---

# Static Line Highlighting

To highlight specific lines, simply add line numbers within brackets `{}`. Line numbers start counting from 1 by default.

````md
```ts {2,3}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
```
````
