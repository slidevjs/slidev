---
relates:
  - UnoCSS Variants: https://unocss.dev/config/variants#variants
since: v0.48.0
tags: [navigation, styling]
description: |
  Apply different styles and animations based on the navigation direction.
---

# Navigation Direction Variants

You may want to apply different classes based on whether it's navigating forward or backward. The `.slidev-nav-go-forward` or `.slidev-nav-go-backward` class will be applied to the slide container when navigating, and you can use them to apply different styles or animations:

```css
/* example: delay on only forward but not backward */
.slidev-nav-go-forward .slidev-vclick-target {
  transition-delay: 500ms;
}
.slidev-nav-go-backward .slidev-vclick-target {
  transition-delay: 0;
}
```

To make it easier, we also provided some [UnoCSS variants](https://github.com/slidevjs/slidev/blob/6adcf2016b8fb0cab65cf150221f1f67a76a2dd8/packages/client/uno.config.ts#L32-L38) for this. You can use the `forward:` or `backward:` prefix to any UnoCSS classes to only enable them in the specific navigation direction:

```html
<div v-click class="transition delay-300">Element</div> // [!code --]
<div v-click class="transition forward:delay-300">Element</div> // [!code ++]
```

In the above example, the animation is only delayed when navigating forward.
