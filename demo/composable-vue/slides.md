---
layout: cover
download: 'https://antfu.me/talks/2021-04-29'
highlighter: shiki
# monaco: true
info: |
  ## Composable Vue

  Pattens and tips for writing good composable logic in Vue

  [Anthony Fu](https://antfu.me/) at [VueDay 2021](https://2021.vueday.it/)

  - [Recording](https://www.youtube.com/watch?v=IMJjP6edHd0)
  - [Transcript](https://antfu.me/posts/composable-vue-vueday-2021)
  - [Source code](https://github.com/antfu/talks/tree/master/2021-04-29)
---

# Composable Vue

Pattens and tips for writing good composable logic in Vue

<div class="uppercase text-sm tracking-widest">
Anthony Fu
</div>

<div class="abs-bl mx-14 my-12 flex">
  <img src="https://2020.vueday.it/img/themes/vueday/vueday-logo.png" class="h-8">
  <div class="ml-3 flex flex-col text-left">
    <div><b>Vue</b>Day</div>
    <div class="text-sm opacity-50">Apr. 29th, 2021</div>
  </div>
</div>


---
layout: 'intro'
---

# Anthony Fu

<div class="leading-8 opacity-80">
Vue core team member and Vite team member.<br>
Creator of VueUse, i18n Ally and Type Challenges.<br>
A fanatical full-time open sourceror.<br>
</div>

<div class="my-10 grid grid-cols-[40px_1fr] w-min gap-y-4">
  <ri-github-line class="opacity-50"/>
  <div><a href="https://github.com/antfu" target="_blank">antfu</a></div>
  <ri-twitter-line class="opacity-50"/>
  <div><a href="https://twitter.com/antfu7" target="_blank">antfu7</a></div>
  <ri-user-3-line class="opacity-50"/>
  <div><a href="https://antfu.me" target="_blank">antfu.me</a></div>
</div>

<img src="https://antfu.me/avatar.png" class="rounded-full w-40 abs-tr mt-16 mr-12"/>


---
name: Sponsors
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

<div class="grid grid-cols-[3fr_2fr] gap-4">
  <div class="text-center pb-4">
    <img class="h-50 inline-block" src="https://vueuse.org/favicon.svg">
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
class: text-center
---

# Composition API

a brief go-through


---

<div class="grid grid-cols-2 gap-x-4"><div>

# Ref

```ts {monaco}
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

```ts {monaco}
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


---

# Ref Auto Unwrapping <MarkerCore />

Get rid of `.value` for most of the time.

<div class="grid grid-cols-2 gap-x-4">

<v-clicks :every='2'>

- `watch` accepts ref as the watch target, and returns the unwrapped value in the callback

```ts
const counter = ref(0)

watch(counter, (count) => {
  console.log(count) // same as `counter.value`
})
```

- Ref is auto unwrapped in the template

```html
<template>
  <button @click="counter += 1">
    Counter is {{ counter }}
  </button>
</template>
```

- Reactive will auto-unwrap nested refs.

<div>

```ts {monaco}
import { reactive, ref } from 'vue'
const foo = ref('bar')
const data = reactive({ foo, id: 10 })
data.foo // 'bar'
```

</div>

</v-clicks>

</div>


---

# `unref` - Opposite of Ref <MarkerCore />

- If it gets a Ref, returns the value of it.
- Otherwise, returns as-is.

<div class="grid grid-cols-2 gap-x-4 mt-4">

<div v-click>

### Implementation

```ts
function unref<T>(r: Ref<T> | T): T {
  return isRef(r) ? r.value : r
}
```

</div><div v-click>

### Usage

```ts {monaco}
import { ref, unref } from 'vue'

const foo = ref('foo')
unref(foo) // 'foo'

const bar = 'bar'
unref(bar) // 'bar'
```

</div></div>


---
layout: center
class: text-center
---

# Patterns & Tips

of writing composable functions


---

# What's Composable Functions

Sets of reusable logic, separation of concerns.

<div v-click class="grid grid-cols-[1fr_130px]">

```ts
export function useDark(options: UseDarkOptions = {}) {
  const preferredDark = usePreferredDark() // <--
  const store = useStorage('vueuse-dark', 'auto') // <--

  return computed<boolean>({
    get() {
      return store.value === 'auto'
        ? preferredDark.value
        : store.value === 'dark'
    },
    set(v) {
      store.value = v === preferredDark.value
        ? 'auto'
        : v ? 'dark' : 'light'
    },
  })
}
```

<div class="grid">
<DarkToggle class="m-auto"/>
</div>

</div>

<div v-click class="abs-b mx-14 my-12">
<VueUse name="useDark"/>
</div>


---

# Think as "Connections"

The `setup()` only runs **once** on component initialization, to construct the relations between your state and logic.

- Input → Output<sup class="ml-1 opacity-50">Effects</sup>
- Output reflects to input's changes automatically

<div class="grid grid-cols-[auto_1fr] gap-4">
  <Connections v-click class="mt-4"/>
  <div v-click class="p-4">
    <h3 class="pb-2">SpreadSheet Formula</h3>
    <img class="h-40" src="https://cdn.wallstreetmojo.com/wp-content/uploads/2019/01/Division-Formula-in-Excel-Example-1-1.png">
  </div>
</div>


---

# One Thing at a Time

Just the same as authoring JavaScript functions.

- Extract duplicated logics into composable functions
- Have meaningful names
- Consistent naming conversions - `useXX` `createXX` `onXX`
- Keep function small and simple
- "Do one thing, and do it well"


---

# Passing Refs as Arguments <MarkerPattern />

<div class="grid grid-cols-[160px_1fr_180px] gap-x-4">

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
const a = 1
const b = 2

const c = add(a, b) // 3
```

<div class="my-auto leading-6 text-base opacity-75">
Accepts refs,<br>
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
Accepts both refs and plain values.
</div>

```ts
function add(
  a: Ref<number> | number,
  b: Ref<number> | number,
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


---

# MaybeRef <MarkerTips/>

A custom type helper

```ts
type MaybeRef<T> = Ref<T> | T
```

<v-click>

In VueUse, we use this helper heavily to support optional reactive arguments


```ts
export function useTimeAgo(
  time: Date | number | string | Ref<Date | number | string>,
) {
  return computed(() => someFormating(unref(time)))
}
```

```ts {monaco}
import type { Ref } from 'vue'
import { computed, unref } from 'vue'

type MaybeRef<T> = Ref<T> | T

export function useTimeAgo(
  time: MaybeRef<Date | number | string>,
) {
  return computed(() => someFormating(unref(time)))
}
```

</v-click>


---

# Make it Flexible <MarkerPattern />

Make your functions like LEGO, can be used with different components in different ways.

<div class="grid grid-cols-2 gap-x-4">

<div v-click>

### Create a "Special" Ref

```ts {monaco}
import { useTitle } from '@vueuse/core'

const title = useTitle()

title.value = 'Hello World'
// now the page's title changed
```

</div><div v-click>

### Binding an Existing Ref

```ts {monaco}
import { computed, ref } from 'vue'
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


---

# `useTitle` <Marker class="text-blue-400">Case</Marker>

Take a look at `useTitle`'s implementation

<div class="grid grid-cols-2 gap-4">
<v-clicks>

```ts {monaco}
import { ref, watch } from 'vue'
import type { MaybeRef } from '@vueuse/core'

export function useTitle(
  newTitle: MaybeRef<string | null | undefined>,
) {
  const title = ref(newTitle || document.title)

  watch(title, (t) => {
    if (t != null)
      document.title = t
  }, { immediate: true })

  return title
}
```

```html






<-- 1. use the user provided ref or create a new one

<-- 2. sync ref changes to the document title

```

</v-clicks>
</div>


---

# "Reuse" Ref <MarkerCore />

<v-clicks>

If you pass a `ref` into `ref()`, it will return the original ref as-is.

```ts
const foo = ref(1) // Ref<1>
const bar = ref(foo) // Ref<1>

foo === bar // true
```


```ts
function useFoo(foo: Ref<string> | string) {
  // no need!
  const bar = isRef(foo) ? foo : ref(foo)

  // they are the same
  const bar = ref(foo)

  /* ... */
}
```

Extremely useful in composable functions that take uncertain argument types.

</v-clicks>


---

# `ref` / `unref` <MarkerTips />

<div v-click>

- `MaybeRef<T>` works well with `ref` and `unref`.
- Use `ref()` when you want to normalized it as a Ref.
- Use `unref()` when you want to have the value.

<br>

```ts
type MaybeRef<T> = Ref<T> | T

function useBala<T>(arg: MaybeRef<T>) {
  const reference = ref(arg) // get the ref
  const value = unref(arg) // get the value
}
```

</div>


---

# Object of Refs <MarkerPattern />

Getting benefits from both `ref` and `reactive` for authoring composable functions

<div class="mt-1" />
<div class="grid grid-cols-2 gap-x-4">
<v-clicks>

```ts {monaco}
import { reactive, ref } from 'vue'

function useMouse() {
  return {
    x: ref(0),
    y: ref(0),
  }
}

const { x, y } = useMouse()
const mouse = reactive(useMouse())

mouse.x === x.value // true
```

<div class="px-2 py-4">

- Destructurable as Ref
- Convert to reactive object to get the auto-unwrapping when needed

</div>

</v-clicks>
</div>


---

# Async to "Sync" <MarkerTips />

With Composition API, we can actually turn async data into "sync"

<div v-click>

### Async

```ts
const data = await fetch('https://api.github.com/').then(r => r.json())

// use data
```

</div>
<div v-click>

### Composition API

```ts
const { data } = useFetch('https://api.github.com/').json()

const user_url = computed(() => data.value?.user_url)
```

</div>
<div v-click>

Establish the "Connections" first, then wait for data to be filled up. The idea is similar to SWR (stale-while-revalidate)

</div>


---

# `useFetch` <Marker class="text-blue-400">Case</Marker>

<v-click>

```ts
export function useFetch<R>(url: MaybeRef<string>) {
  const data = shallowRef<T | undefined>()
  const error = shallowRef<Error | undefined>()

  fetch(unref(url))
    .then(r => r.json())
    .then(r => data.value = r)
    .catch(e => error.value = e)

  return {
    data,
    error,
  }
}
```

</v-click>

<div v-click class="abs-b mx-14 my-12">
<VueUse name="useFetch"/>
</div>


---

# Side-effects Self Cleanup <MarkerPattern />

The `watch` and `computed` will stop themselves on components unmounted.<br>
We'd recommend following the same pattern for your custom composable functions.

<div v-click>

```ts {monaco}
import { onUnmounted } from 'vue'

export function useEventListener(target: EventTarget, name: string, fn: any) {
  target.addEventListener(name, fn)

  onUnmounted(() => {
    target.removeEventListener(name, fn) // <--
  })
}
```

</div>

<div v-click class="abs-b mx-14 my-12">
<VueUse name="useEventListener"/>
</div>

<!--
Lower the mental burden
-->

---

# `effectScope` RFC <Marker class="text-purple-400">Upcoming</Marker>

A new API to collect the side effects automatically. Likely to be shipped with Vue 3.1<br>
https://github.com/vuejs/rfcs/pull/212

```ts
// effect, computed, watch, watchEffect created inside the scope will be collected

const scope = effectScope(() => {
  const doubled = computed(() => counter.value * 2)

  watch(doubled, () => console.log(double.value))

  watchEffect(() => console.log('Count: ', double.value))
})

// dispose all effects in the scope
stop(scope)
```


---
disabled: true
---

# Template Ref <MarkerTips />

To get DOM element, you can pass a ref to it, and it will be available after component mounted

<div v-click>

```ts {monaco}
import { defineComponent, onMounted, ref } from 'vue'
export default defineComponent({
  setup() {
    const element = ref<HTMLElement | undefined>()

    onMounted(() => {
      element.value // now you have it
    })

    return { element }
  },
})
```

```html {monaco}
<template>
  <div ref="element"><!-- ... --></div>
</template>
```

</div>


---
disabled: true
---

# Template Ref <MarkerTips />

Use `watch` instead of `onMounted` to unify the handling for template ref changes.

<div>
<v-click>

```ts {monaco}
import { defineComponent, ref, watch } from 'vue'
export default defineComponent({
  setup() {
    const element = ref<HTMLElement | undefined>()

    watch(element, (el) => {
      // clean up previous side effect
      if (el) {
        // use the DOM element
      }
    })

    return { element }
  },
})
```

</v-click>
</div>


---

# Typed Provide / Inject <MarkerCore/>

Use the `InjectionKey<T>` helper from Vue to share types across context.

<div v-click>

```ts {monaco}
// context.ts
import type { InjectionKey } from 'vue'

export interface UserInfo {
  id: number
  name: string
}

export const injectKeyUser: InjectionKey<UserInfo> = Symbol('user')
```

</div>


---

# Typed Provide / Inject <MarkerCore/>

Import the key from the same module for `provide` and `inject`.

<div class="grid grid-cols-2 gap-4">
<v-clicks>

```ts {monaco}
// parent.vue
import { provide } from 'vue'
import { injectKeyUser } from './context'

export default {
  setup() {
    provide(injectKeyUser, {
      id: '7', // type error: should be number
      name: 'Anthony',
    })
  },
}
```

```ts {monaco}
// child.vue
import { inject } from 'vue'
import { injectKeyUser } from './context'

export default {
  setup() {
    const user = inject(injectKeyUser)
    // UserInfo | undefined

    if (user)
      console.log(user.name) // Anthony
  },
}
```

</v-clicks>
</div>


---

# Shared State <MarkerPattern />

By the nature of Composition API, states can be created and used independently.

<div class="grid grid-cols-2 gap-4">

<v-click>

```ts
// shared.ts
import { reactive } from 'vue'

export const state = reactive({
  foo: 1,
  bar: 'Hello',
})
```

</v-click>

<div>
<v-clicks>

```ts
// A.vue
import { state } from './shared.ts'

state.foo += 1
```

```ts
// B.vue
import { state } from './shared.ts'

console.log(state.foo) // 2
```

</v-clicks>
</div>
</div>

<h3 v-click class="opacity-100">⚠️ But it's not SSR compatible!</h3>


---

# Shared State (SSR friendly) <MarkerPattern />

Use `provide` and `inject` to share the app-level state

<div class="grid grid-cols-[max-content_1fr] gap-4">

<v-click>

```ts
export const myStateKey: InjectionKey<MyState> = Symbol('state')

export function createMyState() {
  const state = {
    /* ... */
  }

  return {
    install(app: App) {
      app.provide(myStateKey, state)
    },
  }
}

export function useMyState(): MyState {
  return inject(myStateKey)!
}
```

</v-click>

<div>
<v-clicks>

```ts
// main.ts
const App = createApp(App)

app.use(createMyState())
```

```ts
// A.vue

// use everywhere in your app
const state = useMyState()
```

<div class="my-3">

- [Vue Router v4](https://github.com/vuejs/vue-router-next) is using the similar approach

</div>

</v-clicks>
</div>

</div>


---

# useVModel <MarkerTips />

A helper to make props/emit easier

<div class="grid grid-cols-2 gap-4">

<v-click>

```ts
export function useVModel(props, name) {
  const emit = getCurrentInstance().emit

  return computed({
    get() {
      return props[name]
    },
    set(v) {
      emit(`update:${name}`, v)
    },
  })
}
```

</v-click>

<div>

<v-click>

```ts
export default defineComponent({
  setup(props) {
    const value = useVModel(props, 'value')

    return { value }
  },
})
```

</v-click>
<br>
<v-click>

```html
<template>
  <input v-model="value" />
</template>
```

</v-click>
</div>
</div>

<div v-click class="abs-b mx-14 my-12">
<VueUse name="useVModel"/>
</div>


---
disabled: true
---

# useVModel (Passive) <MarkerTips />

Make the model able to be updated **independently** from the parent logic

<v-click>

```ts
export function usePassiveVModel(props, name) {
  const emit = getCurrentInstance().emit
  const data = ref(props[name]) // store the value in a ref

  watch(() => props.value, v => data.value = v) // sync the ref whenever the prop changes

  return computed({
    get() {
      return data.value
    },
    set(v) {
      data.value = v // when setting value, update the ref directly
      emit(`update:${name}`, v) // then emit out the changes
    },
  })
}
```

</v-click>


---
layout: center
---

# All of them work for both Vue 2 and 3


---

# `@vue/composition-api` <Marker class="text-teal-400">Lib</Marker>

Composition API support for Vue 2.<br><carbon-logo-github class="inline-block"/> [vuejs/composition-api](https://github.com/vuejs/composition-api)

```ts
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'

Vue.use(VueCompositionAPI)
```

```ts
import { reactive, ref } from '@vue/composition-api'
```


---

# Vue 2.7 <Marker class="text-purple-400">Upcoming</Marker>

[Plans in Vue 2.7](https://github.com/vuejs/rfcs/blob/ie11/active-rfcs/0000-vue3-ie11-support.md#for-those-who-absolutely-need-ie11-support)

- Backport `@vue/composition-api` into Vue 2's core.
- `<script setup>` syntax in Single-File Components.
- Migrate codebase to TypeScript.
- IE11 support.
- LTS.


---

# Vue Demi <Marker class="text-teal-400">Lib</Marker>

Creates Universal Library for Vue 2 & 3<br><carbon-logo-github class="inline-block"/> [vueuse/vue-demi](https://github.com/vueuse/vue-demi)

```ts
// same syntax for both Vue 2 and 3
import { defineComponent, reactive, ref } from 'vue-demi'
```

<img class="h-50 mx-auto" src="https://cdn.jsdelivr.net/gh/vueuse/vue-demi/assets/banner.png" />


---

# Recap

- Think as "Connections"
- One thing at a time
- Accepting ref as arguments
- Returns an object of refs
- Make functions flexible
- Async to "sync"
- Side-effect self clean up
- Shared state


---
layout: center
class: 'text-center pb-5 :'
---

# Thank You!

Slides can be found on [antfu.me](https://antfu.me)
