# Configure Shortcuts

<Environment type="client" />

## Getting started

Create `./setup/shortcuts.ts` with the following content:

```ts twoslash [./setup/shortcuts.ts]
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { defineShortcutsSetup } from '@slidev/types'

export default defineShortcutsSetup((nav: NavOperations, base: ShortcutOptions[]) => {
  return [
    ...base, // keep the existing shortcuts
    {
      key: 'enter',
      fn: () => nav.next(),
      autoRepeat: true,
    },
    {
      key: 'backspace',
      fn: () => nav.prev(),
      autoRepeat: true,
    },
  ]
})
```

In the setup function, you can customize the keyboard shortcuts by returning a new array of shortcuts. The above example binds the `next` operation to <kbd>enter</kbd> and the `prev` operation to <kbd>backspace</kbd>.

Please refer to [Navigation Actions](../guide/ui#navigation-actions) section for the default shortcuts and navigation operations.

## Key Binding Format

The `key` of each shortcut can be either a string (e.g. `'Shift+Ctrl+A'`) or a computed boolean. Please refer to [`useMagicKeys` from VueUse](https://vueuse.org/core/useMagicKeys/) for
