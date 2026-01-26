---
name: click-marker
description: Highlight and auto-scroll presenter notes based on click progress
---

# Click Markers

Highlight and auto-scroll presenter notes based on click progress.

## Syntax

Add `[click]` markers in presenter notes:

```md
<!--
Content before the first click

[click] This will be highlighted after the first click

Also highlighted after the first click

- [click] This list element highlights after the second click

[click:3] Last click (skip two clicks)
-->
```

## Behavior

- Notes between markers highlight in sync with slide progress
- Auto-scrolls presenter view to active section
- Use `[click:{n}]` to skip to specific click number

## Requirements

- Only works in presenter mode
- Notes must be HTML comments at end of slide
