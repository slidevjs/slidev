---
name: magic-move
description: Animate code changes with smooth transitions between code blocks
---

# Shiki Magic Move

Animate code changes with smooth transitions (like Keynote's Magic Move).

## Basic Usage

`````md
````md magic-move
```js
console.log(`Step ${1}`)
```
```js
console.log(`Step ${1 + 1}`)
```
```ts
console.log(`Step ${3}` as string)
```
````
`````

Note: Use 4 backticks for the wrapper.

## With Line Highlighting

`````md
````md magic-move {at:4, lines: true}
```js {*|1|2-5}
let count = 1
function add() {
  count++
}
```

Non-code blocks in between are ignored.

```js {*}{lines: false}
let count = 1
const add = () => count += 1
```
````
`````

## How It Works

- Wraps multiple code blocks as one
- Each block is a "step"
- Morphs between steps on click
- Syntax highlighting preserved during animation

## Resources

- Playground: https://shiki-magic-move.netlify.app/
