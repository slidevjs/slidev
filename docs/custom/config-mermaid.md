# Configure Mermaid

<Environment type="client" />

Create `./setup/mermaid.ts` with the following content:

```ts
import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  return {
    theme: 'forest',
  }
})
```

With the setup, you can provide a custom default setting for [Mermaid](https://mermaid-js.github.io/). Refer to the type definitions and its documentation for more details.

## Custom theme/styles

In case you want to create your custom Mermaid themes or styles, you can do this by defining `themeVariables` like in the following example:

```ts
import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  return {
    theme: 'base',
    themeVariables: {
      // General theme variables
      noteBkgColor: '#181d29',
      noteTextColor: '#F3EFF5cc',
      noteBorderColor: '#404551',

      // Sequence diagram variables
      actorBkg: '#0E131F',
      actorBorder: '#44FFD2',
      actorTextColor: '#F3EFF5',
      actorLineColor: '#F3EFF5',
      signalColor: '#F3EFF5',
      signalTextColor: '#F3EFF5',
    }
  }
})
```

You can find all theme variables on the [Mermaid Theme Configuration](https://mermaid.js.org/config/theming.html) page.
