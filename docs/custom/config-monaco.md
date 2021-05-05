# Configure Monaco

> Monaco support is experimental. There is a known issue that Monaco's elements will be misplaced when the slides scaling. We are working on it trying to find a solution. Before that, the workaround there is to set the scale to `1:1` and use the browser's zoom to manual scale to the similar size of your screen.

Create `./setup/monaco.ts` with the following content:

```ts
import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(async (monaco) => {
  // use `monaco` to configure
})
```

Learn more about [configuring Monaco](https://github.com/Microsoft/monaco-editor).

## Usage

To use Monaco in your slides, simply append `{monaco}` to your code snippets:

~~~js
//```js
const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // error
//```
~~~

To

~~~js
//```js {monaco}
const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // error
//```
~~~

## Exporting

By default, Monaco will ONLY work on `dev` mode. If you would like to have it also on the exported SPA, you can configure it in your frontmatter:

```yaml
---
monaco: true # default "dev"
---
```

## Types Auto Installing

When you use TypeScript with Monaco, types for dependencies will be installed to the client-side automatically.

~~~ts
//```ts {monaco}
import { ref } from 'vue'
import { useMouse } from '@vueuse/core'

const counter = ref(0)
//```
~~~

In the example above, just make sure `vue` and `@vueuse/core` are installed locally as dependencies / devDependencies, Slidev will handle the rest and your editor will just work!
