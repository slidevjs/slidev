---
name: prettier-plugin
description: Format Slidev markdown files correctly
---

# Prettier Plugin

Format Slidev markdown files correctly.

## Installation

```bash
pnpm i -D prettier prettier-plugin-slidev
```

## Configuration

Create/modify `.prettierrc`:

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

## Why Needed

Slidev's syntax (frontmatter, code blocks) may conflict with default Markdown formatting. This plugin understands Slidev-specific syntax.

## Note

Must specify files via `overrides` since Slidev and regular Markdown share `.md` extension.
