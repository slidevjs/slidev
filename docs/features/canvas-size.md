---
layout: feature
relates:
  - guide/faq#adjust-size
  - feature/zoom-slide
  - feature/transform-component
description: |
  Set the size for all your slides.
---

# Slide Canvas Size

Slidev allows you to set the size of the slide canvas via the `canvasWidth` and `aspectRatio` options in the headmatter:

```md
---
# aspect ratio for the slides
aspectRatio: 16/9
# real width of the canvas, unit in px
canvasWidth: 980
---

# Your slides here
```

To scale several slides in your presentation, you can use the `zoom` option:

<LinkCard link="feature/zoom-slide" />

To adjust the size of some elements on your slides, you can use the `Transform` component:

<LinkCard link="feature/transform-component" />
