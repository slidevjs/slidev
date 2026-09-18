---
name: zoom-slides
description: Scale individual slide content using the zoom frontmatter option
---

# Zoom Slides

Scale individual slide content.

## Usage

```md
---
zoom: 0.8
---

# A Slide with lots of content

---

# Other slides aren't affected
```

## Values

- `zoom: 0.8` - 80% size (fits more content)
- `zoom: 1.2` - 120% size (larger, less content)
- `zoom: 1` - Normal (default)

## Use Cases

- Fit dense content on one slide
- Make text more readable
- Adjust for different content densities

## Fit Guidance

Use `zoom` after choosing the slide structure. If only one object is too large, prefer a local `<Transform>` around that object. If the slide contains independent ideas, split it into multiple slides instead of shrinking everything.

Do not use one fixed `zoom` value as a substitute for checking the rendered output. Text, diagrams, and tables still need to remain readable after export.

## Related Features

- Content fit workflow: Use [layout-content-fit](layout-content-fit.md)
- Scale all slides: Use `canvasWidth` / `aspectRatio` in headmatter
- Scale elements: Use `<Transform>` component
