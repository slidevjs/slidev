# Configure Code Runners

<Environment type="client" />

Define code runners for custom languages in your Monaco Editor.

By default, JavaScript, TypeScript runners are supported built-in. They run in the browser **without** a sandbox environment. If you want more advanced integrations, you can provide your own code runner that sends the code to a remote server, runs in a Web Worker, or anything, up to you.

Create `./setup/code-runners.ts` with the following content:

<!-- eslint-disable import/first -->

```ts twoslash [setup/code-runners.ts]
declare const executePythonCodeRemotely: (code: string) => Promise<string>
declare const sanitizeHtml: (html: string) => string
// ---cut---
import { defineCodeRunnersSetup } from '@slidev/types'

export default defineCodeRunnersSetup(() => {
  return {
    async python(code, ctx) {
      // Somehow execute the code and return the result
      const result = await executePythonCodeRemotely(code)
      return {
        text: result
      }
    },
    html(code, ctx) {
      return {
        html: sanitizeHtml(code)
      }
    },
    // or other languages, key is the language id
  }
})
```

## Runner Context

The second argument `ctx` is the runner context, which contains the following properties:

```ts twoslash
import type { CodeRunnerOutputs } from '@slidev/types'
import type { CodeToHastOptions } from 'shiki'
// ---cut---
export interface CodeRunnerContext {
  /**
   * Options passed to runner via the `runnerOptions` prop.
   */
  options: Record<string, unknown>
  /**
   * Highlight code with shiki.
   */
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => string
  /**
   * Use (other) code runner to run code.
   */
  run: (code: string, lang: string) => Promise<CodeRunnerOutputs>
}
```

## Runner Output

The runner can either return a text or HTML output, or an element to be mounted. Refer to https://github.com/slidevjs/slidev/blob/main/packages/types/src/code-runner.ts for more details.

## Additional Runner Dependencies

By default, Slidev will scan the Markdown source and automatically import the necessary dependencies for the code runners. If you want to manually import dependencies, you can use the `monacoRunAdditionalDeps` option in the slide frontmatter:

```yaml
monacoRunAdditionalDeps:
  - ./path/to/dependency
  - lodash-es
```

::: tip
The paths are resolved relative to the `snippets` directory. And the names of the deps should be exactly the same as the imported ones in the code.
:::
