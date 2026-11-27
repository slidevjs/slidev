# Configure Routes

<Environment type="client" />

Add custom pages to the Slidev app.

## Usage

Create `./setup/routes.ts` with the following content:

```ts twoslash [./setup/routes.ts]
import { defineRoutesSetup } from '@slidev/types'

export default defineRoutesSetup((routes) => {
  return [
    ...routes,
    {
      path: '/my-page',
      // ---cut-start---
      // @ts-expect-error missing types
      // ---cut-end---
      component: () => import('../pages/my-page.vue'),
    },
  ]
})
```

Learn more about routes in the [Vue Router documentation](https://router.vuejs.org/).
