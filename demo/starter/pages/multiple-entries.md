# Multiple Entries

You can split your slides.md into multiple files and organize them as you want.

#### `slides.md`

```markdown
# Page 1

This is a normal page

---
src: ./subpage2.md
hide: false # optionally set `hide` to true to avoid showing `./subpage2.md`
---

<!-- this page will be loaded from './subpage2.md' -->
Inline content will be ignored
```

#### `subpage2.md`

```markdown
# Page 2

This page is from another file
```
