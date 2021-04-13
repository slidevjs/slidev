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
  <a href="https://github.com/antfu" target="_blank">antfu</a>
  <ri-twitter-line class="opacity-50"/>
  <a href="https://twitter.com/antfu7" target="_blank">antfu7</a>
  <ri-user-3-line class="opacity-50"/>
  <a href="https://antfu.me" target="_blank">antfu.me</a>
</div>

<img src="https://antfu.me/avatar.png" class="rounded-full w-40 abs-tr mt-16 mr-12"/>

---
layout: center
---

<img class="h-100" src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png" />

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

### Ref

```ts{monaco}
import { ref } from 'vue'

let foo = 0
const bar = ref(0)

foo = 1
bar = 1 // ts-error
```

- More explicitly, with type checking
- Less caveats

</div><div>


### Reactive

```ts{monaco:readonly}
import { reactive } from 'vue'

const foo = { prop: 0 }
const bar = reactive({ prop: 0 })

foo.prop = 1
bar.prop = 1
```

- Auto unwrapping (a.k.a `.value` free)
- Same as object on types
- No destructure
- Need to use callback for `watch`

</div></div>

------

# `.value`

<div class="grid grid-cols-2 gap-x-4">

```ts
const foo = ref(0)

watch(foo, (num) => {
  console.log(num)
  console.log(foo.value) // the same
})

console.log(unref(foo))
```


```ts
const foo = reactive({ a: })

watch(foo, (num) => {
  console.log(num)
  console.log(foo.value) // the same
})

console.log(unref(foo))
```

</div>

------

# Return an object of refs 

- destructurable
- convert to reactive when needed

------

# Auto dedup

- assigning the same value to a ref/reactive won't trigger effects 
- `triggerRef`

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

# Passing ref as arguments

- `MaybeRef<T>` + `unref`


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
