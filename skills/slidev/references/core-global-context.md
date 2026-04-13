---
name: global-context
description: Access navigation, slide info, and configuration programmatically
---

# Global Context & API

Access navigation, slide info, and configuration programmatically.

## Template Variables

Available in slides and components:

```md
Page {{ $page }} of {{ $nav.total }}
Title: {{ $slidev.configs.title }}
```

### $nav

Navigation state and controls:

| Property | Type | Description |
|----------|------|-------------|
| `$nav.currentPage` | number | Current page (1-indexed) |
| `$nav.currentLayout` | string | Current layout name |
| `$nav.total` | number | Total slides |
| `$nav.isPresenter` | boolean | In presenter mode |
| `$nav.next()` | function | Next click/slide |
| `$nav.prev()` | function | Previous click/slide |
| `$nav.nextSlide()` | function | Next slide |
| `$nav.prevSlide()` | function | Previous slide |
| `$nav.go(n)` | function | Go to slide n |

### $slidev

Global context:

| Property | Description |
|----------|-------------|
| `$slidev.configs` | Project config (title, etc.) |
| `$slidev.themeConfigs` | Theme config |

### $frontmatter

Current slide frontmatter:

```md
Layout: {{ $frontmatter.layout }}
```

### $clicks

Current click count on slide.

### $page

Current page number (1-indexed).

### $renderContext

Current render context:
- `'slide'` - Normal slide view
- `'overview'` - Overview mode
- `'presenter'` - Presenter mode
- `'previewNext'` - Next slide preview

## Composables

Import from `@slidev/client`:

```ts
import {
  useNav,
  useDarkMode,
  useIsSlideActive,
  useSlideContext,
  onSlideEnter,
  onSlideLeave,
} from '@slidev/client'
```

### useNav

```ts
const nav = useNav()
nav.next()
nav.go(5)
console.log(nav.currentPage)
```

### useDarkMode

```ts
const { isDark, toggle } = useDarkMode()
```

### useIsSlideActive

```ts
const isActive = useIsSlideActive()
// Returns ref<boolean>
```

### useSlideContext

```ts
const { $page, $clicks, $frontmatter } = useSlideContext()
```

## Lifecycle Hooks

```ts
import { onSlideEnter, onSlideLeave } from '@slidev/client'

onSlideEnter(() => {
  // Slide became active
  startAnimation()
})

onSlideLeave(() => {
  // Slide became inactive
  cleanup()
})
```

**Important:** Don't use `onMounted`/`onUnmounted` in slides - component instance persists. Use `onSlideEnter`/`onSlideLeave` instead.

## Conditional Rendering Examples

```html
<!-- Show only in presenter mode -->
<div v-if="$nav.isPresenter">
  Presenter notes
</div>

<!-- Hide on cover slide -->
<footer v-if="$nav.currentLayout !== 'cover'">
  Page {{ $nav.currentPage }}
</footer>

<!-- Different content by context -->
<template v-if="$renderContext === 'slide'">
  Normal view
</template>
<template v-else-if="$renderContext === 'presenter'">
  Presenter view
</template>
```

## Type Imports

```ts
import type { TocItem } from '@slidev/types'
```
