---
name: draggable-elements
description: Move, resize, and rotate elements by dragging during presentation
---

# Draggable Elements

Move, resize, and rotate elements by dragging during presentation.

## Directive Usage

### With Frontmatter Position

```md
---
dragPos:
  square: Left,Top,Width,Height,Rotate
---

<img v-drag="'square'" src="https://sli.dev/logo.png">
```

### Inline Position

```md
<img v-drag="[Left,Top,Width,Height,Rotate]" src="https://sli.dev/logo.png">
```

## Component Usage

```md
---
dragPos:
  foo: Left,Top,Width,Height,Rotate
---

<v-drag pos="foo" text-3xl>
  Draggable content
</v-drag>
```

## Draggable Arrow

```md
<v-drag-arrow />
```

## Controls

- Double-click: Start dragging
- Arrow keys: Move element
- Shift + drag: Preserve aspect ratio
- Click outside: Stop dragging

## Auto Height

Set Height to `NaN` or `_` for auto height based on content.
