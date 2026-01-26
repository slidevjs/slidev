---
depends:
  - guide/syntax#code-block
  - guide/animations
relates:
  - Shiki Magic Move: https://github.com/shikijs/shiki-magic-move
since: v0.48.0
tags: [codeblock, animation]
description: |
  Enable granular transition between code changes, similar to Keynote's Magic Move.
---

# Shiki Magic Move

[Shiki Magic Move](https://github.com/shikijs/shiki-magic-move) enables you to have a granular transition between code changes, similar to Keynote's Magic Move. You can check [the playground](https://shiki-magic-move.netlify.app/) to see how it works.

<video src="https://github.com/slidevjs/slidev/assets/11247099/79927794-27ba-4342-9911-9996cec889d6" controls rounded shadow w-full></video>

In Slidev, we bind the magic-move to the [clicks system](/guide/animations#click-animation). The syntax is to wrap multiple code blocks representing each step with <code>````md magic-move</code> (mind it's **4** backticks), this will be transformed into one code block, that morphs to each step as you click.

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

It's also possible to mix Magic Move with <LinkInline link="features/line-highlighting" /> and <LinkInline link="features/code-block-line-numbers" />, for example:

`````md
````md magic-move {at:4, lines: true} // [!code hl]
```js {*|1|2-5} // [!code hl]
let count = 1
function add() {
  count++
}
```

Non-code blocks in between as ignored, you can put some comments.

```js {*}{lines: false} // [!code hl]
let count = 1
const add = () => count += 1
```
````
`````

## Title Bar {#title-bar}

> Available since v0.52.0

You can add a title bar to magic move blocks by specifying a filename in the opening fence of each step:

`````md
````md magic-move
```js [app.js]
console.log('Step 1')
```
```js [app.js]
console.log('Step 2')
```
````
`````

The title bar will also display an automatically matched icon based on the filename (see <LinkInline link="features/code-groups#title-icon-matching" />).

## Animation Duration {#duration}

> Available since v0.52.0

You can customize the animation duration for magic move transitions globally via the headmatter:

```yaml
---
magicMoveDuration: 500  # duration in milliseconds, default is 800
---
```

Or per-block by passing the `duration` option:

`````md
````md magic-move {duration:500}
```js
console.log('Step 1')
```
```js
console.log('Step 2')
```
````
`````

## Copy Button {#copy-button}

> Available since v0.52.0

Magic move code blocks support a copy button that appears on hover. Configure this behavior globally with the `magicMoveCopy` headmatter option:

```yaml
---
# Options: true | false | 'always' | 'final'
magicMoveCopy: true     # show copy button on all steps (default)
magicMoveCopy: false    # disable copy button
magicMoveCopy: 'final'  # only show copy button on the final step
---
```

The copy button respects the global `codeCopy` setting. If `codeCopy` is `false`, the magic move copy button will also be disabled.
