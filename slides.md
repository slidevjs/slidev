---
layout: cover
---

# Composable Vue

Pattens and tips for writing good composable logic in Vue

<div class="uppercase text-sm tracking-widest">
Anthony Fu
</div>

------

# Anthony Fu

> TODO:

<img src="https://antfu.me/avatar.png" class="rounded-full w-40 abs-tr mt-16 mr-12"/>

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

# `ref` vs `reactive`

## Return an object of refs 

- destructurable
- less caveats
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
