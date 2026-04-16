---
name: monaco-run
description: Run code directly in the editor and see results
---

# Monaco Runner

Run code directly in the editor and see results.

## Basic Usage

````md
```ts {monaco-run}
function distance(x: number, y: number) {
  return Math.sqrt(x ** 2 + y ** 2)
}
console.log(distance(3, 4))
```
````

Shows a "Run" button and displays output below the code.

## Disable Auto-run

````md
```ts {monaco-run} {autorun:false}
console.log('Click the play button to run me')
```
````

## Show Output on Click

````md
```ts {monaco-run} {showOutputAt:'+1'}
console.log('Shown after 1 click')
```
````

## Supported Languages

- JavaScript
- TypeScript

For other languages, configure custom code runners in `/custom/config-code-runners`.
