---
depends:
  - guide/syntax#importing-slides
  - features/importing-slides
tags: [syntax]
description: |
  Merge frontmatter from multiple markdown files.
---

# Frontmatter Merging

You can provide frontmatter instructions from both your main entry and external markdown pages. If there are duplicate keys in them, the ones from the **main entry have the higher priority**. For example:

::: code-group

```md [./slides.md]
---
src: ./cover.md
background: https://sli.dev/bar.png // [!code highlight]
class: text-center
---
```

```md [./cover.md]
---
layout: cover
background: https://sli.dev/foo.png // [!code highlight]
---

# Cover

Cover Page
```

:::

They will end up being equivalent to the following page:

```md
---
layout: cover
background: https://sli.dev/bar.png // [!code highlight]
class: text-center
---

# Cover

Cover Page
```

## Importing Multiple Slides

When an external markdown file contains multiple slides, frontmatter next to `src` applies to **every imported slide**, not just the first one. This also applies when you [import specific slides](/features/importing-slides#importing-specific-slides).

For example, the following sets `class: text-center` on every slide imported from `./chapter.md`:

```md [./slides.md]
---
src: ./chapter.md
class: text-center
---
```

To configure only the first imported slide, put the frontmatter in the imported file itself. For example, put `clicks: 4` in `./chapter.md` so that only its first slide requires four clicks:

```md [./chapter.md]
---
clicks: 4
---

# Chapter Opening

---

# Next Slide
```

Putting `clicks: 4` next to `src` instead would override the click count of every imported slide, including slides that define their own `clicks` value.
