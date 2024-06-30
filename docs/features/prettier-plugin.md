---
layout: feature
relates:
  - feature/block-frontmatter
  - GitHub Repo: https://github.com/slidevjs/prettier-plugin
  - Prettier: https://prettier.io/
description: |
  Use the Prettier plugin to format your slides.
---

# Prettier Plugin

The Slidev's syntax may be incompatible with the default Markdown parser of [Prettier](https://prettier.io/). To solve this, Slidev provides a Prettier plugin to format your slides. You can use it with your favorite editor that supports Prettier.

## 1. Install

```bash
npm i -D prettier prettier-plugin-slidev
```

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
