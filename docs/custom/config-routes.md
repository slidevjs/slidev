# Configure Routes

<Environment type="client" />

Add your pages to the Slidev app.

## Usage

Create `./setup/routes.ts` with the following content:

```ts
import { defineRoutesSetup } from '@slidev/types'

export default defineRoutesSetup((routes) => {
  return [
    ...routes,
    {
      path: '/my-page',
      component: () => import('../pages/my-page.vue'),
    },
  ]
})
```

Learn more about routes in the [Vue Router documentation](https://router.vuejs.org/).
