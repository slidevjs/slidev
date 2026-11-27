---
name: max-height
description: Set a fixed height for code blocks with scrolling for long code
---

# Code Block Max Height

Set a fixed height for code blocks with scrolling.

## Usage

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

## With Line Highlighting Placeholder

Use `{*}` when you only need maxHeight:

````md
```ts {*}{maxHeight:'100px'}
// long code here
```
````

## Use Case

When code is too long to fit on one slide but you want to show it all with scrolling.
