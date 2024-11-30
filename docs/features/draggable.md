---
tags: [layout]
description: |
  Move, resize, and rotate elements by dragging them with the mouse.
---

# Draggable Elements

Draggable elements give you the ability to move, resize, and rotate elements by dragging them with the mouse. This is useful for creating floating elements in your slides.

## Directive Usage

### Data from the frontmatter

```md
---
dragPos:
  square: Left,Top,Width,Height,Rotate
---

<img v-drag="'square'" src="https://sli.dev/logo.png">
```

### Data from the directive value

::: warning
Slidev use regex to update the position value in the slide content. If you meet problems, please use the frontmatter to define the values instead.
:::

```md
<img v-drag="[Left,Top,Width,Height,Rotate]" src="https://sli.dev/logo.png">
```

## Component Usage

### Data from the frontmatter

```md
---
dragPos:
  foo: Left,Top,Width,Height,Rotate
---

<v-drag pos="foo" text-3xl>
  <div class="i-carbon:arrow-up" />
  Use the `v-drag` component to have a draggable container!
</v-drag>
```

### Data from props

```md
<v-drag pos="Left,Top,Width,Height,Rotate" text-3xl>
  <div class="i-carbon:arrow-up" />
  Use the `v-drag` component to have a draggable container!
</v-drag>
```

## Create a Draggable Element

When you create a new draggable element, you don't need to specify the position value (but you need to specify the position name if you want to use the frontmatter). Slidev will automatically generate the initial position value for you.

## Automatic Height

You can set `Height` to `NaN` (in) or `_` (if you use the component) to make the height of the draggable element automatically adjust to its content.

## Controls

- Double-click the draggable element to start dragging it.
- You can also use the arrow keys to move the element.
- Hold `Shift` while dragging to preserve its aspect ratio.
- Click outside the draggable element to stop dragging it.

## Draggable Arrow

The `<v-drag-arrow>` component creates a draggable arrow element. Simply use it like this:

```md
<v-drag-arrow />
```

And you will get a draggable arrow element. Other props are the same as [the `Arrow` component](/builtin/components#arrow).
