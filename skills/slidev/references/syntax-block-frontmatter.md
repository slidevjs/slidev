---
name: block-frontmatter
description: Using YAML code blocks as slide frontmatter for syntax highlighting
---

# Block Frontmatter

Use a YAML code block as the frontmatter for slides when you need syntax highlighting and formatter support.

## Usage

Instead of traditional frontmatter `---`, use a yaml code block at the start of a slide:

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

## Key Points

- Works for per-slide frontmatter only
- Cannot use for headmatter (first frontmatter of the deck)
- Provides syntax highlighting in editors
- Compatible with prettier-plugin-slidev
