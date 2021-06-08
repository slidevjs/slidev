# Configure Shortcuts

> Available since v0.20

<Environment type="client" />

Create `./setup/shortcuts.ts` with the following content:

```ts
import { defineShortcutsSetup, NavOperations } from '@slidev/types'

export default defineShortcutsSetup((nav: NavOperations) => {
  return [
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

With the setup, you can provide the custom setting for shortcuts mentioned in [Navigation](/guide/navigation#navigation-bar). The above configuration binds next animation or slide to <kbd>enter</kbd> and previous animation or slide to <kbd>backspace</kbd>.

The configuration function receives an object with some navigation methods, and returns an array containing some shortcut configuration. Refer to the type definitions for more details.

Refer to [useMagicKeys | VueUse](https://vueuse.org/core/useMagicKeys/) for more details about key pressed event.
