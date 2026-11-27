---
name: frontmatter
description: Configuration options for individual slides
---

# Per-Slide Frontmatter

Configuration options for individual slides.

## Layout

```yaml
---
layout: center
---
```

Available layouts: `default`, `cover`, `center`, `two-cols`, `two-cols-header`, `image`, `image-left`, `image-right`, `iframe`, `iframe-left`, `iframe-right`, `quote`, `section`, `statement`, `fact`, `full`, `intro`, `end`, `none`

## Background

```yaml
---
background: /image.jpg
backgroundSize: cover
class: text-white
---
```

## Click Count

```yaml
---
clicks: 5                   # Total clicks for this slide
clicksStart: 0              # Starting click number
---
```

## Transitions

```yaml
---
transition: fade            # Slide transition
---
```

Or different for forward/backward:

```yaml
---
transition: slide-left | slide-right
---
```

## Zoom

```yaml
---
zoom: 0.8                   # Scale content (0.8 = 80%)
---
```

## Hide Slide

```yaml
---
disabled: true              # Hide this slide
# or
hide: true
---
```

## Table of Contents

```yaml
---
hideInToc: true             # Hide from Toc component
level: 2                    # Override heading level
title: Custom Title         # Override slide title
---
```

## Import External File

```yaml
---
src: ./slides/intro.md      # Import markdown file
---
```

With specific slides:

```yaml
---
src: ./other.md#2,5-7       # Import slides 2, 5, 6, 7
---
```

## Route Alias

```yaml
---
routeAlias: intro           # URL: /intro instead of /1
---
```

## Preload

```yaml
---
preload: false              # Don't mount until entering
---
```

## Draggable Positions

```yaml
---
dragPos:
  logo: 100,50,200,100,0    # Left,Top,Width,Height,Rotate
  arrow: 300,200,50,50,45
---
```

## Image Layouts

```yaml
---
layout: image-left
image: /photo.jpg
backgroundSize: contain
class: my-custom-class
---
```

## Iframe Layouts

```yaml
---
layout: iframe
url: https://example.com
---
```

## Two Columns

```yaml
---
layout: two-cols
---

# Left Side

Content

::right::

# Right Side

Content
```

## Two Columns with Header

```yaml
---
layout: two-cols-header
---

# Header

::left::

Left content

::right::

Right content
```

## Full Example

```yaml
---
layout: center
background: /bg.jpg
class: text-white text-center
transition: fade
clicks: 3
zoom: 0.9
hideInToc: false
---

# Slide Content
```
