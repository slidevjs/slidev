---
depends:
  - guide/syntax
relates:
  - features/prettier-plugin
tags: [syntax]
description: |
  Use a YAML code block as the frontmatter.
---

# Block Frontmatter

The usual way to define frontmatters of slides is concise, but may lack of highlighting and formatter support. To solve this, you can use a YAML block at the very beginning of the slide content as the frontmatter of the slide:

````md
---
theme: default
---

# Slide 1

---

```yaml
layout: quote
```

# Slide 2

---

# Slide 3
````

::: warning About headmatter

Headmatter in Slidev is exactly the usual called "frontmatter" of the a Markdown file, which is supported by most of the Markdown editors and formatters. So you can't use a YAML block as the headmatter of the whole slide deck.

:::
