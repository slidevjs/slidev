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

## Related Features

- Scale all slides: Use `canvasWidth` / `aspectRatio` in headmatter
- Scale elements: Use `<Transform>` component
