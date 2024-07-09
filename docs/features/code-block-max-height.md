---
layout: feature
depends:
  - guide/syntax#code-block
description: |
  Set a maximum height for a code block and enable scrolling.
---

# Max Height

If the code doesn't fit into one slide, you use the `maxHeight` to set a fixed height and enable scrolling:

````md
```ts {2|3|7|12}{maxHeight:'100px'}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
/// ...as many lines as you want
const c = add(1, 2)
```
````
