---
foo: a
bar: 1
---

# Title

**Hello** World

[](./a)

```ts {a}
console.log('Hello World')
```

---
src: ../../../demo/starter/slides.md
s: 1
---

---

# Import Snippets

<<< @/snippets/snippet.js {2,3|5}
<<< @/snippets/snippet.js {2,3|5}{lines:true}
<<< @/snippets/snippet.js ts {monaco-run}{lines: true}

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
```

$$
\lambda = 1
$$
