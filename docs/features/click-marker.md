---
depends:
  - guide/syntax#notes
  - guide/animations
since: v0.48.0
tags: [presenter, animation]
description: |
  Highlighting notes and auto-scrolling to the active section of notes.
---

# Click Markers

For some slides you may have longer notes that could be hard to find your place. Slidev supports click markers that allow highlighting and auto-scrolling to the section of notes from your corresponding content. Put `[click]` markers at the beginning of any line in your notes for the timing you need to go to another [click](/guide/animations#click-animation). You may skip `n` clicks by using `[click:{n+1}]`. For example:

```md
<!--
Content before the first click

[click] This will be highlighted after the first click

Also highlighted after the first click

- [click] This list element will be highlighted after the second click

[click:3] Last click (skip two clicks)
-->
```

Slidev divides the content between the click markers and highlights it in presenter notes, synchronized with your slide progress.

<video src="https://github.com/slidevjs/slidev/assets/11247099/40014e34-67cd-4830-8c8d-8431754a3672" controls rounded shadow w-full></video>
