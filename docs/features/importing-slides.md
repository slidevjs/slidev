---
relates:
  - features/frontmatter-merging
tags: [syntax]
description: |
  Split your `slides.md` into multiple files for better reusability and organization.
---

# Importing Slides

You can split your `slides.md` into multiple files for better reusability and organization. To do this, you can use the `src` frontmatter option to specify the path to the external markdown file. For example:

::: code-group

<!-- eslint-skip -->

```md [./slides.md]
# Title

This is a normal page

---
src: ./pages/toc.md // [!code highlight]
---

<!-- this page will be loaded from './pages/toc.md' -->

Contents here are ignored

---

# Page 4

Another normal page

---
src: ./pages/toc.md   # Reuse the same file // [!code highlight]
---
```

```md [./pages/toc.md]
# Table of Contents

Part 1

---

# Table of Contents

Part 2
```

:::

## Importing Specific Slides

To reuse some of the slides inside another Markdown file, you can use the hash part of the import path:

```md
---
src: ./another-presentation.md#2,5-7
---
```

This will import the slides 2, 5, 6, and 7 from `./another-presentation.md`.

## Frontmatter Merging

<LinkCard link="features/frontmatter-merging" />
