# Configure Monaco

<Environment type="client" />

Create `./setup/monaco.ts` with the following content:

```ts twoslash [./setup/monaco.ts]
import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(async (monaco) => {
  // use `monaco` to configure
})
```

Learn more about [configuring Monaco](https://github.com/Microsoft/monaco-editor).

## TypeScript Types

When using TypeScript with Monaco, types for dependencies will be installed to the client-side automatically.

````md
```ts {monaco}
import { ref } from 'vue'
import { useMouse } from '@vueuse/core'

const counter = ref(0)
```
````

In the example above, make sure `vue` and `@vueuse/core` are installed locally as dependencies / devDependencies, Slidev will handle the rest to get the types working for the editor automatically. When deployed as SPA, those types will also be bundled for static hosting.

### Additional Types

Slidev will scan all the Monaco code blocks in your slides and import the types for those used libraries for you. In case it missed some, you can explicitly specify extra packages to import the types for:

```md
---
monacoTypesAdditionalPackages:
  - lodash-es
  - foo
---
```

### Auto Type Acquisition

You can optionally switch to load types from CDN by setting the following headmatter:

```md
---
monacoTypesSource: ata
---
```

This feature is powered by [`@typescript/ata`](https://github.com/microsoft/TypeScript-Website/tree/v2/packages/ata) and runs completely on the client-side.

## Configure Themes

Since v0.48.0, Monaco will reuse the Shiki theme you configured in [Shiki's setup file](/custom/config-highlighter#configure-shiki), powered by [`@shikijs/monaco`](https://shiki.style/packages/monaco). You don't need to worry about it anymore and it will have a consistent style with the rest of your code blocks.

## Configure the Editor

> Available since v0.43.0

If you would like to customize the Monaco editor you may pass an `editorOptions` object that matches the [Monaco IEditorOptions](https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IEditorOptions.html) definition.

````md
```ts {monaco} { editorOptions: { wordWrap:'on'} }
console.log('HelloWorld')
```
````

Alternatively if you would like these options to be applied to every Monaco instance, you can return them in the `defineMonacoSetup` function

```ts twoslash [./setup/monaco.ts]
import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(() => {
  return {
    editorOptions: {
      wordWrap: 'on'
    }
  }
})
```

## Disabling

Since v0.48.0, the Monaco editor is enabled by default and only be bundled when you use it. If you want to disable it, you can set `monaco` to `false` in the frontmatter of your slide:

```yaml
---
monaco: false # can also be `dev` or `build` to conditionally enable it
---
```

## Configure Code Runners

To configure how the Monaco Runner runs the code, or to add support for custom languages, please reference [Configure Code Runners](/custom/config-code-runners).
