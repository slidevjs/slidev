---
name: code-groups
description: Group multiple code blocks with tabs and automatic icons
---

# Code Groups

Group multiple code blocks with tabs and automatic icons.

## Requirements

Enable MDC syntax in headmatter:

```md
---
mdc: true
---
```

## Syntax

````md
::code-group

```sh [npm]
npm i @slidev/cli
```

```sh [yarn]
yarn add @slidev/cli
```

```sh [pnpm]
pnpm add @slidev/cli
```

::
````

## Title Icon Matching

Icons auto-match by title name. Install `@iconify-json/vscode-icons` for built-in icons.

Supported: npm, yarn, pnpm, bun, deno, vue, react, typescript, javascript, and many more.

## Custom Icons

Use `~icon~` syntax in title:

````md
```js [npm ~i-uil:github~]
console.log('Hello!')
```
````

Requires:
1. Install icon collection: `pnpm add @iconify-json/uil`
2. Add to safelist in `uno.config.ts`:

```ts
export default defineConfig({
  safelist: ['i-uil:github']
})
```
