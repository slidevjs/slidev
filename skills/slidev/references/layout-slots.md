---
name: slot-sugar
description: Shorthand syntax for layout named slots in multi-column layouts
---

# Slot Sugar for Layouts

Shorthand syntax for layout named slots.

## Standard Vue Slot Syntax

```md
---
layout: two-cols
---

<template v-slot:default>

# Left

This shows on the left

</template>
<template v-slot:right>

# Right

This shows on the right

</template>
```

## Shorthand Syntax

```md
---
layout: two-cols
---

# Left

This shows on the left

::right::

# Right

This shows on the right
```

## Explicit Default Slot

```md
---
layout: two-cols
---

::right::

# Right

This shows on the right

::default::

# Left

This shows on the left
```

## Common Layouts with Slots

- `two-cols`: `default` (left) and `right`
- `two-cols-header`: `default`, `left`, `right`
- `image-left/right`: `default` for content
