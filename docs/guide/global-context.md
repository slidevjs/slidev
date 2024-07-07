# Global Context

Slidev injected a [global Vue context](https://v3.vuejs.org/api/application-config.html#globalproperties) `$slidev` for advanced conditions or navigation controls.

## Usage

You can access it anywhere in your Markdown and Vue components:

```md
<!-- slides.md -->

# Page 1

Current page is: {{ $nav.currentPage }}
```

```vue
<!-- Foo.vue -->

<template>
  <div>Title: {{ $slidev.configs.title }}</div>
  <button @click="$nav.next">Next Click</button>
  <button @click="$nav.nextSlide">Next Slide</button>
</template>
```

## Properties

### `$slidev`

The global context object.

### `$clicks`

`$clicks` hold the number of clicks on the current slide. Can be used conditionally to show different content on clicks.

```html
<div v-if="$clicks > 3">Content</div>
```

### `$page`

`$page` holds the number of the current page, 1-indexed.

```md
Page: {{ $page }}

Is current page active: {{ $page === $nav.currentPage }}
```

### `$renderContext`

`$renderContext` holds the current render context, which can be `slide`, `overview`, `presenter` or `previewNext`

```md
<div v-if="$renderContext === 'slide'">
  This content will only be rendered in slides view
</div>
```

### `$nav`

A reactive object holding the properties and controls of the slide navigation. For examples:

```js
$nav.next() // go next step

$nav.nextSlide() // go next slide (skip v-clicks)

$nav.go(10) // go slide #10
```

```js
$nav.currentPage // current slide number

$nav.currentLayout // current layout id
```

For more properties available, refer to the [`SlidevContextNav` interface](https://github.com/slidevjs/slidev/blob/main/packages/client/composables/useNav.ts).

> Note: `$nav.clicks` is a global state while `$clicks` is local to each slide. It's recommended to **use `$clicks` over `$nav.clicks`** to avoid clicks changed being triggered on page transitions.

### `$slidev.configs`

A reactive object holding the parsed [configurations in the first frontmatter](/custom/#frontmatter-configures) of your `slides.md`. For example:

```yaml
---
title: My First Slidev!
---
```

```
{{ $slidev.configs.title }} // 'My First Slidev!'
```

### `$slidev.themeConfigs`

A reactive object holding the parsed theme configurations.

```yaml
---
title: My First Slidev!
themeConfig:
  primary: # 213435
---
```

```
{{ $slidev.themeConfigs.primary }} // '#213435'
```

## Composable Usage

> Available since v0.48.0

### Context

If you want to get the context programmatically (also type-safely), you can import composables from `@slidev/client`:

```vue
<script setup>
import { onSlideEnter, onSlideLeave, useDarkMode, useIsSlideActive, useNav, useSlideContext } from '@slidev/client'

const { $slidev } = useSlideContext()
const { currentPage, currentLayout, currentSlideRoute } = useNav()
const { isDark } = useDarkMode()
const isActive = useIsSlideActive()
onSlideEnter(() => { /* ... */ })
onSlideLeave(() => { /* ... */ })
// ...
</script>
```

> [!NOTE]
> Previously, you might see the usage of importing nested modules like `import { isDark } from '@slidev/client/logic/dark.ts'`, this is **NOT RECOMMENDED** as they are internal implementation details and might be broken in the future. Try always to use the public API from `@slidev/client` whenever possible.

### Types

If you want to get a type programmatically, you can import types like `TocItem` from `@slidev/types`:

```vue
<script setup>
import type { TocItem } from '@slidev/types'

function tocFunc(tree: TocItem[]): TocItem[] {
  // ...
}
</script>
```
