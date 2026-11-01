---
depends:
  - guide/exporting
  - guide/animations#click-animation
relates:
  - CLI export options: /builtin/cli#export
  - Headmatter export options: /custom/#headmatter
tags: [export, animation]
description: |
  Choose which click steps of a slide are exported.
---

# Export Click Steps per Slide

By default, Slidev exports every slide as a single page in its final state, and with the `--with-clicks` option as one page per click step. You can override this for individual slides with the `exportClicks` option in their frontmatter:

```md
---
exportClicks: false
---

# One page in the final state, even with `--with-clicks`

---

exportClicks: true
---

# One page per click step, even without `--with-clicks`

---

exportClicks: [0, 2, 4]
---

# One page each for click 0, 2 and 4

---

exportClicks: '0,2-4,last'
---

# The same, plus a page for the final state

---

exportClicks: []
---

# Not exported at all
```

The steps follow the syntax of the `--range` option: single clicks, ranges like `2-4`, and open ranges like `6-` up to the final state. `last` stands for the final state, whatever the number of clicks of the slide is. Steps outside of the slide's click range are clamped to it.

Slides without this option follow the `--with-clicks` option of the CLI, or the `withClicks` field of the `export` option in the headmatter:

<LinkCard link="guide/exporting#export-clicks-steps" />
