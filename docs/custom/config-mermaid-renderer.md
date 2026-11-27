# Configure Mermaid Renderer

<Environment type="client" />

1. The user installs the Mermaid library they want to use. e.g.) `npm install beautiful-mermaid`
2. Create `./setup/mermaid-renderer.ts` with the following content:

```ts
// setup/mermaid-renderer.ts
import { defineMermaidRendererSetup } from '@slidev/types'
// example. https://github.com/lukilabs/beautiful-mermaid?tab=readme-ov-file#readme
import { renderMermaid } from 'beautiful-mermaid'

export default defineMermaidRendererSetup(() => {
  return (code, _options) => renderMermaid(code)
})
```

This setting allows you to use the 3rd party Mermaid library. Replace the `renderMermaid()` part with the render function of the library.
