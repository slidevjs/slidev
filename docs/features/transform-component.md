---
layout: feature
relates:
  - guide/faq#adjust-size
  - feature/canvas-size
  - feature/zoom-slide
description: |
  A component for scaling some elements.
---

# The `Transform` Component

The `Transform` component allows you to scale the size of the elements on your slides:

```md
<Transform :scale="0.5">
  <YourElements />
</Transform>
```

This is useful when you want to adjust the size of some elements on your slides without affecting the layout of the entire slide.

To scale all the slides in your presentation, you can set the slide canvas size:

<LinkCard link="feature/canvas-size" />

To scale several slides in your presentation, you can use the `zoom` option:

<LinkCard link="feature/zoom-slide" />
