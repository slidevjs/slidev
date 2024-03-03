---
layout: cover
fonts:
  sans: Roboto, Lato
  serif: Mate SC
  mono: Fira Code
---

# Hi

---
meta:
  title: FooBar
  duration: 12
layout: center
---

# Hello

<!--
This is note
-->

---

# Morning

---
layout: text
---

<!-- This is not note -->
Hey

<!--
This is note
-->

---

```md
---
this should be treated as code block
---

---

Also part of the code block
```

---

```yaml
# The first yaml block should be treated as frontmatter
layout: from yaml
```

Content 1

---
layout: cover
---

```yaml
# When there is already a frontmatter, the first yaml block should be treated as content
layout: should not from yaml 1
```

Content 2

---

# Title

```yaml
# When there is already a frontmatter, the first yaml block should be treated as content
layout: should not from yaml 2
```

Content 3
