---
depends:
  - features/monaco-editor
  - guide/animations
relates:
  - Custom Code Runners: /custom/config-code-runners
since: v0.48.0
tags: [codeblock, editor]
description: |
  Run code directly in the editor and see the result.
---

# Monaco Runner

Slidev also provides the Monaco Runner Editor, which allows you to run the code directly in the editor and see the result. Use `{monaco-run}` to turn the block into a Monaco Runner Editor.

````md
```ts {monaco-run}
function distance(x: number, y: number) {
  return Math.sqrt(x ** 2 + y ** 2)
}
console.log(distance(3, 4))
```
````

It provides the editor with a "Run" button, and shows the result of the code execution right below the code block. You may also modify the code and the result will be re-evaluated on the fly.

By default it will automatically run the code when the slide is loaded; if you want to instead explicitly trigger the run, you can set `{autorun:false}`.

````md
```ts {monaco-run} {autorun:false}
console.log('Click the play button to run me')
```
````

If you want to only show the output in certain clicks, you can use the `showOutputAt` prop. The value is the same as `v-click`.

````md
```ts {monaco-run} {showOutputAt:'+1'}
console.log('Shown after 1 click')
```
````

## Editor Height

By default, the Monaco editor has a fixed height based on the initial content. If you start with an empty or small code block and want the editor to automatically grow as you type more code, you can set `{height:'auto'}`.

````md
```ts {monaco-run} {autorun:false, height:'auto'}
// The editor will automatically grow as you type more code
console.log('Hello, World!')
```
````

You can also set a specific height using CSS units like `{height:'300px'}` or `{height:'100%'}`.

Currently, Slidev supports running JavaScript and TypeScript code out-of-box. Refer to [Custom Code Runners](/custom/config-code-runners) for custom language support.
