---
name: transform-component
description: Scale elements without affecting slide layout using the Transform component
---

# Transform Component

Scale elements without affecting slide layout.

## Usage

```md
<Transform :scale="0.5" origin="top center">
  <YourElements />
</Transform>
```

## Props

- `scale`: Scale factor (0.5 = 50%, 2 = 200%)
- `origin`: Transform origin (CSS transform-origin value)

## Use Cases

- Shrink large diagrams
- Scale code blocks
- Fit oversized content
- Create emphasis effects

## Fit Guidance

Use `<Transform>` when one region is oversized but the rest of the slide is already readable. Keep the transform local to the diagram, table, image, or component that needs scaling.

Prefer `origin="top left"` or `origin="top center"` for content that should stay aligned with surrounding text. After scaling, check neighboring slots to make sure the transformed content does not overlap or get clipped.

## Related Features

- Content fit workflow: Use [layout-content-fit](layout-content-fit.md)
- Scale all slides: Use `canvasWidth` / `aspectRatio` in headmatter
- Scale individual slides: Use `zoom` frontmatter option
