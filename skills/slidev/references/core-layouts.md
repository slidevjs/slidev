---
name: layouts
description: Available layouts for slides
---

# Built-in Layouts

Available layouts for slides.

## Basic Layouts

### default

Standard slide layout.
```yaml
---
layout: default
---
```

### center

Content centered horizontally and vertically.
```yaml
---
layout: center
---
```

### cover

Title/cover slide with centered content.
```yaml
---
layout: cover
---
```

### end

End slide.
```yaml
---
layout: end
---
```

### full

Full-screen content, no padding.
```yaml
---
layout: full
---
```

### none

No layout styling.
```yaml
---
layout: none
---
```

## Text Layouts

### intro

Introduction slide.
```yaml
---
layout: intro
---
```

### quote

Large quotation display.
```yaml
---
layout: quote
---
```

### section

Section divider.
```yaml
---
layout: section
---
```

### statement

Statement/affirmation display.
```yaml
---
layout: statement
---
```

### fact

Fact/data display.
```yaml
---
layout: fact
---
```

## Multi-Column Layouts

### two-cols

Two columns side by side:
```md
---
layout: two-cols
---

# Left Column

Left content

::right::

# Right Column

Right content
```

### two-cols-header

Header with two columns below:
```md
---
layout: two-cols-header
---

# Header

::left::

Left content

::right::

Right content
```

## Image Layouts

### image

Full-screen image:
```yaml
---
layout: image
image: /photo.jpg
backgroundSize: cover
---
```

### image-left

Image on left, content on right:
```yaml
---
layout: image-left
image: /photo.jpg
class: my-class
---

# Content on Right
```

### image-right

Image on right, content on left:
```yaml
---
layout: image-right
image: /photo.jpg
---

# Content on Left
```

Props: `image`, `class`, `backgroundSize`

## Iframe Layouts

### iframe

Full-screen iframe:
```yaml
---
layout: iframe
url: https://example.com
---
```

### iframe-left

Iframe on left, content on right:
```yaml
---
layout: iframe-left
url: https://example.com
---

# Content
```

### iframe-right

Iframe on right, content on left:
```yaml
---
layout: iframe-right
url: https://example.com
---

# Content
```

## Layout Loading Order

1. Slidev default layouts
2. Theme layouts
3. Addon layouts
4. Custom layouts (`./layouts/`)

Later sources override earlier ones.

## Custom Layouts

Create `layouts/my-layout.vue`:

```vue
<template>
  <div class="slidev-layout my-layout">
    <slot />
  </div>
</template>

<style scoped>
.my-layout {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

With named slots:

```vue
<template>
  <div class="slidev-layout two-areas">
    <div class="top">
      <slot name="top" />
    </div>
    <div class="bottom">
      <slot />
    </div>
  </div>
</template>
```

Usage:
```md
---
layout: two-areas
---

::top::

Top content

::default::

Bottom content
```
