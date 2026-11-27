---
name: line-highlighting
description: Highlight specific lines in code blocks with static or click-based dynamic highlighting
---

# Line Highlighting

Highlight specific lines in code blocks.

## Static Highlighting

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

## Dynamic (Click-based)

Use `|` to separate stages:

````md
```ts {2-3|5|all}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
```
````

Click progression: lines 2-3 → line 5 → all lines

## Special Values

- `hide` - Hide the code block
- `none` - Show code without highlighting
- `all` - Highlight all lines

````md
```ts {hide|none|all}
// Hidden → No highlight → All highlighted
```
````
