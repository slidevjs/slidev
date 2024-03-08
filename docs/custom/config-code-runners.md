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
