# Configure Transformers

<Environment type="node" />

This setup function allows you to define custom transformers for the markdown content of **each slide**. This is useful when you want to add custom Markdown syntax and render custom code blocks. To start, create a `./setup/transformers.ts` file with the following content:

````ts twoslash [setup/transformers.ts]
import type { MarkdownTransformContext } from '@slidev/types'
import { defineTransformersSetup } from '@slidev/types'

function myCodeblock(ctx: MarkdownTransformContext) {
  console.log('index in presentation', ctx.slide.index)
  ctx.s.replace(
    /^```myblock *(\{[^\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, options = '', code = '') => {
      return `...`
    },
  )
}

export default defineTransformersSetup(() => {
  return {
    pre: [],
    preCodeblock: [myCodeblock],
    postCodeblock: [],
    post: [],
  }
})
````

The return value should be the custom options for the transformers. The `pre`, `preCodeblock`, `postCodeblock`, and `post` are arrays of functions that will be called in order to transform the markdown content. The order of the transformers is:

1. `pre` from your project
2. `pre` from addons and themes
3. Import snippets syntax and Shiki magic move
4. `preCodeblock` from your project
5. `preCodeblock` from addons and themes
6. Built-in special code blocks like Mermaid, Monaco and PlantUML
7. `postCodeblock` from addons and themes
8. `postCodeblock` from your project
9. Other built-in transformers like code block wrapping
10. `post` from addons and themes
11. `post` from your project
