# Configure Code Runners

<Environment type="client" />

Define code runners for custom languages in your Monaco Editor.

By default, JavaScript, TypeScript runners are supported built-in. They runs in the browser with **without** sandbox environment. If you want to more advanced integrations, you might want to provide your own code runners that sends the code to a remote server, runs in a Web Worker, or anything, up to you.

Create `./setup/code-runners.ts` with the following content:

```ts
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

```ts
export interface CodeRunnerContext {
  /**
   * Options passed to runner via the `runnerOptions` prop.
   */
  options: Record<string, unknown>
  /**
   * Highlight code with shiki.
   */
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => Promise<string>
  /**
   * Use (other) code runner to run code.
   */
  run: (code: string, lang: string) => Promise<CodeRunnerOutputs>
}
```

## Runner Output

The runner can either return a text or HTML output, or an element to be mounted. Refer to https://github.com/slidevjs/slidev/blob/main/packages/types/src/code-runner.ts for more details.
