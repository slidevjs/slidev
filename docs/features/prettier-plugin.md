---
relates:
  - features/block-frontmatter
  - GitHub Repo: https://github.com/slidevjs/prettier-plugin
  - Prettier: https://prettier.io/
tags: [editor]
description: |
  Use the Prettier plugin to format your slides.
---

# Prettier Plugin

The Slidev's syntax may be incompatible with the default Markdown parser of [Prettier](https://prettier.io/). To solve this, Slidev provides a Prettier plugin to format your slides. You can use it with your favorite editor that supports Prettier.

## 1. Install

::: code-group

```bash [npm]
npm i -D prettier prettier-plugin-slidev
```

```bash [pnpm]
pnpm i -D prettier prettier-plugin-slidev
```

```bash [yarn]
yarn add -D prettier prettier-plugin-slidev
```

```bash [bun]
bun add -D prettier prettier-plugin-slidev
```

```bash [deno]
deno add -D npm:prettier npm:prettier-plugin-slidev
```

:::

## 2. Activate the plugin

Create or modify your [prettier configuration file](https://prettier.io/docs/en/configuration) to activate the plugin:

```json
{
  "overrides": [
    {
      "files": ["slides.md", "pages/*.md"],
      "options": {
        "parser": "slidev",
        "plugins": ["prettier-plugin-slidev"]
      }
    }
  ]
}
```

Note that only specifying `plugins` is not enough, because Slidev and common Markdown files share the same file extension `.md`.
