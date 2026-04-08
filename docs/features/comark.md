---
relates:
  - Comark Syntax: https://comark.dev/syntax/markdown
  - '@comark/markdown-it': https://github.com/comarkdown/comark
since: v0.43.0
tags: [syntax, styling]
description: |
  A powerful syntax to enhance your markdown content with components and styles.
---

# Comark Syntax

Slidev supports optional [Comark Syntax](https://comark.dev/syntax/markdown) (formerly known as MDC, Markdown Components) powered by [`@comark/markdown-it`](https://github.com/comarkdown/comark).

You can enable it by adding `comark: true` to the frontmatter of your markdown file.

```mdc
---
comark: true
---

This is a [red text]{style="color:red"} :inline-component{prop="value"}

![](/image.png){width=500px lazy}

::block-component{prop="value"}
The **default** slot
::
```

Learn more about [Comark Syntax](https://comark.dev/syntax/markdown).
