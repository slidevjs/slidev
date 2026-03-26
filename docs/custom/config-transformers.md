# Configure Transformers

<Environment type="node" />

This setup function allows you to define custom transformers for the markdown content of **each slide**. This is useful when you want to add custom Markdown syntax and render custom code blocks. To start, create a `./setup/transformers.ts` file with the following content:

```ts twoslash [setup/transformers.ts]
import { defineCodeblockTransformer, defineMarkdownTransformer, defineTransformersSetup } from '@slidev/types'
import lz from 'lz-string'

const mySyntax = defineMarkdownTransformer((ctx) => {
  console.log('index in presentation', ctx.slide.index)
  ctx.s.replace(
    /^\[\[\[(.*)\]\]\]/gm,
    (full, content) => {
      return `...`
    },
  )
})

const myCodeblock = defineCodeblockTransformer((ctx) => {
  if (ctx.info.startsWith('myblock')) {
    console.log('index in presentation', ctx.slide?.index)
    return `<MyBlockRenderer code="${lz.compressToEncodedURIComponent(ctx.code)}" />`
  }
})

export default defineTransformersSetup(() => {
  return {
    // This applies before the Markdown is parsed, per slide
    pre: [mySyntax],
    // This applies per Markdown code block
    codeblock: [myCodeblock],
  }
})
```

> [!NOTE]
> When possible, implement `pre` transformers as markdown-it plugins for better robustness.
