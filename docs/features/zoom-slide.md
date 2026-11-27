---
relates:
  - guide/faq#adjust-size
  - features/canvas-size
  - features/transform-component
tags: [layout]
description: |
  Zoom the content of a slide to a specific scale.
---

# Zoom Slides

You may find some slides in your presentation too spacious or too crowded. Slidev provides a `zoom` option for each slide that allows you to scale the content of a slide:

```md
---
zoom: 0.8
---

# A Slide with lots of content

---

# Other slides aren't affected
```

To scale all the slides in your presentation, you can set the slide canvas size:

<LinkCard link="features/canvas-size" />

To adjust the size of some elements on your slides, you can use the `Transform` component:

<LinkCard link="features/transform-component" />
