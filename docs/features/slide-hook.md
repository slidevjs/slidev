---
depends:
  - guide/global-context
tags: [client-api]
description: |
  Hooks to manage the slide lifecycle.
---

# Slide Hooks

Slidev provides a set of hooks to help you manage the slide lifecycle:

```ts twoslash
import { onSlideEnter, onSlideLeave, useIsSlideActive } from '@slidev/client'

const isActive = useIsSlideActive()

onSlideEnter(() => {
  /* Called whenever the slide becomes active */
})

onSlideLeave(() => {
  /* Called whenever the slide becomes inactive */
})
```

You can also use <LinkInline link="guide/global-context" /> to access other useful context information.

::: warning

In the slide component, `onMounted` and `onUnmounted` hooks are not available, because the component instance is preserved even when the slide is not active. Use `onSlideEnter` and `onSlideLeave` instead.

:::
