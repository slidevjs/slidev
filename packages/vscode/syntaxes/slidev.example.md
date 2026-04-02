---
foo: a
bar: 1
---

# Example Slides

**Hello** World

[](./a)

```ts {a}
console.log('Hello World')
```

---

# Import Snippets

---
src: ./pages.md
---

---

# Vue Component

<div title="hi" />
<Comp :x="a" />

<script setup lang="ts">
import { ref } from 'vue'
let a = ref(1)
</script>

---
layout: center
text: 1
---

# Code block

```ts {1,2|3}
const a = 1
```

```ts twoslash
const a = 1
```

```vue {monaco-run}{showOutputAt: '+1'}
<template>
  <div />
</template>
```

```ts {monaco-run}{showOutputAt: '+1'} twoslash
const a = 1
const b = 2
```

$$
\lambda = 1
$$

---
layout: center
text: 2
---

# Magic Move

````md magic-move
```ts
const a = 1
```

```ts
const a = 1
const b = 2
const c = 3
```
````
