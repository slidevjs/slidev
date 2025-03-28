---
relates:
  - Nuxt's MDC Syntax: https://content.nuxt.com/docs/files/markdown#mdc-syntax
  - markdown-it-mdc: https://github.com/antfu/markdown-it-mdc
since: v0.43.0
tags: [syntax, styling]
description: |
  A powerful syntax to enhance your markdown content with components and styles.
---

# MDC Syntax

Slidev supports optional [MDC (Markdown Components) Syntax](https://content.nuxt.com/docs/files/markdown#mdc-syntax) powered by [`markdown-it-mdc`](https://github.com/antfu/markdown-it-mdc).

You can enable it by adding `mdc: true` to the frontmatter of your markdown file.

```mdc
---
mdc: true
---

This is a [red text]{style="color:red"} :inline-component{prop="value"}

![](/image.png){width=500px lazy}

::block-component{prop="value"}
The **default** slot
::
```

Learn more about [MDC Syntax](https://content.nuxt.com/docs/files/markdown#mdc-syntax).
