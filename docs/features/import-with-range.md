---
layout: feature
depends:
  - guide/syntax#importing-slides
relates:
  - feature/frontmatter-merging
description: |
  Import specific slides from another Markdown file.
---

# Import Slides with Range

To reuse some of the slides inside another Markdown file, you can use the hash part of the import path:

```md
---
src: ./another-presentation.md#2,5-7
---
```

This will import the slides 2, 5, 6, and 7 from `./another-presentation.md`.
