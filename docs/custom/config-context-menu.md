# Configure Context Menu

<Environment type="client" />

Customize the context menu items in Slidev.

Create `./setup/context-menu.ts` with the following content:

<!-- eslint-disable import/first -->

```ts twoslash [./setup/context-menu.ts]
// ---cut---
import { useNav } from '@slidev/client'
import { defineContextMenuSetup } from '@slidev/types'
import { computed } from 'vue'
// ---cut-start---
// @ts-expect-error missing types
// ---cut-end---
import Icon3DCursor from '~icons/carbon/3d-cursor'

export default defineContextMenuSetup((items) => {
  const { isPresenter } = useNav()
  return computed(() => [
    ...items.value,
    {
      small: false,
      icon: Icon3DCursor, // if `small` is `true`, only the icon is shown
      label: 'Custom Menu Item', // or a Vue component
      action() {
        alert('Custom Menu Item Clicked!')
      },
      disabled: isPresenter.value,
    },
  ])
})
```

This will append a new menu item to the context menu.

To disable context menu globally, set `contextMenu` to `false` in the frontmatter. `contextMenu` can also be set to `dev` or `build` to only enable the context menu in development or build mode.
