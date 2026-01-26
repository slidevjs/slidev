---
name: animations
description: Click animations, motion effects, and slide transitions
---

# Animations

Click animations, motion effects, and slide transitions.

## Click Animations

### v-click Directive

```md
<div v-click>Appears on click</div>
<div v-click>Appears on next click</div>
```

### v-clicks Component

Animate list items:

```md
<v-clicks>

- Item 1
- Item 2
- Item 3

</v-clicks>
```

With depth for nested lists:

```md
<v-clicks depth="2">

- Parent 1
  - Child 1
  - Child 2
- Parent 2

</v-clicks>
```

### Click Positioning

Relative positioning:
```md
<div v-click>1st (default)</div>
<div v-click="+1">2nd</div>
<div v-click="-1">Same as previous</div>
```

Absolute positioning:
```md
<div v-click="3">Appears on click 3</div>
<div v-click="[2,5]">Visible clicks 2-5</div>
```

### v-after

Show with previous element:

```md
<div v-click>Main element</div>
<div v-after>Appears with main element</div>
```

### v-switch

Conditional rendering by click:

```md
<v-switch>
  <template #1>First state</template>
  <template #2>Second state</template>
  <template #3>Third state</template>
</v-switch>
```

## Custom Click Count

```md
---
clicks: 10
---
```

Or starting from specific count:

```md
---
clicksStart: 5
---
```

## Motion Animations

Using @vueuse/motion:

```md
<div
  v-motion
  :initial="{ x: -100, opacity: 0 }"
  :enter="{ x: 0, opacity: 1 }"
>
  Animated content
</div>
```

Click-based motion:

```md
<div
  v-motion
  :initial="{ scale: 1 }"
  :click-1="{ scale: 1.5 }"
  :click-2="{ scale: 1 }"
>
  Scales on clicks
</div>
```

## Slide Transitions

In headmatter (all slides):

```md
---
transition: slide-left
---
```

Per-slide:

```md
---
transition: fade
---
```

### Built-in Transitions

- `fade` / `fade-out`
- `slide-left` / `slide-right`
- `slide-up` / `slide-down`
- `view-transition` (View Transitions API)

### Directional Transitions

Different transitions for forward/backward:

```md
---
transition: slide-left | slide-right
---
```

### Custom Transitions

Define CSS classes:

```css
.my-transition-enter-active,
.my-transition-leave-active {
  transition: all 0.5s ease;
}
.my-transition-enter-from,
.my-transition-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
```

Use: `transition: my-transition`

## CSS Classes

Animation targets get these classes:
- `.slidev-vclick-target` - Animated element
- `.slidev-vclick-hidden` - Hidden state
- `.slidev-vclick-current` - Current click target
- `.slidev-vclick-prior` - Previously shown

## Default Animation CSS

```css
.slidev-vclick-target {
  transition: opacity 100ms ease;
}
.slidev-vclick-hidden {
  opacity: 0;
  pointer-events: none;
}
```
