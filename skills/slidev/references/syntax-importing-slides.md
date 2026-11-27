---
name: importing-slides
description: Split presentations into multiple files for reusability
---

# Importing Slides

Split presentations into multiple files for reusability.

## Basic Import

```md
# Title

This is a normal page

---
src: ./pages/toc.md
---

<!-- Content here is ignored -->

---

# Page 4

Another normal page
```

## Import Specific Slides

Use hash to select slides:

```md
---
src: ./another-presentation.md#2,5-7
---
```

Imports slides 2, 5, 6, and 7.

## Reuse Slides

Import the same file multiple times:

```md
---
src: ./pages/toc.md
---

<!-- later... -->

---
src: ./pages/toc.md
---
```

## Frontmatter Priority

Main entry frontmatter overrides imported file frontmatter for duplicate keys.
