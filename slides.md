---
layout: cover
---

# Composable Vue

Pattens and tips for writing good composable logic in Vue

<div class="uppercase text-sm tracking-widest">
Anthony Fu
</div>

---
layout: cover
---

# Anthony Fu

<div class="leading-8 opacity-80">
Vue core team member and Vite team member.<br>
Creator of VueUse, i18n Ally and Type Challenges.<br>
A fanatical full-time open sourceror.<br>
</div>

<div class="my-10 grid grid-cols-[40px,1fr] w-min gap-y-4 all-child:block all-child:my-auto">
  <ri-github-line class="opacity-50"/>
  <div><a href="https://github.com/antfu" target="_blank">antfu</a></div>
  <ri-twitter-line class="opacity-50"/>
  <div><a href="https://twitter.com/antfu7" target="_blank">antfu7</a></div>
  <ri-user-3-line class="opacity-50"/>
  <div><a href="https://antfu.me" target="_blank">antfu.me</a></div>
</div>

<img src="https://antfu.me/avatar.png" class="rounded-full w-40 abs-tr mt-16 mr-12"/>

---
layout: center
---

<img class="h-100 -mt-10" src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png" /><br>
<div class="text-center text-xs opacity-50 -mt-8 hover:opacity-100">
  <a href="https://github.com/sponsors/antfu" target="_blank">
    Sponsor me at GitHub
  </a>
</div>

---
name: VueUse
layout: center
---

<div class="grid grid-cols-[3fr,2fr] gap-4">
  <div class="text-center pb-4">
    <img class="h-50 inline-block" src="https://github.com/vueuse/vueuse/blob/main/packages/public/logo-vertical.png?raw=true">
    <div class="opacity-50 mb-2 text-sm">
      Collection of essential Vue Composition Utilities
    </div>
    <div class="text-center">
      <a class="!border-none" href="https://www.npmjs.com/package/@vueuse/core" target="__blank"><img class="h-4 inline mx-0.5" src="https://img.shields.io/npm/v/@vueuse/core?color=a1b858&label=" alt="NPM version"></a>
      <a class="!border-none" href="https://www.npmjs.com/package/@vueuse/core" target="__blank"><img class="h-4 inline mx-0.5" alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vueuse/core?color=50a36f&label="></a>
      <a class="!border-none" href="https://vueuse.org" target="__blank"><img class="h-4 inline mx-0.5" src="https://img.shields.io/static/v1?label=&message=docs%20%26%20demos&color=1e8a7a" alt="Docs & Demos"></a>
      <img class="h-4 inline mx-0.5" alt="Function Count" src="https://img.shields.io/badge/-114%20functions-13708a">
      <br>
      <a class="!border-none" href="https://github.com/vueuse/vueuse" target="__blank"><img class="mt-2 h-4 inline mx-0.5" alt="GitHub stars" src="https://img.shields.io/github/stars/vueuse/vueuse?style=social"></a>
    </div>
  </div>
  <div class="border-l border-gray-400 border-opacity-25 !all:leading-12 !all:list-none my-auto">

  - Works for both Vue 2 and 3
  - Tree-shakeable ESM
  - CDN compatible
  - TypeScript
  - Rich ecosystems

  </div>
</div>

---
layout: center
---

# Composition API

------

# Store

- `ref`
- `shallowRef`
- `reactive`
- `shallowReactive`

------

<div class="grid grid-cols-2 gap-x-4"><div>

# Ref

```ts{monaco}
import { ref } from 'vue'

let foo = 0
let bar = ref(0)

foo = 1
bar = 1 // ts-error
```

### Pros

- More explicit, with type checking
- Less caveats

### Cons

- `.value`

</div><div>

# Reactive

```ts{monaco}
import { reactive } from 'vue'

const foo = { prop: 0 }
const bar = reactive({ prop: 0 })

foo.prop = 1
bar.prop = 1
```

### Pros

- Auto unwrapping (a.k.a `.value` free)

### Cons

- Same as plain object on types
- Destructure loses reactivity
- Need to use callback for `watch`

</div></div>

------

# Ref Auto Unwrapping

Get rid of `.value` for most of the time.

<div class="grid grid-cols-2 gap-x-4">

- `watch` accept ref for the watch target, and returns the unwrapped value in the callback

```ts
const counter = ref(0)

watch(counter, count => {
  console.log(count) // same as `counter.value`
})
```

- Ref is auto unwrapped in the template

```html
<template>
  <button @click="counter += 1">
    Counter is {\{ counter }}
  </button>
</template>
```

- Use `unref`

```ts
import { unref } from 'vue'
unref(counter) // same as `counter.value`
```

</div>

------

# Object of Refs

Getting benefits from both `ref` and `reactive` for authoring compsosable functions

<div class="mt-1" />
<div class="grid grid-cols-2 gap-x-4">

```ts{monaco}
import { ref, reactive } from 'vue'

function useMouse() {
  return { 
    x: ref(0),
    y: ref(0)
  }
}

const { x, y } = useMouse()
const mouse = reactive(useMouse())

mouse.x === x.value // true
```

<div class="px-2 py-4">

- Destructurable as Ref
- Convert to reactive object to get the auto-unwrapping when needed

</div></div>

------

# Effects (Watchers)

- computed `sync` `immediate` `lazy-evaluate` `auto-collect`
- watch `buffered` `auto-unregister` `lazy`
- watchEffect `buffered` `immediate` `auto-collect`

------

# Flush?

- Computed
- Watch pre / sync
- Effect collecting

---
layout: center
---

# Patterns

------

# Think as "Connections"

- Input -> Output
- Spreadsheet formuala

------

# Make it Flexible

Take the `useTitle` function from VueUse as an example

<div class="grid grid-cols-2 gap-x-4">

### Create a "Special" Ref

### Binding an existing ref

```ts{monaco}
import { useTitle } from '@vueuse/core'

const title = useTitle()

title.value = 'Hello World'
// now the page's title changed
```

```ts{monaco}
import { ref, computed } from 'vue'
import { useTitle } from '@vueuse/core'

const name = ref('Hello')
const title = computed(() => {
  return `${name.value} - World`
})

useTitle(title) // Hello - World

name.value = 'Hi' // Hi - World
```

</div>

------

# Passing Refs as Arguments

```ts

```

- `MaybeRef<T>` + `unref`

```ts
type MaybeRef<T> = T | Ref<T> 
```

------

# Reactify normal functions

- `reactify`
- Vue Chemistry

------

# Async to "Sync"

- Access dom element
- Instead of `onMounted`, we can just use `watch`
- `asyncComputed`
- `useFetch().json()`

------

# One at a time

- Divide huge function into a set of small one
- Each with a clear name
- Just same as how you program 

------

# Side-effects self cleanup

- useEventLisener

------

# effectScope RFC

---
layout: center
---

# Tips

------

# useVModel

- A helper to make props/emit easier

------

# Typed Inject / Provide

- hello

------

# App Level Singleton

- lazy inject / provide

------

# Ending

All of them, work for both Vue 2 and 3.

- vue-demi
- Vue 2.7

------

# Recap:

- Think as "Connections"
- Accepting ref as arguments
- Side-effect self clean up

---
layout: center
---

# Thanks
