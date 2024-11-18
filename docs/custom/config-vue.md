# Configure Vue App

<Environment type="client" />

Slidev uses [Vue 3](https://v3.vuejs.org/) to render the application on the client side. You can extend the app to add custom plugins or configurations.

Create `./setup/main.ts` with the following content:

<!-- eslint-disable import/first -->

```ts twoslash
import type { Plugin } from 'vue'
declare const YourPlugin: Plugin
// ---cut---
import { defineAppSetup } from '@slidev/types'

export default defineAppSetup(({ app, router }) => {
  // Vue App
  app.use(YourPlugin)
})
```

This can also be used as the main entrance of your Slidev app to do some initializations before the app starts.

Learn more: [Vue Application API](https://v3.vuejs.org/api/application-api.html#component).
