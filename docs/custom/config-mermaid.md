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
