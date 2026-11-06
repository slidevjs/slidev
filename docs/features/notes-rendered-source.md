---
depends:
  - features/notes-auto-ruby
tags: [notes, presenter, codeblock]
description: |
  View presenter notes as rendered Markdown or as syntax-highlighted source, with code blocks highlighted in both.
---

# Notes: Rendered & Source

> Available since v53.1.0

The presenter view shows slide notes in two tabs:

- **Rendered** — the notes as Markdown (default).
- **Source** — the raw Markdown, syntax-highlighted.

Both tabs syntax-highlight fenced code blocks using Shiki with the `github-light` / `github-dark` themes, so notes stay readable in light and dark mode.

````md
<!--
## Slide notes

```ts
const timing = useTiming()
const m = timing.timing.value
console.log(m.pace)
```
-->
````

Long code lines wrap instead of scrolling horizontally, which keeps notes usable in the presenter window and in print/export.
