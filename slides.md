---
layout: cover
---

# Composable Vue

Pattens and tips for writing good composable logic in Vue

<div class="uppercase text-sm tracking-widest">
Anthony Fu
</div>

<div class="abs-bl m-14 text-sm opacity-50">
Apr. 28th, 2021.
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

<div v-click class="my-10 grid grid-cols-[40px,1fr] w-min gap-y-4 all-child:block all-child:my-auto">
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
layout: center
---

# Composable Vue

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

<div class="grid grid-cols-2 gap-x-4"><div>

# Ref

```ts{monaco}
import { ref } from 'vue'

let foo = 0
let bar = ref(0)

foo = 1
bar = 1 // ts-error
```

<div v-click>

### Pros

- More explicit, with type checking
- Less caveats

### Cons

- `.value`

</div>

</div><div>

# Reactive

```ts{monaco}
import { reactive } from 'vue'

const foo = { prop: 0 }
const bar = reactive({ prop: 0 })

foo.prop = 1
bar.prop = 1
```

<div v-click>

### Pros

- Auto unwrapping (a.k.a `.value` free)

### Cons

- Same as plain objects on types
- Destructure loses reactivity
- Need to use callback for `watch`

</div>
</div></div>

------

# Ref Auto Unwrapping <MarkerCore />

Get rid of `.value` for most of the time.

<div class="grid grid-cols-2 gap-x-4">

<v-clicks :every='2'>

- `watch` accepts ref as the watch target, and returns the unwrapped value in the callback

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

- Reactive will auto-unwrap nested refs.

<div>

```ts{monaco}
import { ref, reactive } from 'vue'
const foo = ref('bar')
const data = reactive({ foo, id: 10 })
data.foo // 'bar'
```

</div>

</v-clicks>

</div>

------

# `unref` - Oppsite of Ref <MarkerCore />

- If it gets a Ref, returns the value of it.
- Otherwise, returns as-is.

<div class="grid grid-cols-2 gap-x-4 mt-4">

<div>

### Implementation

```ts
function unref<T>(r: Ref<T> | T): T {
  return isRef(r) ? r.value : r
}
```

</div><div>

### Usage

```ts{monaco}
import { unref, ref } from 'vue'

const foo = ref('foo')
unref(foo) // 'foo'

const bar = 'bar'
unref(bar) // 'bar'
```

</div></div>

------

# Shallow

> TODO:

------

# Effects (Watchers)

- computed `sync` `immediate` `lazy-evaluate` `auto-collect`
- watch `buffered` `auto-unregister` `lazy`
- watchEffect `buffered` `immediate` `auto-collect`

> TODO:

------

# Flush?

- Computed
- Watch pre / sync
- Effect collecting

> TODO:

---
layout: center
---

# Patterns

------

# Think as "Connections"

The `setup()` only runs **once** on component initialization, to construct the relations between your state and logic.

- Input -> Output
- Spreadsheet formuala

> TODO:

------

# One Thing at a Time

> TODO:

------

# Passing Refs as Arguments <MarkerPattern />

<div class="grid grid-cols-[160px,1fr,180px] gap-x-4">

<div />

### Implementation

### Usage

<v-clicks :every='3'>

<div class="my-auto leading-6 text-base opacity-75">
Plain function
</div>


```ts
function add(a: number, b: number) {
  return a + b
}
```

```ts
let a = 1
let b = 2

let c = add(a, b) // 3
```

<div class="my-auto leading-6 text-base opacity-75">
Accpets refs,<br>
returns a reactive result.
</div>

```ts
function add(a: Ref<number>, b: Ref<number>) {
  return computed(() => a.value + b.value)
}
```

```ts
const a = ref(1)
const b = ref(2)

const c = add(a, b)
c.value // 3
```

<div class="my-auto leading-6 text-base opacity-75">
Accpets both refs and plain values.
</div>

```ts
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
```

```ts
const a = ref(1)

const c = add(a, 5)
c.value // 6
```

</v-clicks>

</div>

------

# Make it Flexible <MarkerPattern />

Take the `useTitle` function from VueUse as an example

<div class="grid grid-cols-2 gap-x-4">

<div v-click>

### Create a "Special" Ref

```ts{monaco}
import { useTitle } from '@vueuse/core'

const title = useTitle()

title.value = 'Hello World'
// now the page's title changed
```

</div><div v-click>

### Binding an Existing Ref

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

</div></div>

<div v-click class="abs-b mx-14 my-12">
<VueUse name="useTitle"/>
</div>

------

# MaybeRef <MarkerTips/>

A custom type helper

```ts
type MaybeRef<T> = Ref<T> | T
```

<v-click>

In VueUse, we use this helper heavily to support optional reactive arguments

```ts
export function useTimeAgo(
  time: MaybeRef<Date | number | string>,
  options: TimeAgoOptions = {},
) {
  return computed(() => someFormating(unref(time)))
}
```

```ts
useTimeAgo(1618478282830) // 5 mins ago

const time = ref('2021-04-28')
const timeString = useTimeAgo(time) // Today
```

</v-click>

------

# Object of Refs <MarkerPattern />

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

# Reactify Normal Functions <MarkerTips />

- `reactify`
- Vue Chemistry

<div class="abs-b mx-14 my-12">
<VueUse name="reactify"/>
</div>

------

# Async to "Sync" <MarkerTips />

- Access dom element
- Instead of `onMounted`, we can just use `watch`
- `asyncComputed`
- `useFetch().json()`

------

# Side-effects Self Cleanup <MarkerPattern />

The `watch` and `computed` will stop themselves on components unmounted. <br>We'd recommend following the same pattern for your custom composable functions.

<div>

```ts{monaco}
import { onUnmounted } from 'vue'

export function useEventListener(target: EventTarget, name: string, fn: any) {
  target.addEventListener(name, fn)

  const stop = () => target.removeEventListener(name, fn)

  onUnmounted(stop) // <--

  return stop
}
```

</div>

<div class="abs-b mx-14 my-12">
<VueUse name="useEventListener"/>
</div>

<!--
Lower the mental burden
-->

------

# `effectScope` RFC <Marker class="text-green-500">Core?</Marker>

A new API to collect the side effects automatically. Likely to be shipped with Vue 3.1<br>
https://github.com/vuejs/rfcs/pull/212


```ts
// effect, computed, watch, watchEffect created inside the scope will be collected

const scope = effectScope(() => {
  const doubled = computed(() => counter.value * 2)

  watch(doubled, () => console.log(double.value))

  watchEffect(() => console.log('Count: ', double.value))
})

// to dispose all effects in the scope
stop(scope)
```

---
layout: center
---

# Tips

------

# Template Ref <MarkerTips />

> TODO:

------

# Typed Provide / Inject <MarkerCore/>
Use the `InjectionKey<T>` helper from Vue to share types across context.

<div>

```ts{monaco}
// context.ts
import { InjectionKey } from 'vue'

export interface UserInfo {
  id: number
  name: string
}

export const injectKeyUser: InjectionKey<UserInfo> = Symbol()
```

</div>

------

# Typed Provide / Inject <MarkerCore/>
Use the `InjectionKey<T>` helper from Vue to share types across context.

<div class="grid grid-cols-2 gap-4">

```ts{monaco}
// parent.vue
import { provide } from 'vue' 
import { injectKeyUser } from './context'

export default {
  setup() {
    provide(injectKeyUser, {
      id: '7', // type error: should be number
      name: 'Anthony'
    })
  }
}
```

```ts{monaco}
// child.vue
import { inject } from 'vue' 
import { injectKeyUser } from './context'

export default {
  setup() {
    const user = inject(injectKeyUser) 
    // UserInfo | undefined

    if (user)
      console.log(user.name) // Anthony
  }
}
```

</div>

<script setup>
import * as monaco from 'monaco-editor'

monaco.languages.typescript.typescriptDefaults.addExtraLib(
`
import { InjectionKey } from 'vue'
export interface UserInfo { id: number; name: string }
export const injectKeyUser: InjectionKey<UserInfo> = Symbol()
`,
  'file:///root/context.ts'
);
</script>

------

# App Level Singleton

- lazy inject / provide

> TODO:

------

# useVModel

A helper to make props/emit easier

> TODO:


<div class="abs-b mx-14 my-12">
<VueUse name="useVModel"/>
</div>

---
layout: center
---

# All of them work for both Vue 2 and 3

------

# `@vue/composition-api`

> TODO:

------

# Vue 2.7

> TODO:

------

# Vue Demi

> TODO:

------

# Recap:

- Think as "Connections"
- Accepting ref as arguments
- Side-effect self clean up

> TODO:

---
layout: center
---

# Thanks
