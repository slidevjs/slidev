---
name: direction
description: Navigation direction-based styling
---

# Navigation Direction Variants

Apply different styles based on navigation direction (forward/backward).

## CSS Classes

```css
/* Delay only when navigating forward */
.slidev-nav-go-forward .slidev-vclick-target {
  transition-delay: 500ms;
}
.slidev-nav-go-backward .slidev-vclick-target {
  transition-delay: 0;
}
```

## UnoCSS Variants

Use `forward:` or `backward:` prefix:

```html
<div v-click class="transition forward:delay-300">Element</div>
```

Animation is only delayed when navigating forward, not when going back.

## Use Case

Create asymmetric animations where entering a slide feels different from leaving it.
