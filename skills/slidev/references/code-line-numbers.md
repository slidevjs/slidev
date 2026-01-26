---
name: line-numbers
description: Enable line numbering for code blocks globally or per-block
---

# Code Block Line Numbers

Enable line numbering for code blocks.

## Global Setting

Enable for all code blocks in headmatter:

```md
---
lineNumbers: true
---
```

## Per-Block Setting

````md
```ts {6,7}{lines:true,startLine:5}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
```
````

## Options

- `lines: true/false` - Enable/disable line numbers
- `startLine: number` - Starting line number (default: 1)

## With Line Highlighting

Use `{*}` as placeholder when combining with other features:

````md
```ts {*}{lines:true,startLine:5}
// code here
```
````
