---
depends:
  - guide/syntax
tags: [syntax, client-api]
description: |
  Run a mount callback with DOM queries scoped to the current slide.
---

# Slide Element

`v-slide-el` runs a function once when its element is mounted, and hands that function DOM helpers limited to the current slide.

Inline template expressions cannot use `document` or `window`. Vue compiles `document.querySelector(...)` to `_ctx.document.querySelector(...)`, and `_ctx.document` is undefined. A function passed to `v-slide-el` is ordinary JavaScript, so `classList`, `style`, and the rest of the DOM API work inside it.

`$` and `$$` search the nearest `.slidev-page` only. A preloaded neighbor slide is a separate page, so it is not included.

```md
<div class="foo">Hello</div>

<div v-slide-el="(el, $) => $('.foo')?.classList.add('bar')" />

<div v-slide-el="(el, $, $$) => $$('.item').forEach(t => { t.style.color = 'red' })">
  <span class="item">A</span>
  <span class="item">B</span>
</div>
```

- `el` is the element the directive is attached to.
- `$` is `querySelector` on the current slide. It returns `null` when nothing matches.
- `$$` is `querySelectorAll` on the current slide, returned as an array.

The callback runs from the `mounted` hook. Slidev mounts the current slide and the slides next to it, so the callback also runs for a preloaded slide. Read `$page` and `$nav.currentPage` from the template expression when the effect should apply only while this slide is the one on screen:

```md
<div
  v-slide-el="(el, $) => {
    if ($page === $nav.currentPage)
      $('.foo')?.classList.add('bar')
  }"
/>
```

`v-slide-el` does not run again on update. A value that is not a function, and an element that sits outside a `.slidev-page`, are ignored.
